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
 * @interface CreateInsuranceDTO
 * @description Cuerpo documentado para crear una aseguradora. No incluye activo.
 */
export interface CreateInsuranceDTO {
  /**
   * @description Nombre de la aseguradora.
   */
  nombre: string;

  /**
   * @description Código de la aseguradora.
   */
  codigo: string;
}

/**
 * @interface UpdateInsuranceDTO
 * @description Cuerpo documentado para actualizar una aseguradora.
 */
export interface UpdateInsuranceDTO extends CreateInsuranceDTO {
  /**
   * @description Indica si la aseguradora queda activa.
   */
  activo: boolean;
}

export type InsuranceListResponse = ApiResponse<Insurance[]>;
export type InsuranceSingleResponse = ApiResponse<Insurance>;
export type InsuranceActionResponse = ApiResponse<null>;
