import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { APP_ENVIRONMENT } from '../../../core/config/app-environment';
import type {
  CreateVehicleTypeDTO,
  UpdateVehicleTypeDTO,
  VehicleTypeActionResponse,
  VehicleTypeListResponse,
  VehicleTypeSingleResponse,
} from '../../../core/models';

/**
 * @class VehicleTypeService
 * @description Servicio HTTP del catálogo de tipos de vehículo.
 */
@Injectable({ providedIn: 'root' })
export class VehicleTypeService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(APP_ENVIRONMENT);

  /**
   * @function getVehicleTypes
   * @description Lista los tipos de vehículo.
   * @returns Tipos documentados en GET /api/tipo-vehiculo.
   */
  getVehicleTypes(): Observable<VehicleTypeListResponse> {
    return this.http.get<VehicleTypeListResponse>(`${this.env.apiUrl}/tipo-vehiculo`).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw res;
        }
        return res;
      }),
    );
  }

  /**
   * @function getVehicleTypeById
   * @description Consulta un tipo por su identificador.
   * @param id Identificador del tipo.
   * @returns Tipo solicitado.
   */
  getVehicleTypeById(id: number): Observable<VehicleTypeSingleResponse> {
    return this.http.get<VehicleTypeSingleResponse>(`${this.env.apiUrl}/tipo-vehiculo/${id}`).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw res;
        }
        return res;
      }),
    );
  }

  /**
   * @function createVehicleType
   * @description Crea un tipo de vehículo.
   * @param dto Nombre, código y carga.
   * @returns Tipo creado.
   */
  createVehicleType(dto: CreateVehicleTypeDTO): Observable<VehicleTypeSingleResponse> {
    return this.http.post<VehicleTypeSingleResponse>(`${this.env.apiUrl}/tipo-vehiculo`, dto).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw res;
        }
        return res;
      }),
    );
  }

  /**
   * @function updateVehicleType
   * @description Actualiza un tipo de vehículo.
   * @param id Identificador del tipo.
   * @param dto Datos documentados para la actualización.
   * @returns Tipo actualizado.
   */
  updateVehicleType(id: number, dto: UpdateVehicleTypeDTO): Observable<VehicleTypeSingleResponse> {
    return this.http.put<VehicleTypeSingleResponse>(`${this.env.apiUrl}/tipo-vehiculo/${id}`, dto).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw res;
        }
        return res;
      }),
    );
  }

  /**
   * @function deleteVehicleType
   * @description Elimina un tipo de vehículo.
   * @param id Identificador del tipo.
   * @returns Respuesta con data null cuando la eliminación es exitosa.
   */
  deleteVehicleType(id: number): Observable<VehicleTypeActionResponse> {
    return this.http.delete<VehicleTypeActionResponse>(`${this.env.apiUrl}/tipo-vehiculo/${id}`).pipe(
      map((res) => {
        if (!res.success) {
          throw res;
        }
        return res;
      }),
    );
  }
}
