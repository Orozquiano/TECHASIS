import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { APP_ENVIRONMENT } from '../../../core/config/app-environment';
import type {
  SaveServiceStatusDTO,
  ServiceStatusActionResponse,
  ServiceStatusListResponse,
  ServiceStatusSingleResponse,
} from '../../../core/models';

/**
 * @class ServiceStatusService
 * @description Servicio HTTP para la administración de estados de servicio.
 */
@Injectable({ providedIn: 'root' })
export class ServiceStatusService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(APP_ENVIRONMENT);

  /**
   * @function getServiceStatuses
   * @description Lista todos los estados de servicio.
   * @returns Listado de estados.
   */
  getServiceStatuses(): Observable<ServiceStatusListResponse> {
    return this.http
      .get<ServiceStatusListResponse>(`${this.env.apiUrl}/estado-servicio`)
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
   * @function getServiceStatusById
   * @description Obtiene un estado de servicio por su identificador.
   * @param id Identificador del estado.
   * @returns Estado solicitado.
   */
  getServiceStatusById(id: number): Observable<ServiceStatusSingleResponse> {
    return this.http
      .get<ServiceStatusSingleResponse>(`${this.env.apiUrl}/estado-servicio/${id}`)
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
   * @function createServiceStatus
   * @description Crea un nuevo estado de servicio.
   * @param status Datos del estado.
   * @returns Resultado de la operación.
   */
  createServiceStatus(status: SaveServiceStatusDTO): Observable<ServiceStatusActionResponse> {
    return this.http
      .post<ServiceStatusActionResponse>(`${this.env.apiUrl}/estado-servicio`, status)
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
   * @function updateServiceStatus
   * @description Actualiza un estado de servicio existente.
   * @param id Identificador del estado.
   * @param status Datos actualizados.
   * @returns Resultado de la operación.
   */
  updateServiceStatus(
    id: number,
    status: SaveServiceStatusDTO,
  ): Observable<ServiceStatusActionResponse> {
    return this.http
      .put<ServiceStatusActionResponse>(`${this.env.apiUrl}/estado-servicio/${id}`, status)
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
   * @function deleteServiceStatus
   * @description Elimina o desactiva un estado de servicio.
   * @param id Identificador del estado.
   * @returns Resultado de la operación.
   */
  deleteServiceStatus(id: number): Observable<ServiceStatusActionResponse> {
    return this.http
      .delete<ServiceStatusActionResponse>(`${this.env.apiUrl}/estado-servicio/${id}`)
      .pipe(
        map((res) => {
          if (!res.success) {
            throw res;
          }
          return res;
        }),
      );
  }
}
