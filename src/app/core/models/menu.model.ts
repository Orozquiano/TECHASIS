import type { ApiResponse } from './api-response.model';

/**
 * @interface MenuParentRef
 * @description Referencia al menú padre enviada al crear un ítem.
 */
export interface MenuParentRef {
  /**
   * @description Identificador del menú padre.
   */
  id: number;
}

/**
 * @interface MenuItem
 * @description Ítem de menú devuelto por GET /api/menu.
 */
export interface MenuItem {
  /**
   * @description Identificador del ítem.
   */
  id: number;

  /**
   * @description Identificador del menú padre. Puede ser null.
   */
  padreMenuId: number | null;

  /**
   * @description Menú padre embebido. Puede ser null.
   */
  menuPadre: MenuParentRef | null;

  /**
   * @description Nombre de ruta asociado al ítem.
   */
  nombre: string;

  /**
   * @description Descripción visible del ítem.
   */
  descripcion: string;

  /**
   * @description Código interno del ítem.
   */
  codigo: string;

  /**
   * @description Indica si el ítem está activo.
   */
  activo: boolean;
}

/**
 * @interface CreateMenuDTO
 * @description Cuerpo documentado para POST /api/menu.
 */
export interface CreateMenuDTO {
  /**
   * @description Menú padre. Puede enviarse null cuando el ítem es raíz.
   */
  menuPadre: MenuParentRef | null;

  /**
   * @description Nombre de la sección.
   */
  nombre: string;

  /**
   * @description Texto de ayuda.
   */
  descripcion: string;

  /**
   * @description Código del ítem.
   */
  codigo: string;
}

/**
 * @description Respuesta de listado de menú.
 */
export type MenuListResponse = ApiResponse<MenuItem[]>;

/**
 * @description Respuesta de un ítem de menú.
 * GET por id no trae ejemplo guardado; la forma es la del listado.
 */
export type MenuSingleResponse = ApiResponse<MenuItem>;
