import { HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { messageFromHttpError } from '../../../core/http/api-error';
import { envelope, httpProviders, realHttpEnvironment } from '../../../core/http/http-test.helpers';
import type { Insurance, ServiceStatus, TipoVehiculo, User, Vehicle } from '../../../core/models';
import { InsuranceService } from './insurance.service';
import { ServiceStatusService } from './service-status.service';
import { UserService } from './user.service';
import { VehicleTypeService } from './vehicle-type.service';
import { VehicleService } from './vehicle.service';

const user: User = {
  id: 4,
  tipoDocumentoId: 1,
  documento: '123',
  primerNombre: 'Luis',
  segundoNombre: null,
  primerApellido: 'Gómez',
  segundoApellido: null,
  rolId: 2,
  activo: true,
};

const tipo: TipoVehiculo = {
  id: 7,
  nombre: 'GRÚA',
  codigo: 'GRUA',
  activo: true,
  carga: true,
};

const vehicle: Vehicle = {
  id: 3,
  placa: 'ABC123',
  codigo: 'GR-1',
  tipoVehiculo: tipo,
  activo: true,
};

const insurer: Insurance = { id: 2, nombre: 'SURA', codigo: 'SURA', activo: true };
const status: ServiceStatus = { id: 1, descripcion: 'Pendiente', codigo: 'PEN', activo: true };

describe('administración HTTP', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: httpProviders(realHttpEnvironment) });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista y consulta usuarios', () => {
    const users = TestBed.inject(UserService);
    users.getUsers().subscribe((res) => expect(res.data).toEqual([user]));
    users.getUserById(4).subscribe((res) => expect(res.data?.documento).toBe('123'));

    http.expectOne('/api/user').flush(envelope([user]));
    const detail = http.expectOne('/api/user/4');
    expect(detail.request.method).toBe('GET');
    detail.flush(envelope(user));
  });

  it('crea, actualiza y elimina vehículos', () => {
    const vehicles = TestBed.inject(VehicleService);
    const body = { placa: 'ABC123', codigo: 'GR-1', tipoVehiculoId: 7 };
    vehicles.getVehicles().subscribe((res) => expect(res.data?.[0]?.tipoVehiculo.nombre).toBe('GRÚA'));
    vehicles.createVehicle(body).subscribe((res) => expect(res.success).toBe(true));
    vehicles.updateVehicle(3, body).subscribe((res) => expect(res.success).toBe(true));
    vehicles.deleteVehicle(3).subscribe((res) => expect(res.data).toBeNull());

    http.expectOne({ method: 'GET', url: '/api/vehiculo' }).flush(envelope([vehicle]));
    const created = http.expectOne({ method: 'POST', url: '/api/vehiculo' });
    expect(created.request.body).toEqual(body);
    created.flush(envelope(vehicle));
    http.expectOne({ method: 'PUT', url: '/api/vehiculo/3' }).flush(envelope(vehicle));
    http.expectOne({ method: 'DELETE', url: '/api/vehiculo/3' }).flush(envelope(null));
  });

  it('crea una aseguradora sin activo y actualiza con activo', () => {
    const insurances = TestBed.inject(InsuranceService);
    insurances.createInsurance({ nombre: 'SURA', codigo: 'SURA' }).subscribe();
    insurances.updateInsurance(2, { nombre: 'SURA', codigo: 'SURA', activo: false }).subscribe();
    insurances.deleteInsurance(2).subscribe((res) => expect(res.data).toBeNull());

    const created = http.expectOne({ method: 'POST', url: '/api/aseguradora' });
    expect(created.request.body).toEqual({ nombre: 'SURA', codigo: 'SURA' });
    created.flush(envelope(insurer));
    const updated = http.expectOne({ method: 'PUT', url: '/api/aseguradora/2' });
    expect(updated.request.body).toEqual({ nombre: 'SURA', codigo: 'SURA', activo: false });
    updated.flush(envelope({ ...insurer, activo: false }));
    http.expectOne({ method: 'DELETE', url: '/api/aseguradora/2' }).flush(envelope(null));
  });

  it('crea, actualiza y elimina estados de servicio', () => {
    const statuses = TestBed.inject(ServiceStatusService);
    const body = { descripcion: 'Pendiente', codigo: 'PEN', activo: true };
    statuses.createServiceStatus(body).subscribe();
    statuses.updateServiceStatus(1, body).subscribe();
    statuses.deleteServiceStatus(1).subscribe((res) => expect(res.data).toBeNull());

    http.expectOne({ method: 'POST', url: '/api/estado-servicio' }).flush(envelope(status));
    http.expectOne({ method: 'PUT', url: '/api/estado-servicio/1' }).flush(envelope(status));
    http.expectOne({ method: 'DELETE', url: '/api/estado-servicio/1' }).flush(envelope(null));
  });

  it('hace CRUD de tipos de vehículo', () => {
    const types = TestBed.inject(VehicleTypeService);
    types.getVehicleTypes().subscribe((res) => expect(res.data?.[0]?.carga).toBe(true));
    types.createVehicleType({ nombre: 'GRÚA', codigo: 'GRUA', carga: true }).subscribe();
    types.updateVehicleType(7, { nombre: 'GRÚA', codigo: 'GRUA', carga: true, activo: true }).subscribe();
    types.deleteVehicleType(7).subscribe((res) => expect(res.success).toBe(true));

    http.expectOne({ method: 'GET', url: '/api/tipo-vehiculo' }).flush(envelope([tipo]));
    const created = http.expectOne({ method: 'POST', url: '/api/tipo-vehiculo' });
    expect(created.request.body).not.toHaveProperty('activo');
    created.flush(envelope(tipo));
    http.expectOne({ method: 'PUT', url: '/api/tipo-vehiculo/7' }).flush(envelope(tipo));
    http.expectOne({ method: 'DELETE', url: '/api/tipo-vehiculo/7' }).flush(envelope(null));
  });

  it('expone el mensaje del backend en un error HTTP de administración', () => {
    const users = TestBed.inject(UserService);
    let text = '';
    users.getUsers().subscribe({
      error: (error: unknown) => {
        text = messageFromHttpError(error, 'No se pudo cargar el listado de usuarios.');
        expect(error).toBeInstanceOf(HttpErrorResponse);
      },
    });

    http.expectOne('/api/user').flush(
      envelope(null, { success: false, showsMessage: true, message: 'Sin permiso', errorCode: '403' }),
      { status: 403, statusText: 'Forbidden' },
    );

    expect(text).toBe('[403]: Sin permiso');
  });
});
