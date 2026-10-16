import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, of, switchMap, throwError } from 'rxjs';
import { APP_ENVIRONMENT } from '../config/app-environment';
import { routeForMenuItem, menuGrantsRoute } from '../navigation/app-sections';
import { THEME_STORAGE_KEY } from '../theme/theme.constants';
import type {
  AuthUserData,
  LoginRequest,
  LoginResponse,
  MenuItem,
  User,
  UserRoutesResponse,
  UserSingleResponse,
} from '../models';
import { formatPersonName } from './person-name';

/**
 * @class AuthService
 * @description Gestiona autenticación, sesión y permisos de menú del usuario.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /**
   * @description Cliente HTTP para consumir la API de autenticación.
   */
  private readonly http = inject(HttpClient);

  /**
   * @description Configuración pública del ambiente compilado.
   */
  private readonly env = inject(APP_ENVIRONMENT);

  /**
   * @function login
   * @description Autentica al usuario, carga su perfil y obtiene sus rutas.
   * @param credentials Credenciales de acceso.
   * @param remember Indica si la sesión debe persistir en localStorage.
   * @returns Promesa observable con la ruta por defecto y el menú permitido.
   */
  login(
    credentials: LoginRequest,
    remember: boolean,
  ): Observable<{ defaultRoute: string; routes: MenuItem[] }> {
    return this.http.post<LoginResponse>(`${this.env.apiUrl}/user/login`, credentials).pipe(
      switchMap((loginRes) => {
        if (!loginRes.success || !loginRes.data?.accessToken) {
          return throwError(() => loginRes);
        }

        this.saveSession(loginRes.data, remember);

        return this.getAuthenticatedUser(loginRes.data.usuarioId).pipe(
          switchMap((profileRes) => {
            if (!profileRes.success || !profileRes.data) {
              return throwError(() => profileRes);
            }

            this.saveProfile(profileRes.data);
            return this.getUserRoutes().pipe(
              map((routesRes) => this.resolveDefaultRoute(routesRes)),
              catchError(() => of({ defaultRoute: 'newService', routes: [] as MenuItem[] })),
            );
          }),
          catchError((error: unknown) => {
            this.logout();
            return throwError(() => error);
          }),
        );
      }),
    );
  }

  /**
   * @function getAuthenticatedUser
   * @description Obtiene el perfil del usuario autenticado.
   * @param usuarioId Identificador devuelto por el login.
   * @returns Respuesta con los datos del usuario.
   */
  private getAuthenticatedUser(usuarioId: number): Observable<UserSingleResponse> {
    return this.http.get<UserSingleResponse>(`${this.env.apiUrl}/user/${usuarioId}`);
  }

  /**
   * @function getUserRoutes
   * @description Obtiene el menú autorizado desde el backend.
   * @returns Respuesta con la lista de ítems de menú.
   */
  getUserRoutes(): Observable<UserRoutesResponse> {
    return this.http.get<UserRoutesResponse>(`${this.env.apiUrl}/menu`);
  }

  /**
   * @function saveSession
   * @description Persiste token e identificadores del usuario autenticado.
   * @param authData Datos de sesión entregados por el backend.
   * @param remember Indica el almacenamiento a utilizar.
   */
  private saveSession(authData: AuthUserData, remember: boolean): void {
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('auth_token', authData.accessToken);
    storage.setItem('user_id', authData.usuarioId.toString());
    storage.setItem('user_doc', authData.documento);
  }

  /**
   * @function saveProfile
   * @description Guarda el documento y el nombre visible del perfil autenticado.
   * @param profile Usuario devuelto por el backend.
   */
  private saveProfile(profile: User): void {
    const storage = this.activeStorage();
    storage.setItem('user_doc', profile.documento);
    storage.setItem('user_name', formatPersonName(profile));
    storage.setItem('user_rol_id', String(profile.rolId));
  }

  /**
   * @function activeStorage
   * @description Elige el almacenamiento donde quedó el token de la sesión actual.
   * @returns localStorage si la sesión es persistente; si no, sessionStorage.
   */
  private activeStorage(): Storage {
    return localStorage.getItem('auth_token') ? localStorage : sessionStorage;
  }

  /**
   * @function saveUserRoutes
   * @description Guarda las rutas autorizadas en almacenamiento local.
   * @param routes Menú permitido para el usuario.
   */
  private saveUserRoutes(routes: MenuItem[]): void {
    localStorage.setItem('user_routes', JSON.stringify(routes));
  }

  /**
   * @function getUserRoutesFromStorage
   * @description Recupera el menú autorizado desde almacenamiento local.
   * @returns Lista de ítems de menú o arreglo vacío.
   */
  getUserRoutesFromStorage(): MenuItem[] {
    const routes = localStorage.getItem('user_routes');
    return routes ? (JSON.parse(routes) as MenuItem[]) : [];
  }

  /**
   * @function resolveDefaultRoute
   * @description Guarda el menú cuando el backend lo entrega y elige la ruta inicial.
   * @param routesRes Respuesta del menú autorizado.
   * @returns Ruta por defecto y menú persistido, o un arreglo vacío si no llegó menú.
   */
  private resolveDefaultRoute(routesRes: UserRoutesResponse): {
    defaultRoute: string;
    routes: MenuItem[];
  } {
    const routes = routesRes.success && routesRes.data ? routesRes.data : [];

    if (routes.length > 0) {
      this.saveUserRoutes(routes);
    }

    const defaultRoute = routes[0] ? routeForMenuItem(routes[0]) : 'newService';
    return { defaultRoute, routes };
  }

  /**
   * @function getToken
   * @description Obtiene el token de acceso vigente.
   * @returns Token JWT o null cuando no hay sesión.
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  }

  /**
   * @function getDocumento
   * @description Obtiene el documento guardado al iniciar sesión.
   * @returns Documento del usuario o null cuando no hay sesión.
   */
  getDocumento(): string | null {
    return localStorage.getItem('user_doc') || sessionStorage.getItem('user_doc');
  }

  /**
   * @function getUserName
   * @description Obtiene el nombre visible guardado con el perfil.
   * @returns Nombre compuesto o null cuando aún no hay perfil.
   */
  getUserName(): string | null {
    return localStorage.getItem('user_name') || sessionStorage.getItem('user_name');
  }

  /**
   * @function getUserId
   * @description Obtiene el identificador del usuario autenticado.
   * @returns Identificador como texto o null.
   */
  getUserId(): string | null {
    return localStorage.getItem('user_id') || sessionStorage.getItem('user_id');
  }

  /**
   * @function getRolId
   * @description Obtiene el rol guardado con el perfil autenticado.
   * @returns Identificador de rol o null cuando el perfil aún no lo trajo.
   */
  getRolId(): number | null {
    const raw = localStorage.getItem('user_rol_id') || sessionStorage.getItem('user_rol_id');
    if (!raw) {
      return null;
    }

    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  }

  /**
   * @function hasPermissionForRoute
   * @description Evalúa si la ruta solicitada está autorizada para el usuario.
   * @param path Segmento de ruta a validar.
   * @returns true cuando el usuario tiene permiso.
   */
  hasPermissionForRoute(path: string | undefined): boolean {
    if (!path) {
      return false;
    }

    return this.getUserRoutesFromStorage().some((route) => menuGrantsRoute(route, path));
  }

  /**
   * @function isLoggedIn
   * @description Indica si existe una sesión autenticada activa.
   * @returns true cuando hay token disponible.
   */
  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  /**
   * @function logout
   * @description Limpia la sesión del usuario en ambos almacenamientos,
   * conservando la preferencia visual de tema del usuario.
   */
  logout(): void {
    let themePreference: string | null = null;
    try {
      themePreference = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      themePreference = null;
    }

    localStorage.clear();
    sessionStorage.clear();

    if (themePreference === 'light' || themePreference === 'dark') {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, themePreference);
      } catch {
        // Persistencia opcional del tema tras cerrar sesión.
      }
    }
  }
}
