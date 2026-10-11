import { Routes } from '@angular/router';

/**
 * @description Rutas del módulo de administración.
 */
export const ADMINISTRATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/administration/administration.component').then(
        (m) => m.AdministrationComponent,
      ),
  },
];
