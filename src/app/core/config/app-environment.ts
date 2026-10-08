import { InjectionToken, type Provider } from '@angular/core';
import { environment } from '../../../environments/environment';
import type { AppEnvironment } from '../../../environments/environment.model';

/**
 * @description Token con la configuración pública del ambiente compilado.
 */
export const APP_ENVIRONMENT = new InjectionToken<AppEnvironment>('APP_ENVIRONMENT');

/**
 * @function provideAppEnvironment
 * @description Registra la configuración pública del ambiente de compilación.
 * @returns Proveedor del token de ambiente.
 */
export function provideAppEnvironment(): Provider {
  return {
    provide: APP_ENVIRONMENT,
    useValue: environment,
  };
}
