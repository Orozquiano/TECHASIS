import { Routes } from '@angular/router';

/**
 * @description Rutas del módulo de expedientes.
 */
export const FILES_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/files/files.component').then((m) => m.FilesComponent),
  },
];
