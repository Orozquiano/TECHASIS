import { Routes } from '@angular/router';

/**
 * @description Rutas del módulo de ranking.
 */
export const RANKING_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/ranking/ranking.component').then((m) => m.RankingComponent),
  },
];
