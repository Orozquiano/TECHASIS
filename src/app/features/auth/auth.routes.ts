import { Routes } from '@angular/router';

/**
 * @description Rutas de autenticación de la plataforma.
 */
export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
];
