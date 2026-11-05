import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, throwError } from 'rxjs';
import { APP_ENVIRONMENT } from '../../../core/config/app-environment';
import { ContractPendingError } from '../../../core/http/api-error';
import type { BaseRateParamsResponse, BaseRateResponse, SaveBaseRateDTO } from '../../../core/models';

/**
 * @class BaseRateService
 * @description Opera las tarifas base cuyas rutas están confirmadas.
 * Listar, consultar y eliminar apuntan en la colección a /api/user y no se usan.
 */
@Injectable({ providedIn: 'root' })
export class BaseRateService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(APP_ENVIRONMENT);

  /**
   * @description Listado, consulta y eliminación no tienen ruta propia confirmada.
   */
  readonly listContract = 'pending' as const;

  /**
   * @function getParams
   * @description Obtiene las aseguradoras disponibles para una tarifa.
   * @returns Parámetros documentados.
   */
  getParams(): Observable<BaseRateParamsResponse> {
    return this.http
      .get<BaseRateParamsResponse>(`${this.env.apiUrl}/tarifa-base/parametros-base-tarifaria`)
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
   * @function createBaseRate
   * @description Crea una tarifa base.
   * @param dto Cuerpo documentado.
   * @returns Tarifa creada.
   */
  createBaseRate(dto: SaveBaseRateDTO): Observable<BaseRateResponse> {
    return this.http.post<BaseRateResponse>(`${this.env.apiUrl}/tarifa-base`, dto).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw res;
        }
        return res;
      }),
    );
  }

  /**
   * @function updateBaseRate
   * @description Actualiza una tarifa base existente.
   * @param id Identificador de la tarifa.
   * @param dto Cuerpo documentado.
   * @returns Tarifa actualizada.
   */
  updateBaseRate(id: number, dto: SaveBaseRateDTO): Observable<BaseRateResponse> {
    return this.http.put<BaseRateResponse>(`${this.env.apiUrl}/tarifa-base/${id}`, dto).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw res;
        }
        return res;
      }),
    );
  }

  /**
   * @function listBaseRates
   * @description No llama a /api/user. Esa ruta devuelve usuarios, no tarifas.
   * @returns Error de contrato pendiente.
   */
  listBaseRates(): Observable<never> {
    return throwError(
      () =>
        new ContractPendingError(
          'Contrato pendiente: el listado de tarifas base apunta a GET /api/user y no se utiliza.',
        ),
    );
  }
}
