import type { AppEnvironment } from './environment.model';

/**
 * @description Configuración pública del ambiente preprod.
 */
export const environment: AppEnvironment = {
  production: false,
  environmentName: 'preprod',
  apiUrl: 'http://179.0.9.180:8080/api',
  useMockApi: false,
};
