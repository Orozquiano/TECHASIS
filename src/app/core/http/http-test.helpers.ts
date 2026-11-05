import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import type { EnvironmentProviders, Provider } from '@angular/core';
import { APP_ENVIRONMENT } from '../config/app-environment';
import type { ApiResponse } from '../models';
import type { AppEnvironment } from '../../../environments/environment.model';

/**
 * @description Ambiente de prueba que apunta a HttpTestingController.
 */
export const realHttpEnvironment: AppEnvironment = {
  production: false,
  environmentName: 'test',
  apiUrl: '/api',
  useMockApi: false,
};

/**
 * @description Ambiente de prueba que activa el interceptor demo.
 */
export const demoHttpEnvironment: AppEnvironment = {
  production: false,
  environmentName: 'demo',
  apiUrl: '/api',
  useMockApi: true,
};

/**
 * @function envelope
 * @description Arma el envelope documentado del backend.
 * @param data Carga útil.
 * @param patch Campos a sobrescribir.
 * @returns Respuesta con el contrato ApiResponse.
 */
export function envelope<T>(data: T, patch: Partial<ApiResponse<T>> = {}): ApiResponse<T> {
  return {
    data,
    success: true,
    message: 'Respuesta exitosa',
    showsMessage: false,
    errorCode: null,
    timestamp: '2026-10-16T00:00:00.000Z',
    ...patch,
  };
}

/**
 * @function httpProviders
 * @description Proveedores HTTP de prueba con el ambiente indicado.
 * @param environment Ambiente inyectado.
 * @param interceptors Interceptores a registrar.
 * @returns Proveedores de TestBed.
 */
export function httpProviders(
  environment: AppEnvironment,
  interceptors: Parameters<typeof withInterceptors>[0] = [],
): Array<Provider | EnvironmentProviders> {
  return [
    provideHttpClient(withInterceptors(interceptors)),
    provideHttpClientTesting(),
    { provide: APP_ENVIRONMENT, useValue: environment },
  ];
}
