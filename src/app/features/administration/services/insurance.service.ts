import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { APP_ENVIRONMENT } from '../../../core/config/app-environment';
import type {
  CreateInsuranceDTO,
  InsuranceActionResponse,
  InsuranceListResponse,
  InsuranceSingleResponse,
  UpdateInsuranceDTO,
} from '../../../core/models';

/**
 * @class InsuranceService
 * @description Servicio HTTP para la administración de aseguradoras.
 */
@Injectable({ providedIn: 'root' })
export class InsuranceService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(APP_ENVIRONMENT);

  /**
   * @function getInsurances
   * @description Lista todas las aseguradoras.
   * @returns Listado de aseguradoras.
   */
  getInsurances(): Observable<InsuranceListResponse> {
    return this.http.get<InsuranceListResponse>(`${this.env.apiUrl}/aseguradora`).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw res;
        }
        return res;
      }),
    );
  }

  /**
   * @function getInsuranceById
   * @description Obtiene una aseguradora por su identificador.
   * @param id Identificador de la aseguradora.
   * @returns Aseguradora solicitada.
   */
  getInsuranceById(id: number): Observable<InsuranceSingleResponse> {
    return this.http
      .get<InsuranceSingleResponse>(`${this.env.apiUrl}/aseguradora/${id}`)
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
   * @function createInsurance
   * @description Crea una nueva aseguradora.
   * @param insurance Datos de la aseguradora.
   * @returns Resultado de la operación.
   */
  createInsurance(insurance: CreateInsuranceDTO): Observable<InsuranceSingleResponse> {
    return this.http
      .post<InsuranceSingleResponse>(`${this.env.apiUrl}/aseguradora`, insurance)
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
   * @function updateInsurance
   * @description Actualiza una aseguradora existente.
   * @param id Identificador de la aseguradora.
   * @param insurance Datos actualizados.
   * @returns Resultado de la operación.
   */
  updateInsurance(id: number, insurance: UpdateInsuranceDTO): Observable<InsuranceSingleResponse> {
    return this.http
      .put<InsuranceSingleResponse>(`${this.env.apiUrl}/aseguradora/${id}`, insurance)
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
   * @function deleteInsurance
   * @description Elimina o desactiva una aseguradora.
   * @param id Identificador de la aseguradora.
   * @returns Resultado de la operación.
   */
  deleteInsurance(id: number): Observable<InsuranceActionResponse> {
    return this.http
      .delete<InsuranceActionResponse>(`${this.env.apiUrl}/aseguradora/${id}`)
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
