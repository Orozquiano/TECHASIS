import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAppEnvironment } from './core/config/app-environment';
import { routes } from './app.routes';

/**
 * @description Proveedores raíz de la aplicación.
 */
export const appConfig: ApplicationConfig = {
  providers: [provideBrowserGlobalErrorListeners(), provideRouter(routes), provideAppEnvironment()],
};
