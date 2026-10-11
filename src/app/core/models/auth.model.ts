import type { ApiResponse } from './api-response.model';

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
 * @interface MenuItem
 * @description Opción de menú autorizada para el usuario autenticado.
 */
export interface MenuItem {
  /**
   * @description Identificador del ítem de menú.
   */
  id: number;

  /**
   * @description Identificador del menú padre. Puede ser null.
   */
  padreMenuId: number | null;

  /**
   * @description Nombre de ruta asociado al ítem.
   */
  nombre: string;

  /**
   * @description Descripción visible del ítem.
   */
  descripcion: string;

  /**
   * @description Código interno del ítem.
   */
  codigo: string;
}

/**
 * @description Respuesta tipada del login.
 */
export type LoginResponse = ApiResponse<AuthUserData>;

/**
 * @description Respuesta tipada del menú del usuario.
 */
export type UserRoutesResponse = ApiResponse<MenuItem[]>;
