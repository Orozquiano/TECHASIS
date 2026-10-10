import type { ApiResponse } from './api-response.model';

/**
 * @interface TipoVehiculo
 * @description Clasificación de vehículo (grúa, carro taller, etc.).
 */
export interface TipoVehiculo {
  id: number;
  nombre: string;
  codigo: string;
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
