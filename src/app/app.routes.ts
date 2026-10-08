import { Routes } from '@angular/router';
import { AUTH_ROUTES } from './features/auth/auth.routes';

/**
 * @description Configuración raíz de navegación de la aplicación.
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
  ...AUTH_ROUTES,
  {
    path: '**',
    redirectTo: 'login',
  },
];
