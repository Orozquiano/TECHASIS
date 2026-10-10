import type { AppEnvironment } from './environment.model';

/**
 * @description Configuración del ambiente demo con API simulada (sin backend).
 */
export const environment: AppEnvironment = {
  production: true,
  environmentName: 'demo',
  apiUrl: '/api',
  useMockApi: true,
};
