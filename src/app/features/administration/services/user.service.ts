import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { APP_ENVIRONMENT } from '../../../core/config/app-environment';
import type {
  CreateUserDTO,
  UpdateUserDTO,
  UserActionResponse,
  UserInitDataResponse,
  UserListResponse,
  UserSingleResponse,
} from '../../../core/models';

/**
 * @class UserService
 * @description Servicio HTTP para la administración de usuarios.
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly env = inject(APP_ENVIRONMENT);

  /**
   * @function getInitData
   * @description Obtiene tipos de documento y roles para el formulario.
   * @returns Parámetros iniciales de usuarios.
   */
  getInitData(): Observable<UserInitDataResponse> {
    return this.http
      .get<UserInitDataResponse>(`${this.env.apiUrl}/user/parametros-usuarios`)
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
   * @function getUsers
   * @description Lista todos los usuarios del sistema.
   * @returns Listado de usuarios.
   */
  getUsers(): Observable<UserListResponse> {
    return this.http.get<UserListResponse>(`${this.env.apiUrl}/user`).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw res;
        }
        return res;
      }),
    );
  }

  /**
   * @function getUserById
   * @description Obtiene un usuario por su identificador.
   * @param id Identificador del usuario.
   * @returns Usuario solicitado.
   */
  getUserById(id: number): Observable<UserSingleResponse> {
    return this.http.get<UserSingleResponse>(`${this.env.apiUrl}/user/${id}`).pipe(
      map((res) => {
        if (!res.success || !res.data) {
          throw res;
        }
        return res;
      }),
    );
  }

  /**
   * @function createUser
   * @description Crea un nuevo usuario.
   * @param user Datos del usuario a crear.
   * @returns Resultado de la operación.
   */
  createUser(user: CreateUserDTO): Observable<UserActionResponse> {
    return this.http.post<UserActionResponse>(`${this.env.apiUrl}/user`, user).pipe(
      map((res) => {
        if (!res.success) {
          throw res;
        }
        return res;
      }),
    );
  }

  /**
   * @function updateUser
   * @description Actualiza un usuario existente.
   * @param id Identificador del usuario.
   * @param user Datos actualizados.
   * @returns Resultado de la operación.
   */
  updateUser(id: number, user: UpdateUserDTO): Observable<UserActionResponse> {
    return this.http.put<UserActionResponse>(`${this.env.apiUrl}/user/${id}`, user).pipe(
      map((res) => {
        if (!res.success) {
          throw res;
        }
        return res;
      }),
    );
  }

  /**
   * @function deleteUser
   * @description Elimina o desactiva un usuario.
   * @param id Identificador del usuario.
   * @returns Resultado de la operación.
   */
  deleteUser(id: number): Observable<UserActionResponse> {
    return this.http.delete<UserActionResponse>(`${this.env.apiUrl}/user/${id}`).pipe(
      map((res) => {
        if (!res.success) {
          throw res;
        }
        return res;
      }),
    );
  }
}
