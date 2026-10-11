import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AUTH_ROUTES } from './features/auth/auth.routes';

/**
 * @description Configuración raíz de navegación de la aplicación.
 */
export const routes: Routes = [
  ...AUTH_ROUTES,
  {
    path: '',
    loadComponent: () =>
      import('./layout/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: 'newService',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/new-service/new-service.routes').then((m) => m.NEW_SERVICE_ROUTES),
      },
      {
        path: 'services',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/services/services.routes').then((m) => m.SERVICES_ROUTES),
      },
      {
        path: 'files',
        canActivate: [authGuard],
        loadChildren: () => import('./features/files/files.routes').then((m) => m.FILES_ROUTES),
      },
      {
        path: 'conciliations',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/conciliations/conciliations.routes').then(
            (m) => m.CONCILIATIONS_ROUTES,
          ),
      },
      {
        path: 'reports',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
      },
      {
        path: 'ranking',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/ranking/ranking.routes').then((m) => m.RANKING_ROUTES),
      },
      {
        path: 'wachen',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/wachen/wachen.routes').then((m) => m.WACHEN_ROUTES),
      },
      {
        path: 'administration',
        canActivate: [authGuard],
        loadChildren: () =>
          import('./features/administration/administration.routes').then(
            (m) => m.ADMINISTRATION_ROUTES,
          ),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'newService',
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
