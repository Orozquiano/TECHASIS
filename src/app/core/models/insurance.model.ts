import type { ApiResponse } from './api-response.model';

/**
 * @interface Insurance
 * @description Aseguradora registrada en el sistema.
 */
export interface Insurance {
  id: number;
  nombre: string;
  codigo: string;
  activo: boolean;
}

/**
 * @interface SaveInsuranceDTO
 * @description Datos para crear o actualizar una aseguradora.
 */
export interface SaveInsuranceDTO {
  nombre: string;
  codigo: string;
  activo?: boolean;
}

export type InsuranceListResponse = ApiResponse<Insurance[]>;
export type InsuranceSingleResponse = ApiResponse<Insurance>;
export type InsuranceActionResponse = ApiResponse<null>;
