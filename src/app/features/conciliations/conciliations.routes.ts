import { Routes } from '@angular/router';

/**
 * @description Rutas del módulo de conciliación.
 */
export const CONCILIATIONS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/conciliations/conciliations.component').then((m) => m.ConciliationsComponent),
  },
];
