import type { AppEnvironment } from './environment.model';

/**
 * @description Configuración pública del ambiente de producción.
 */
export const environment: AppEnvironment = {
  production: true,
  environmentName: 'production',
  apiUrl: 'http://179.0.9.180:8080/api',
  useMockApi: false,
};
