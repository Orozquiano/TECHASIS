import type { ApiResponse } from './api-response.model';

/**
 * @interface TipoVehiculo
 * @description Clasificación de vehículo (grúa, carro taller, etc.).
 */
export interface TipoVehiculo {
  /**
   * @description Identificador del tipo.
   */
  id: number;

  /**
   * @description Nombre visible.
   */
  nombre: string;

  /**
   * @description Código del tipo.
   */
  codigo: string;

  /**
   * @description Indica si el tipo está activo.
   */
  activo: boolean;

  /**
   * @description Indica si el tipo corresponde a carga.
   */
  carga: boolean;
}

/**
 * @interface CreateVehicleTypeDTO
 * @description Cuerpo documentado para crear un tipo de vehículo.
 */
export interface CreateVehicleTypeDTO {
  /**
   * @description Nombre del tipo.
   */
  nombre: string;

  /**
   * @description Código del tipo.
   */
  codigo: string;

  /**
   * @description Indica si corresponde a carga.
   */
  carga: boolean;
}

/**
 * @interface UpdateVehicleTypeDTO
 * @description Cuerpo documentado para actualizar un tipo de vehículo.
 */
export interface UpdateVehicleTypeDTO extends CreateVehicleTypeDTO {
  /**
   * @description Indica si el tipo queda activo.
   */
  activo: boolean;
}

/**
 * @interface Vehicle
 * @description Vehículo operativo registrado en el sistema.
 */
export interface Vehicle {
  id: number;
  tipoVehiculo: TipoVehiculo;
  placa: string;
  codigo: string;
  activo: boolean;
}

/**
 * @interface VehicleInitDataParams
 * @description Parámetros iniciales para el formulario de vehículos.
 */
export interface VehicleInitDataParams {
  tiposVehiculo: TipoVehiculo[];
}

/**
 * @interface SaveVehicleDTO
 * @description Datos para crear o actualizar un vehículo.
 */
export interface SaveVehicleDTO {
  tipoVehiculoId: string | number;
  placa: string;
  codigo: string;
}

export type VehicleListResponse = ApiResponse<Vehicle[]>;
export type VehicleSingleResponse = ApiResponse<Vehicle>;
export type VehicleInitDataResponse = ApiResponse<VehicleInitDataParams>;
export type VehicleActionResponse = ApiResponse<null>;
export type VehicleTypeListResponse = ApiResponse<TipoVehiculo[]>;
export type VehicleTypeSingleResponse = ApiResponse<TipoVehiculo>;
export type VehicleTypeActionResponse = ApiResponse<null>;
