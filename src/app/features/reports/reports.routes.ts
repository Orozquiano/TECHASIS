import { Routes } from '@angular/router';

/**
 * @description Rutas del módulo de informes.
 */
export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/reports/reports.component').then((m) => m.ReportsComponent),
  },
];
