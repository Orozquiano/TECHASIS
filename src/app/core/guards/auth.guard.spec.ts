import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, UrlTree } from '@angular/router';
import { buildDemoAccessToken } from '../auth/access-token';
import { AuthService } from '../auth/auth.service';
import { httpProviders, realHttpEnvironment } from '../http/http-test.helpers';
import type { MenuItem } from '../models';
import { authGuard } from './auth.guard';

const menu: MenuItem = {
  id: 8,
  padreMenuId: null,
  menuPadre: null,
  nombre: 'administration',
  descripcion: 'Administración',
  codigo: '008',
  activo: true,
};

/**
 * @function activate
 * @description Ejecuta el guard contra un segmento de ruta.
 * @param path Segmento a evaluar.
 * @returns Resultado del guard.
 */
function activate(path: string): boolean | UrlTree {
  const route = { routeConfig: { path } } as ActivatedRouteSnapshot;
  const result = TestBed.runInInjectionContext(() => authGuard(route, {} as never));
  if (result instanceof UrlTree || result === true || result === false) {
    return result;
  }
  throw new Error('El guard no debe resolver de forma asíncrona.');
}

describe('authGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [...httpProviders(realHttpEnvironment), provideRouter([])],
    });
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('redirige a login cuando no hay sesión', () => {
    const result = activate('administration');
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('falla cerrado cuando el token existe pero el menú no se cargó', () => {
    sessionStorage.setItem('auth_token', buildDemoAccessToken(3600));
    const result = activate('administration');
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('permite la ruta autorizada y redirige si el menú no la incluye', () => {
    sessionStorage.setItem('auth_token', buildDemoAccessToken(3600));
    sessionStorage.setItem('user_routes', JSON.stringify([menu]));

    expect(activate('administration')).toBe(true);
    expect(TestBed.inject(AuthService).hasPermissionForRoute('services')).toBe(false);

    const denied = activate('services');
    expect(TestBed.inject(Router).serializeUrl(denied as UrlTree)).toBe('/administration');
  });
});
