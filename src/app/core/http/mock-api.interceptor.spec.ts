import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { demoHttpEnvironment, httpProviders } from './http-test.helpers';
import { mockApiInterceptor } from './mock-api.interceptor';
import { DEMO_CREDENTIALS, mockApiStore } from './mock-api.store';
import type { ApiResponse, TipoVehiculo, User } from '../models';

describe('mockApiInterceptor', () => {
  let client: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    mockApiStore.serviceParamsConflict = false;
    TestBed.configureTestingModule({
      providers: httpProviders(demoHttpEnvironment, [mockApiInterceptor]),
    });
    client = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    mockApiStore.serviceParamsConflict = false;
    http.verify();
  });

  it('responde el login demo con el envelope y un JWT utilizable', async () => {
    const response = await firstValueFrom(
      client.post<ApiResponse<{ accessToken: string; tokenType: string }>>('/api/user/login', DEMO_CREDENTIALS),
    );
    http.expectNone('/api/user/login');
    expect(response.success).toBe(true);
    expect(response.data?.tokenType).toBe('Bearer');
    expect(response.data?.accessToken.split('.')).toHaveLength(3);
  });

  it('devuelve 409 cuando las tarifas base no están configuradas', async () => {
    mockApiStore.serviceParamsConflict = true;
    let status = 0;
    let message = '';

    try {
      await firstValueFrom(client.get('/api/servicio/parametros-administracion'));
    } catch (error: unknown) {
      if (error instanceof HttpErrorResponse) {
        status = error.status;
        const body = error.error as { message?: string; showsMessage?: boolean };
        message = body.showsMessage && body.message ? body.message : '';
      }
    }

    http.expectNone('/api/servicio/parametros-administracion');
    expect(status).toBe(409);
    expect(message).toContain('tarifas base');
  });

  it('crea un tipo de vehículo con 201 y no trata /api/user como tarifas', async () => {
    const created = await firstValueFrom(
      client.post<ApiResponse<TipoVehiculo>>(
        '/api/tipo-vehiculo',
        { nombre: 'MOTO', codigo: 'MOTO', carga: false },
        { observe: 'response' },
      ),
    );
    const users = await firstValueFrom(client.get<ApiResponse<User[]>>('/api/user'));

    let pending = 0;
    try {
      await firstValueFrom(client.get('/api/tarifa-base'));
    } catch (error: unknown) {
      pending = error instanceof HttpErrorResponse ? error.status : 0;
    }

    http.expectNone(() => true);
    expect(created).toBeInstanceOf(HttpResponse);
    expect(created.status).toBe(201);
    expect(created.body?.data?.nombre).toBe('MOTO');
    expect(users.data?.some((item) => 'valor' in item)).toBe(false);
    expect(users.data?.[0]?.documento).toBeTruthy();
    expect(pending).toBe(404);
  });
});
