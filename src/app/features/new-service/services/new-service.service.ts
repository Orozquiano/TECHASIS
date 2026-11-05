import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, throwError } from 'rxjs';
import { APP_ENVIRONMENT } from '../../../core/config/app-environment';
import { ContractPendingError } from '../../../core/http/api-error';
import type { ServiceInitData } from '../../../core/models';

/**
 * @class NewServiceService
 * @description Servicio HTTP para parámetros e inicialización de nuevos servicios.
 */
@Injectable({ providedIn: 'root' })
export class NewServiceService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(APP_ENVIRONMENT);

  /**
   * @function getServiceInitData
   * @description Obtiene catálogos necesarios para el formulario de nuevo servicio.
   * @returns Parámetros administrativos del servicio.
   */
  getServiceInitData(): Observable<ServiceInitData> {
    return this.http
      .get<ServiceInitData>(`${this.env.apiUrl}/servicio/parametros-administracion`)
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
   * @function saveService
   * @description Reserva el guardado del servicio. La colección no documenta esa operación.
   * @returns Error de contrato pendiente, sin petición HTTP.
   */
  saveService(): Observable<never> {
    return throwError(
      () =>
        new ContractPendingError(
          'Contrato pendiente: no existe un endpoint documentado para crear el servicio. No se envió ninguna petición.',
        ),
    );
  }
}
