import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

/**
 * @function authInterceptor
 * @description Adjunta el token Bearer y cierra la sesión ante un 401 que no sea el login.
 * @param req Petición HTTP saliente.
 * @param next Siguiente manejador de la cadena.
 * @returns Observable de la petición.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.getToken();
  const outgoing = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(outgoing).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !req.url.includes('/user/login')
      ) {
        auth.logout();
        void router.navigateByUrl('/login');
      }

      return throwError(() => error);
    }),
  );
};
