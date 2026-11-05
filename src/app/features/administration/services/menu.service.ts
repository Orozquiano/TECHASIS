import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable, throwError } from 'rxjs';
import { APP_ENVIRONMENT } from '../../../core/config/app-environment';
import { ContractPendingError } from '../../../core/http/api-error';
import type { CreateMenuDTO, MenuListResponse, MenuSingleResponse } from '../../../core/models';

/**
 * @class MenuService
 * @description Consulta y crea ítems de menú con las rutas confirmadas en Postman.
 * Actualizar, eliminar y los parámetros no tienen un contrato utilizable.
 */
@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(APP_ENVIRONMENT);

  /**
   * @description La colección no guarda la respuesta de GET /api/menu/parametros-menus.
   */
  readonly paramsContract = 'pending' as const;

  /**
   * @description Actualizar y eliminar apuntan en la colección a /api/user.
   */
  readonly writeContract = 'pending' as const;

  /**
   * @function getMenus
   * @description Lista el menú autorizado.
   * @returns Ítems documentados en GET /api/menu.
   */
  getMenus(): Observable<MenuListResponse> {
    return this.http.get<MenuListResponse>(`${this.env.apiUrl}/menu`).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw res;
        }
        return res;
      }),
    );
  }

  /**
   * @function getMenuById
   * @description Consulta un ítem por la ruta GET /api/menu/{id}.
   * La colección no guarda un ejemplo de respuesta; se usa la forma del listado.
   * @param id Identificador del menú.
   * @returns Ítem solicitado.
   */
  getMenuById(id: number): Observable<MenuSingleResponse> {
    return this.http.get<MenuSingleResponse>(`${this.env.apiUrl}/menu/${id}`).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw res;
        }
        return res;
      }),
    );
  }

  /**
   * @function createMenu
   * @description Crea un ítem con POST /api/menu.
   * @param menu Datos documentados para la creación.
   * @returns Ítem creado. La colección no guarda el ejemplo de esta respuesta.
   */
  createMenu(menu: CreateMenuDTO): Observable<MenuSingleResponse> {
    return this.http.post<MenuSingleResponse>(`${this.env.apiUrl}/menu`, menu).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw res;
        }
        return res;
      }),
    );
  }

  /**
   * @function updateMenu
   * @description No llama al backend: la colección usa PUT /api/user/{idMenu}.
   * @returns Error de contrato pendiente.
   */
  updateMenu(): Observable<never> {
    return throwError(
      () =>
        new ContractPendingError(
          'Contrato pendiente: actualizar menú no tiene una ruta confirmada. La colección apunta a /api/user.',
        ),
    );
  }

  /**
   * @function deleteMenu
   * @description No llama al backend: la colección usa DELETE /api/user/{idUsuarioCreado}.
   * @returns Error de contrato pendiente.
   */
  deleteMenu(): Observable<never> {
    return throwError(
      () =>
        new ContractPendingError(
          'Contrato pendiente: eliminar menú no tiene una ruta confirmada. La colección apunta a /api/user.',
        ),
    );
  }
}
