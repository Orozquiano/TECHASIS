import type { AppEnvironment } from './environment.model';

/**
 * @description Ambiente dev publicado en GitHub Pages.
 * La API va en URL absoluta porque el sitio estático no usa el proxy local.
 */
export const environment: AppEnvironment = {
  production: false,
  environmentName: 'dev',
  apiUrl: 'http://179.0.9.180:8080/api',
  useMockApi: false,
};
