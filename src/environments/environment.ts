import type { AppEnvironment } from './environment.model';

/**
 * @description Configuración pública del ambiente local. La usa `ng serve`.
 */
export const environment: AppEnvironment = {
  production: false,
  environmentName: 'development',
  apiUrl: '',
};
