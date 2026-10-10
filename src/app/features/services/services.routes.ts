import { Routes } from '@angular/router';

/**
 * @description Rutas del módulo de servicios.
 */
export const SERVICES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/services/services.component').then((m) => m.ServicesComponent),
  },
];
