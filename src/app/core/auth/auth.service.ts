import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, switchMap } from 'rxjs';
import { APP_ENVIRONMENT } from '../config/app-environment';
import { THEME_STORAGE_KEY } from '../theme/theme.constants';
import type {
  AuthUserData,
  LoginRequest,
  LoginResponse,
  MenuItem,
  UserRoutesResponse,
} from '../models';

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
   * @description Autentica al usuario, guarda la sesión y obtiene sus rutas.
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
          throw loginRes;
        }

        this.saveSession(loginRes.data, remember);

        return this.getUserRoutes().pipe(
          map((routesRes) => {
            if (!routesRes.success || !routesRes.data) {
              throw routesRes;
            }

            const routes = routesRes.data;
            const defaultRoute = routes[0]?.nombre ?? 'newService';
            this.saveUserRoutes(routes);

            return { defaultRoute, routes };
          }),
        );
      }),
    );
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
   * @function getToken
   * @description Obtiene el token de acceso vigente.
   * @returns Token JWT o null cuando no hay sesión.
   */
  getToken(): string | null {
    return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
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
   * @function hasPermissionForRoute
   * @description Evalúa si la ruta solicitada está autorizada para el usuario.
   * @param path Segmento de ruta a validar.
   * @returns true cuando el usuario tiene permiso.
   */
  hasPermissionForRoute(path: string | undefined): boolean {
    if (!path) {
      return false;
    }

    return this.getUserRoutesFromStorage().some(
      (route) => route.nombre.toLowerCase() === path.toLowerCase(),
    );
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
