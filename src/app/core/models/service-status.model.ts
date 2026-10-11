import type { ApiResponse } from './api-response.model';

/**
 * @interface ServiceStatus
 * @description Estado operativo de un servicio de grúa.
 */
export interface ServiceStatus {
  id: number;
  descripcion: string;
  codigo: string;
  activo: boolean;
}

/**
 * @interface SaveServiceStatusDTO
 * @description Datos para crear o actualizar un estado de servicio.
 */
export interface SaveServiceStatusDTO {
  descripcion: string;
  codigo: string;
  activo: boolean;
}

export type ServiceStatusListResponse = ApiResponse<ServiceStatus[]>;
export type ServiceStatusSingleResponse = ApiResponse<ServiceStatus>;
export type ServiceStatusActionResponse = ApiResponse<null>;
