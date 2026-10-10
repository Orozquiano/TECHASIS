import { Routes } from '@angular/router';

/**
 * @description Rutas del módulo de custodias.
 */
export const WACHEN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/wachen/wachen.component').then((m) => m.WachenComponent),
  },
];
