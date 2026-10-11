import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

/**
 * @function authInterceptor
 * @description Adjunta el token Bearer a las peticiones autenticadas.
 * @param req Petición HTTP saliente.
 * @param next Siguiente manejador de la cadena.
 * @returns Observable de la petición, con o sin cabecera Authorization.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};
