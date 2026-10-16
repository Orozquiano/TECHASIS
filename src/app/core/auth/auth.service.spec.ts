import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { buildDemoAccessToken } from './access-token';
import { AuthService } from './auth.service';
import { envelope, httpProviders, realHttpEnvironment } from '../http/http-test.helpers';
import { authInterceptor } from '../http/auth.interceptor';
import { HttpClient } from '@angular/common/http';
import type { MenuItem, User } from '../models';

const menu: MenuItem = {
  id: 1,
  padreMenuId: null,
  menuPadre: null,
  nombre: 'newService',
  descripcion: 'Nuevo servicio',
  codigo: '001',
  activo: true,
};

const profile: User = {
  id: 7,
  tipoDocumentoId: 1,
  documento: '1111111111',
  primerNombre: 'Ana',
  segundoNombre: null,
  primerApellido: 'Ruiz',
  segundoApellido: null,
  rolId: 1,
  activo: true,
};

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [...httpProviders(realHttpEnvironment), provideRouter([])],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('inicia sesión y guarda el perfil en sessionStorage cuando no se pide recordar', () => {
    let route = '';
    service.login({ user: '1111111111', password: 'secreta' }, false).subscribe((result) => {
      route = result.defaultRoute;
    });

    const login = http.expectOne('/api/user/login');
    expect(login.request.method).toBe('POST');
    expect(login.request.body).toEqual({ user: '1111111111', password: 'secreta' });
    login.flush(
      envelope({
        accessToken: buildDemoAccessToken(3600),
        tokenType: 'Bearer',
        expiresIn: 3600,
        usuarioId: 7,
        documento: '1111111111',
      }),
    );

    http.expectOne('/api/user/7').flush(envelope(profile));
    http.expectOne('/api/menu').flush(envelope([menu]));

    expect(route).toBe('newService');
    expect(sessionStorage.getItem('user_name')).toBe('Ana Ruiz');
    expect(sessionStorage.getItem('user_doc')).toBe('1111111111');
    expect(sessionStorage.getItem('user_id')).toBe('7');
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(service.isLoggedIn()).toBe(true);
  });

  it('guarda la sesión solo en localStorage cuando se pide recordar', () => {
    service.login({ user: '1111111111', password: 'secreta' }, true).subscribe();

    http.expectOne('/api/user/login').flush(
      envelope({
        accessToken: buildDemoAccessToken(3600),
        tokenType: 'Bearer',
        expiresIn: 3600,
        usuarioId: 7,
        documento: '1111111111',
      }),
    );
    http.expectOne('/api/user/7').flush(envelope(profile));
    http.expectOne('/api/menu').flush(envelope([menu]));

    expect(localStorage.getItem('auth_token')).toBeTruthy();
    expect(sessionStorage.getItem('auth_token')).toBeNull();
    expect(JSON.parse(localStorage.getItem('user_routes') ?? '[]')).toEqual([menu]);
  });

  it('rechaza el login cuando el backend responde success false', () => {
    let failed = false;
    service.login({ user: '1111111111', password: 'mala' }, false).subscribe({
      error: () => {
        failed = true;
      },
    });

    http.expectOne('/api/user/login').flush(
      envelope(null, { success: false, showsMessage: true, message: 'Credenciales inválidas', errorCode: '401' }),
    );

    expect(failed).toBe(true);
    expect(service.isLoggedIn()).toBe(false);
    expect(sessionStorage.getItem('auth_token')).toBeNull();
  });

  it('no considera autenticado un texto cualquiera ni mezcla dos almacenamientos', () => {
    sessionStorage.setItem('auth_token', 'no-es-un-jwt');
    expect(service.isLoggedIn()).toBe(false);

    sessionStorage.setItem('auth_token', buildDemoAccessToken(3600));
    localStorage.setItem('auth_token', buildDemoAccessToken(3600));
    expect(service.getToken()).toBeNull();
    expect(sessionStorage.getItem('auth_token')).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
  });
});

describe('authInterceptor', () => {
  let httpClient: HttpClient;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [...httpProviders(realHttpEnvironment, [authInterceptor]), provideRouter([])],
    });
    httpClient = TestBed.inject(HttpClient);
    http = TestBed.inject(HttpTestingController);
    sessionStorage.setItem('auth_token', buildDemoAccessToken(3600));
    sessionStorage.setItem('user_id', '7');
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('adjunta Authorization Bearer y cierra la sesión ante un 401', () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    let status = 0;

    httpClient.get('/api/user').subscribe({
      error: (error: { status: number }) => {
        status = error.status;
      },
    });

    const request = http.expectOne('/api/user');
    expect(request.request.headers.get('Authorization')).toBe(
      `Bearer ${sessionStorage.getItem('auth_token')}`,
    );
    request.flush(
      envelope(null, { success: false, showsMessage: true, message: 'No autorizado', errorCode: '401' }),
      { status: 401, statusText: 'Unauthorized' },
    );

    expect(status).toBe(401);
    expect(sessionStorage.getItem('auth_token')).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});
