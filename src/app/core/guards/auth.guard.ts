import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { routeForMenuItem } from '../navigation/app-sections';

/**
 * @function authGuard
 * @description Protege rutas privadas validando la sesión. Si hay menú guardado, limita el acceso a esas rutas.
 * @param route Ruta activada.
 * @returns true si puede entrar, o UrlTree de redirección.
 */
export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.parseUrl('/login');
  }

  const targetPath = route.routeConfig?.path;

  const allowedRoutes = authService.getUserRoutesFromStorage();

  if (allowedRoutes.length === 0 || authService.hasPermissionForRoute(targetPath)) {
    return true;
  }

  const defaultPath = routeForMenuItem(allowedRoutes[0]);
  return router.parseUrl(`/${defaultPath}`);
};
