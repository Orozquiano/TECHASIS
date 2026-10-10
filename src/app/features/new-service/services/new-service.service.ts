import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { APP_ENVIRONMENT } from '../../../core/config/app-environment';
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
}
