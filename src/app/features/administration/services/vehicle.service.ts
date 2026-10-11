import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { APP_ENVIRONMENT } from '../../../core/config/app-environment';
import type {
  SaveVehicleDTO,
  VehicleActionResponse,
  VehicleInitDataResponse,
  VehicleListResponse,
  VehicleSingleResponse,
} from '../../../core/models';

/**
 * @class VehicleService
 * @description Servicio HTTP para la administración de vehículos/grúas.
 */
@Injectable({ providedIn: 'root' })
export class VehicleService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(APP_ENVIRONMENT);

  /**
   * @function getInitData
   * @description Obtiene los tipos de vehículo disponibles.
   * @returns Parámetros iniciales de vehículos.
   */
  getInitData(): Observable<VehicleInitDataResponse> {
    return this.http
      .get<VehicleInitDataResponse>(`${this.env.apiUrl}/vehiculo/parametros-vehiculos`)
      .pipe(
        map((res) => {
          if (!res.success || !res.data) {
            throw res;
          }
          return res;
        }),
      );
  }

  /**
   * @function getVehicles
   * @description Lista todos los vehículos registrados.
   * @returns Listado de vehículos.
   */
  getVehicles(): Observable<VehicleListResponse> {
    return this.http.get<VehicleListResponse>(`${this.env.apiUrl}/vehiculo`).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw res;
        }
        return res;
      }),
    );
  }

  /**
   * @function getVehicleById
   * @description Obtiene un vehículo por su identificador.
   * @param id Identificador del vehículo.
   * @returns Vehículo solicitado.
   */
  getVehicleById(id: number): Observable<VehicleSingleResponse> {
    return this.http.get<VehicleSingleResponse>(`${this.env.apiUrl}/vehiculo/${id}`).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw res;
        }
        return res;
      }),
    );
  }

  /**
   * @function createVehicle
   * @description Crea un nuevo vehículo.
   * @param vehicle Datos del vehículo.
   * @returns Resultado de la operación.
   */
  createVehicle(vehicle: SaveVehicleDTO): Observable<VehicleActionResponse> {
    return this.http.post<VehicleActionResponse>(`${this.env.apiUrl}/vehiculo`, vehicle).pipe(
      map((res) => {
        if (!res.success) {
          throw res;
        }
        return res;
      }),
    );
  }

  /**
   * @function updateVehicle
   * @description Actualiza un vehículo existente.
   * @param id Identificador del vehículo.
   * @param vehicle Datos actualizados.
   * @returns Resultado de la operación.
   */
  updateVehicle(id: number, vehicle: SaveVehicleDTO): Observable<VehicleActionResponse> {
    return this.http
      .put<VehicleActionResponse>(`${this.env.apiUrl}/vehiculo/${id}`, vehicle)
      .pipe(
        map((res) => {
          if (!res.success) {
            throw res;
          }
          return res;
        }),
      );
  }

  /**
   * @function deleteVehicle
   * @description Elimina o desactiva un vehículo.
   * @param id Identificador del vehículo.
   * @returns Resultado de la operación.
   */
  deleteVehicle(id: number): Observable<VehicleActionResponse> {
    return this.http.delete<VehicleActionResponse>(`${this.env.apiUrl}/vehiculo/${id}`).pipe(
      map((res) => {
        if (!res.success) {
          throw res;
        }
        return res;
      }),
    );
  }
}
