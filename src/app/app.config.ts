import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAppEnvironment } from './core/config/app-environment';
import { authInterceptor } from './core/http/auth.interceptor';
import { mockApiInterceptor } from './core/http/mock-api.interceptor';
import { routes } from './app.routes';

/**
 * @description Proveedores raíz de la aplicación.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([mockApiInterceptor, authInterceptor])),
    provideAppEnvironment(),
  ],
};
