import type { ApiResponse } from './api-response.model';
import type { Insurance } from './insurance.model';

/**
 * @interface BaseRate
 * @description Tarifa base devuelta al crear o actualizar.
 */
export interface BaseRate {
  /**
   * @description Identificador de la tarifa.
   */
  id: number;

  /**
   * @description Aseguradora asociada.
   */
  aseguradora: Insurance;

  /**
   * @description Descripción de la tarifa.
   */
  descripcion: string;

  /**
   * @description Valor económico.
   */
  valor: number;

  /**
   * @description Código de la tarifa.
   */
  codigo: string;

  /**
   * @description Indica si la tarifa está activa.
   */
  activo: boolean;
}

/**
 * @interface SaveBaseRateDTO
 * @description Cuerpo documentado para crear y actualizar una tarifa base.
 */
export interface SaveBaseRateDTO {
  /**
   * @description Aseguradora referenciada por id.
   */
  aseguradora: {
    /**
     * @description Identificador de la aseguradora.
     */
    id: number;
  };

  /**
   * @description Descripción de la tarifa.
   */
  descripcion: string;

  /**
   * @description Valor económico.
   */
  valor: number;

  /**
   * @description Código de la tarifa.
   */
  codigo: string;
}

/**
 * @interface BaseRateParams
 * @description Catálogo documentado en GET /api/tarifa-base/parametros-base-tarifaria.
 */
export interface BaseRateParams {
  /**
   * @description Aseguradoras disponibles para la tarifa.
   */
  aseguradoras: Insurance[];
}

export type BaseRateResponse = ApiResponse<BaseRate>;
export type BaseRateParamsResponse = ApiResponse<BaseRateParams>;
