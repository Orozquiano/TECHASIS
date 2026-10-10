import type { ApiResponse } from './api-response.model';

/**
 * @interface User
 * @description Representa un usuario administrable del sistema.
 */
export interface User {
  id: number;
  tipoDocumentoId: number;
  documento: string;
  primerNombre: string;
  segundoNombre: string | null;
  primerApellido: string;
  segundoApellido: string | null;
  rolId: number;
  activo: boolean;
}

/**
 * @interface TipoDocumento
 * @description Tipo de documento disponible para usuarios.
 */
export interface TipoDocumento {
  id: number;
  nombre: string;
  codigo: string;
}

/**
 * @interface Rol
 * @description Rol de acceso asignable a un usuario.
 */
export interface Rol {
  id: number;
  nombre: string;
  codigo: string;
}

/**
 * @interface UserInitDataParams
 * @description Parámetros iniciales para el formulario de usuarios.
 */
export interface UserInitDataParams {
  tiposDocumento: TipoDocumento[];
  roles: Rol[];
}

/**
 * @interface SaveUserDTO
 * @description Datos base para crear o actualizar un usuario.
 */
export interface SaveUserDTO {
  tipoDocumentoId: string | number;
  documento: string;
  rolId: string | number;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
}

/**
 * @interface CreateUserDTO
 * @description Datos requeridos para crear un usuario, incluyendo clave.
 */
export interface CreateUserDTO extends SaveUserDTO {
  clave: string;
}

/**
 * @interface UpdateUserDTO
 * @description Datos para actualizar un usuario. La clave es opcional.
 */
export interface UpdateUserDTO extends SaveUserDTO {
  clave?: string;
}

export type UserListResponse = ApiResponse<User[]>;
export type UserSingleResponse = ApiResponse<User>;
export type UserInitDataResponse = ApiResponse<UserInitDataParams>;
export type UserActionResponse = ApiResponse<null>;
