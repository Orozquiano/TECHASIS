import type { ApiResponse } from './api-response.model';
import type { MenuItem } from './menu.model';

export type { MenuItem } from './menu.model';

/**
 * @interface LoginRequest
 * @description Credenciales enviadas al endpoint de autenticación.
 */
export interface LoginRequest {
  /**
   * @description Usuario o documento de acceso.
   */
  user: string;

  /**
   * @description Contraseña del usuario.
   */
  password: string;
}

/**
 * @interface AuthUserData
 * @description Datos de sesión devueltos tras un login exitoso.
 */
export interface AuthUserData {
  /**
   * @description Token de acceso JWT.
   */
  accessToken: string;

  /**
   * @description Tipo de token (por ejemplo Bearer).
   */
  tokenType: string;

  /**
   * @description Tiempo de expiración del token en segundos.
   */
  expiresIn: number;

  /**
   * @description Identificador interno del usuario autenticado.
   */
  usuarioId: number;

  /**
   * @description Documento del usuario autenticado.
   */
  documento: string;
}

/**
 * @description Respuesta tipada del login.
 */
export type LoginResponse = ApiResponse<AuthUserData>;

/**
 * @description Respuesta tipada del menú del usuario.
 */
export type UserRoutesResponse = ApiResponse<MenuItem[]>;
