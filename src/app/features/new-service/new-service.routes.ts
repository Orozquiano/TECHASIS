import { Routes } from '@angular/router';

/**
 * @description Rutas del módulo de nuevo servicio.
 */
export const NEW_SERVICE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/new-service/new-service.component').then((m) => m.NewServiceComponent),
  },
];
