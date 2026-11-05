import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
  type HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { delay, mergeMap } from 'rxjs/operators';
import { buildDemoAccessToken } from '../auth/access-token';
import { APP_ENVIRONMENT } from '../config/app-environment';
import type {
  ApiResponse,
  CreateInsuranceDTO,
  CreateUserDTO,
  CreateVehicleTypeDTO,
  SaveBaseRateDTO,
  SaveServiceStatusDTO,
  SaveUserDTO,
  SaveVehicleDTO,
  UpdateInsuranceDTO,
  UpdateVehicleTypeDTO,
} from '../models';
import { DEMO_CREDENTIALS, mockApiStore } from './mock-api.store';

/**
 * @function ok
 * @description Construye una respuesta exitosa del contrato ApiResponse.
 * @param data Payload a devolver.
 * @param message Mensaje opcional.
 * @returns Envelope de éxito.
 */
function ok<T>(data: T, message = 'Respuesta exitosa'): ApiResponse<T> {
  return {
    data,
    success: true,
    message,
    showsMessage: false,
    errorCode: null,
    timestamp: new Date().toISOString(),
  };
}

/**
 * @function fail
 * @description Construye una respuesta de error del contrato ApiResponse.
 * @param message Mensaje visible para el usuario.
 * @param errorCode Código de error simulado.
 * @returns Envelope de error.
 */
function fail(message: string, errorCode = 'DEMO_ERROR'): ApiResponse<null> {
  return {
    data: null,
    success: false,
    message,
    showsMessage: true,
    errorCode,
    timestamp: new Date().toISOString(),
  };
}

/**
 * @function respond
 * @description Emite una HttpResponse simulada con un pequeño retardo.
 * @param body Cuerpo de la respuesta.
 * @param status Código HTTP.
 * @returns Observable de evento HTTP.
 */
function respond<T>(body: ApiResponse<T>, status = 200): Observable<HttpEvent<ApiResponse<T>>> {
  return of(new HttpResponse({ status, body })).pipe(delay(160));
}

/**
 * @function respondError
 * @description Emite un error HTTP simulado compatible con HttpClient.
 * @param body Cuerpo de error.
 * @param status Código HTTP.
 * @returns Observable que falla con HttpErrorResponse.
 */
function respondError(body: ApiResponse<null>, status = 400): Observable<HttpEvent<unknown>> {
  return timer(160).pipe(
    mergeMap(() =>
      throwError(
        () =>
          new HttpErrorResponse({
            status,
            statusText: 'Demo Error',
            error: body,
          }),
      ),
    ),
  );
}

/**
 * @function pathOf
 * @description Extrae la ruta relativa de una URL de API.
 * @param url URL completa o relativa de la petición.
 * @returns Ruta normalizada sin query string.
 */
function pathOf(url: string): string {
  try {
    const parsed = url.startsWith('http') ? new URL(url) : new URL(url, 'http://local');
    return parsed.pathname.replace(/\/+$/, '') || '/';
  } catch {
    return url.split('?')[0].replace(/\/+$/, '');
  }
}

/**
 * @function mockApiInterceptor
 * @description Intercepta peticiones HTTP y las resuelve con datos simulados en modo demo.
 * @param req Petición HTTP saliente.
 * @param next Siguiente manejador de la cadena.
 * @returns Observable con respuesta mock o la petición real.
 */
export const mockApiInterceptor: HttpInterceptorFn = (req, next) => {
  const env = inject(APP_ENVIRONMENT);

  if (!env.useMockApi) {
    return next(req);
  }

  const path = pathOf(req.url);
  const method = req.method.toUpperCase();
  const apiBase = pathOf(env.apiUrl || '/api');
  const relative = path.startsWith(apiBase) ? path.slice(apiBase.length) || '/' : path;
  const route = relative.startsWith('/') ? relative : `/${relative}`;

  return handleMockRequest(req, method, route);
};

/**
 * @function handleMockRequest
 * @description Enruta la petición simulada al manejador correspondiente.
 * @param req Petición original.
 * @param method Método HTTP.
 * @param route Ruta relativa al prefijo /api.
 * @returns Observable con la respuesta simulada.
 */
function handleMockRequest(
  req: HttpRequest<unknown>,
  method: string,
  route: string,
): Observable<HttpEvent<unknown>> {
  if (method === 'POST' && route === '/user/login') {
    return handleLogin(req);
  }

  if (method === 'GET' && route === '/menu') {
    return respond(ok([...mockApiStore.menus]));
  }

  const menuById = route.match(/^\/menu\/(\d+)$/);
  if (method === 'GET' && menuById) {
    const item = mockApiStore.menus.find((menu) => menu.id === Number(menuById[1]));
    return item ? respond(ok(item)) : respondError(fail('Menú no encontrado'), 404);
  }

  if (method === 'GET' && route === '/servicio/parametros-administracion') {
    if (mockApiStore.serviceParamsConflict) {
      return respondError(
        fail(
          'Las tarifas base no están configuradas o se encuentran inactivas. Comunícate con el administrador.',
          '409',
        ),
        409,
      );
    }

    return respond(
      ok({
        telefonos: mockApiStore.telefonos,
        usuariosTecnicos: mockApiStore.users.filter((user) => user.rolId === 2),
        gruas: mockApiStore.vehicles,
        estadosServicio: mockApiStore.statuses,
        aseguradoras: mockApiStore.insurances.filter((item) => item.activo),
      }),
    );
  }

  if (route === '/user/parametros-usuarios' && method === 'GET') {
    return respond(
      ok({
        tiposDocumento: mockApiStore.tiposDocumento,
        roles: mockApiStore.roles,
      }),
    );
  }

  if (route === '/vehiculo/parametros-vehiculos' && method === 'GET') {
    return respond(ok({ tiposVehiculo: mockApiStore.tiposVehiculo }));
  }

  const userMatch = route.match(/^\/user(?:\/(\d+))?$/);
  if (userMatch) {
    return handleUsers(method, userMatch[1] ? Number(userMatch[1]) : null, req);
  }

  const vehicleMatch = route.match(/^\/vehiculo(?:\/(\d+))?$/);
  if (vehicleMatch) {
    return handleVehicles(method, vehicleMatch[1] ? Number(vehicleMatch[1]) : null, req);
  }

  const insuranceMatch = route.match(/^\/aseguradora(?:\/(\d+))?$/);
  if (insuranceMatch) {
    return handleInsurances(method, insuranceMatch[1] ? Number(insuranceMatch[1]) : null, req);
  }

  const statusMatch = route.match(/^\/estado-servicio(?:\/(\d+))?$/);
  if (statusMatch) {
    return handleStatuses(method, statusMatch[1] ? Number(statusMatch[1]) : null, req);
  }

  const typeMatch = route.match(/^\/tipo-vehiculo(?:\/(\d+))?$/);
  if (typeMatch) {
    return handleVehicleTypes(method, typeMatch[1] ? Number(typeMatch[1]) : null, req);
  }

  if (route === '/tarifa-base/parametros-base-tarifaria' && method === 'GET') {
    return respond(ok({ aseguradoras: mockApiStore.insurances.filter((item) => item.activo) }));
  }

  const rateMatch = route.match(/^\/tarifa-base(?:\/(\d+))?$/);
  if (rateMatch && (method === 'POST' || method === 'PUT')) {
    return handleBaseRates(method, rateMatch[1] ? Number(rateMatch[1]) : null, req);
  }

  const menuMatch = route.match(/^\/menu(?:\/(\d+))?$/);
  if (menuMatch && method !== 'GET') {
    return handleMenus(method, menuMatch[1] ? Number(menuMatch[1]) : null, req);
  }

  if (method === 'GET' && route === '/menu/parametros-menus') {
    return respondError(
      fail('Contrato pendiente: la respuesta de parametros-menus no está documentada.'),
      404,
    );
  }

  return respondError(fail(`Ruta demo no implementada: ${method} ${route}`), 404);
}

/**
 * @function handleLogin
 * @description Valida las credenciales demo y emite la sesión simulada.
 * @param req Petición de login.
 * @returns Respuesta de autenticación simulada.
 */
function handleLogin(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
  const body = (req.body ?? {}) as { user?: string; password?: string };

  if (body.user === DEMO_CREDENTIALS.user && body.password === DEMO_CREDENTIALS.password) {
    return respond(
      ok({
        accessToken: buildDemoAccessToken(3600, { sub: 1, rolId: 1 }),
        tokenType: 'Bearer',
        expiresIn: 3600,
        usuarioId: 1,
        documento: DEMO_CREDENTIALS.user,
      }),
    );
  }

  return respondError(
    fail('Credenciales inválidas. En demo usa 1111111111 / admin.'),
    401,
  );
}

/**
 * @function handleUsers
 * @description CRUD simulado de usuarios.
 * @param method Método HTTP.
 * @param id Identificador opcional del usuario.
 * @param req Petición original.
 * @returns Respuesta simulada.
 */
function handleUsers(
  method: string,
  id: number | null,
  req: HttpRequest<unknown>,
): Observable<HttpEvent<unknown>> {
  if (method === 'GET' && id === null) {
    return respond(ok([...mockApiStore.users]));
  }

  if (method === 'GET' && id !== null) {
    const user = mockApiStore.users.find((item) => item.id === id);
    return user ? respond(ok(user)) : respondError(fail('Usuario no encontrado'), 404);
  }

  if (method === 'POST') {
    const dto = req.body as CreateUserDTO;
    const created = {
      id: mockApiStore.next(),
      tipoDocumentoId: Number(dto.tipoDocumentoId),
      documento: dto.documento,
      primerNombre: dto.primerNombre,
      segundoNombre: dto.segundoNombre || null,
      primerApellido: dto.primerApellido,
      segundoApellido: dto.segundoApellido || null,
      rolId: Number(dto.rolId),
      activo: true,
    };
    mockApiStore.users = [...mockApiStore.users, created];
    return respond(ok(created, 'Respuesta exitosa'), 201);
  }

  if (method === 'PUT' && id !== null) {
    const dto = req.body as SaveUserDTO;
    const updated = mockApiStore.users.map((user) =>
      user.id === id
        ? {
            ...user,
            tipoDocumentoId: Number(dto.tipoDocumentoId),
            documento: dto.documento,
            primerNombre: dto.primerNombre,
            segundoNombre: dto.segundoNombre || null,
            primerApellido: dto.primerApellido,
            segundoApellido: dto.segundoApellido || null,
            rolId: Number(dto.rolId),
          }
        : user,
    );
    mockApiStore.users = updated;
    const current = updated.find((user) => user.id === id);
    return current ? respond(ok(current)) : respondError(fail('Usuario no encontrado'), 404);
  }

  if (method === 'DELETE' && id !== null) {
    mockApiStore.users = mockApiStore.users.filter((user) => user.id !== id);
    return respond(ok(null, 'Usuario eliminado'));
  }

  return respondError(fail(`Operación de usuario no soportada: ${method}`), 405);
}

/**
 * @function handleVehicles
 * @description CRUD simulado de vehículos.
 * @param method Método HTTP.
 * @param id Identificador opcional del vehículo.
 * @param req Petición original.
 * @returns Respuesta simulada.
 */
function handleVehicles(
  method: string,
  id: number | null,
  req: HttpRequest<unknown>,
): Observable<HttpEvent<unknown>> {
  if (method === 'GET' && id === null) {
    return respond(ok([...mockApiStore.vehicles]));
  }

  if (method === 'GET' && id !== null) {
    const vehicle = mockApiStore.vehicles.find((item) => item.id === id);
    return vehicle ? respond(ok(vehicle)) : respondError(fail('Vehículo no encontrado'), 404);
  }

  if (method === 'POST') {
    const dto = req.body as SaveVehicleDTO;
    const tipo = mockApiStore.tiposVehiculo.find((item) => item.id === Number(dto.tipoVehiculoId));
    if (!tipo) {
      return respondError(fail('Tipo de vehículo no encontrado'), 400);
    }
    const created = {
      id: mockApiStore.next(),
      tipoVehiculo: tipo,
      placa: dto.placa,
      codigo: dto.codigo,
      activo: true,
    };
    mockApiStore.vehicles = [...mockApiStore.vehicles, created];
    return respond(ok(created), 201);
  }

  if (method === 'PUT' && id !== null) {
    const dto = req.body as SaveVehicleDTO;
    const tipo = mockApiStore.tiposVehiculo.find((item) => item.id === Number(dto.tipoVehiculoId));
    if (!tipo) {
      return respondError(fail('Tipo de vehículo no encontrado'), 400);
    }
    const updated = mockApiStore.vehicles.map((vehicle) =>
      vehicle.id === id
        ? {
            ...vehicle,
            tipoVehiculo: tipo,
            placa: dto.placa,
            codigo: dto.codigo,
          }
        : vehicle,
    );
    mockApiStore.vehicles = updated;
    const current = updated.find((vehicle) => vehicle.id === id);
    return current ? respond(ok(current)) : respondError(fail('Vehículo no encontrado'), 404);
  }

  if (method === 'DELETE' && id !== null) {
    mockApiStore.vehicles = mockApiStore.vehicles.filter((vehicle) => vehicle.id !== id);
    return respond(ok(null, 'Vehículo eliminado'));
  }

  return respondError(fail(`Operación de vehículo no soportada: ${method}`), 405);
}

/**
 * @function handleInsurances
 * @description CRUD simulado de aseguradoras.
 * @param method Método HTTP.
 * @param id Identificador opcional de la aseguradora.
 * @param req Petición original.
 * @returns Respuesta simulada.
 */
function handleInsurances(
  method: string,
  id: number | null,
  req: HttpRequest<unknown>,
): Observable<HttpEvent<unknown>> {
  if (method === 'GET' && id === null) {
    return respond(ok([...mockApiStore.insurances]));
  }

  if (method === 'GET' && id !== null) {
    const insurance = mockApiStore.insurances.find((item) => item.id === id);
    return insurance
      ? respond(ok(insurance))
      : respondError(fail('Aseguradora no encontrada'), 404);
  }

  if (method === 'POST') {
    const dto = req.body as CreateInsuranceDTO;
    const created = {
      id: mockApiStore.next(),
      nombre: dto.nombre,
      codigo: dto.codigo,
      activo: true,
    };
    mockApiStore.insurances = [...mockApiStore.insurances, created];
    return respond(ok(created), 201);
  }

  if (method === 'PUT' && id !== null) {
    const dto = req.body as UpdateInsuranceDTO;
    const updated = mockApiStore.insurances.map((insurance) =>
      insurance.id === id
        ? {
            ...insurance,
            nombre: dto.nombre,
            codigo: dto.codigo,
            activo: dto.activo,
          }
        : insurance,
    );
    mockApiStore.insurances = updated;
    const current = updated.find((insurance) => insurance.id === id);
    return current ? respond(ok(current)) : respondError(fail('Aseguradora no encontrada'), 404);
  }

  if (method === 'DELETE' && id !== null) {
    mockApiStore.insurances = mockApiStore.insurances.filter((insurance) => insurance.id !== id);
    return respond(ok(null, 'Aseguradora eliminada'));
  }

  return respondError(fail(`Operación de aseguradora no soportada: ${method}`), 405);
}

/**
 * @function handleStatuses
 * @description CRUD simulado de estados de servicio.
 * @param method Método HTTP.
 * @param id Identificador opcional del estado.
 * @param req Petición original.
 * @returns Respuesta simulada.
 */
function handleStatuses(
  method: string,
  id: number | null,
  req: HttpRequest<unknown>,
): Observable<HttpEvent<unknown>> {
  if (method === 'GET' && id === null) {
    return respond(ok([...mockApiStore.statuses]));
  }

  if (method === 'GET' && id !== null) {
    const status = mockApiStore.statuses.find((item) => item.id === id);
    return status ? respond(ok(status)) : respondError(fail('Estado no encontrado'), 404);
  }

  if (method === 'POST') {
    const dto = req.body as SaveServiceStatusDTO;
    const created = {
      id: mockApiStore.next(),
      descripcion: dto.descripcion,
      codigo: dto.codigo,
      activo: dto.activo,
    };
    mockApiStore.statuses = [...mockApiStore.statuses, created];
    return respond(ok(created), 201);
  }

  if (method === 'PUT' && id !== null) {
    const dto = req.body as SaveServiceStatusDTO;
    const updated = mockApiStore.statuses.map((status) =>
      status.id === id
        ? {
            ...status,
            descripcion: dto.descripcion,
            codigo: dto.codigo,
            activo: dto.activo,
          }
        : status,
    );
    mockApiStore.statuses = updated;
    const current = updated.find((status) => status.id === id);
    return current ? respond(ok(current)) : respondError(fail('Estado no encontrado'), 404);
  }

  if (method === 'DELETE' && id !== null) {
    mockApiStore.statuses = mockApiStore.statuses.filter((status) => status.id !== id);
    return respond(ok(null, 'Estado eliminado'));
  }

  return respondError(fail(`Operación de estado no soportada: ${method}`), 405);
}

/**
 * @function handleVehicleTypes
 * @description CRUD simulado de tipos de vehículo.
 * @param method Método HTTP.
 * @param id Identificador opcional.
 * @param req Petición original.
 * @returns Respuesta simulada.
 */
function handleVehicleTypes(
  method: string,
  id: number | null,
  req: HttpRequest<unknown>,
): Observable<HttpEvent<unknown>> {
  if (method === 'GET' && id === null) {
    return respond(ok([...mockApiStore.tiposVehiculo]));
  }

  if (method === 'GET' && id !== null) {
    const item = mockApiStore.tiposVehiculo.find((type) => type.id === id);
    return item ? respond(ok(item)) : respondError(fail('Tipo de vehículo no encontrado'), 404);
  }

  if (method === 'POST') {
    const dto = req.body as CreateVehicleTypeDTO;
    const created = {
      id: mockApiStore.next(),
      nombre: dto.nombre,
      codigo: dto.codigo,
      activo: true,
      carga: dto.carga,
    };
    mockApiStore.tiposVehiculo = [...mockApiStore.tiposVehiculo, created];
    return respond(ok(created), 201);
  }

  if (method === 'PUT' && id !== null) {
    const dto = req.body as UpdateVehicleTypeDTO;
    const updated = mockApiStore.tiposVehiculo.map((type) =>
      type.id === id ? { ...type, nombre: dto.nombre, codigo: dto.codigo, activo: dto.activo, carga: dto.carga } : type,
    );
    mockApiStore.tiposVehiculo = updated;
    const current = updated.find((type) => type.id === id);
    return current ? respond(ok(current)) : respondError(fail('Tipo de vehículo no encontrado'), 404);
  }

  if (method === 'DELETE' && id !== null) {
    mockApiStore.tiposVehiculo = mockApiStore.tiposVehiculo.filter((type) => type.id !== id);
    return respond(ok(null));
  }

  return respondError(fail(`Operación de tipo de vehículo no soportada: ${method}`), 405);
}

/**
 * @function handleBaseRates
 * @description Crea y actualiza tarifas base. No lista por /api/user.
 * @param method Método HTTP.
 * @param id Identificador opcional.
 * @param req Petición original.
 * @returns Respuesta simulada.
 */
function handleBaseRates(
  method: string,
  id: number | null,
  req: HttpRequest<unknown>,
): Observable<HttpEvent<unknown>> {
  if (method === 'POST') {
    const dto = req.body as SaveBaseRateDTO;
    const insurer = mockApiStore.insurances.find((item) => item.id === dto.aseguradora.id);
    if (!insurer) {
      return respondError(fail('Aseguradora no encontrada'), 400);
    }
    const created = {
      id: mockApiStore.next(),
      aseguradora: insurer,
      descripcion: dto.descripcion,
      valor: dto.valor,
      codigo: dto.codigo,
      activo: true,
    };
    mockApiStore.baseRates = [...mockApiStore.baseRates, created];
    return respond(ok(created), 201);
  }

  if (method === 'PUT' && id !== null) {
    const dto = req.body as SaveBaseRateDTO;
    const insurer = mockApiStore.insurances.find((item) => item.id === dto.aseguradora.id);
    if (!insurer) {
      return respondError(fail('Aseguradora no encontrada'), 400);
    }
    const updated = mockApiStore.baseRates.map((rate) =>
      rate.id === id
        ? { ...rate, aseguradora: insurer, descripcion: dto.descripcion, valor: dto.valor, codigo: dto.codigo }
        : rate,
    );
    mockApiStore.baseRates = updated;
    const current = updated.find((rate) => rate.id === id);
    return current ? respond(ok(current)) : respondError(fail('Tarifa base no encontrada'), 404);
  }

  return respondError(
    fail('Contrato pendiente: esa operación de tarifa base no tiene ruta confirmada.'),
    404,
  );
}

/**
 * @function handleMenus
 * @description Crea ítems de menú. Actualizar y eliminar quedan pendientes.
 * @param method Método HTTP.
 * @param id Identificador opcional.
 * @param req Petición original.
 * @returns Respuesta simulada.
 */
function handleMenus(
  method: string,
  id: number | null,
  req: HttpRequest<unknown>,
): Observable<HttpEvent<unknown>> {
  if (method === 'POST' && id === null) {
    const dto = req.body as { menuPadre: { id: number } | null; nombre: string; descripcion: string; codigo: string };
    const created = {
      id: mockApiStore.next(),
      padreMenuId: dto.menuPadre?.id ?? null,
      menuPadre: dto.menuPadre,
      nombre: dto.nombre,
      descripcion: dto.descripcion,
      codigo: dto.codigo,
      activo: true,
    };
    mockApiStore.menus = [...mockApiStore.menus, created];
    return respond(ok(created), 201);
  }

  return respondError(
    fail('Contrato pendiente: actualizar o eliminar menú no tiene una ruta confirmada.'),
    404,
  );
}
