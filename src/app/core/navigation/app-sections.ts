import type { MenuItem } from '../models';

/**
 * @description Símbolo de la barra inferior asociado a una sección.
 */
export type SectionSymbol =
  | 'plus'
  | 'list'
  | 'folder'
  | 'check'
  | 'chart'
  | 'trend'
  | 'shield'
  | 'sliders';

/**
 * @interface AppSection
 * @description Sección conocida de la aplicación y el código de menú que la identifica.
 */
export interface AppSection {
  /**
   * @description Código del menú backend. Puede no existir todavía en secciones futuras.
   */
  codigo: string | null;

  /**
   * @description Segmento de ruta de la sección.
   */
  route: string;

  /**
   * @description Título visible de la sección.
   */
  label: string;

  /**
   * @description Texto corto de la barra inferior.
   */
  tabLabel: string;

  /**
   * @description Símbolo de la barra inferior.
   */
  symbol: SectionSymbol;
}

/**
 * @description Catálogo de secciones. El código 001 identifica Nuevo servicio.
 */
export const APP_SECTIONS: readonly AppSection[] = [
  { codigo: '001', route: 'newService', label: 'Nuevo servicio', tabLabel: 'Nuevo', symbol: 'plus' },
  { codigo: '002', route: 'services', label: 'Servicios', tabLabel: 'Servicios', symbol: 'list' },
  { codigo: '003', route: 'files', label: 'Expedientes', tabLabel: 'Expedientes', symbol: 'folder' },
  {
    codigo: '004',
    route: 'conciliations',
    label: 'Conciliación',
    tabLabel: 'Conciliar',
    symbol: 'check',
  },
  { codigo: '005', route: 'reports', label: 'Informes', tabLabel: 'Informes', symbol: 'chart' },
  { codigo: '006', route: 'ranking', label: 'Ranking', tabLabel: 'Ranking', symbol: 'trend' },
  { codigo: '007', route: 'wachen', label: 'Custodias', tabLabel: 'Custodias', symbol: 'shield' },
  {
    codigo: '008',
    route: 'administration',
    label: 'Administración',
    tabLabel: 'Ajustes',
    symbol: 'sliders',
  },
];

/**
 * @function menuGrantsRoute
 * @description Indica si un ítem de menú autoriza la ruta indicada.
 * El código tiene prioridad; si no hay código, se compara el nombre con la ruta.
 * @param item Ítem devuelto por el backend.
 * @param path Segmento de ruta a evaluar.
 * @returns true cuando el ítem corresponde a esa ruta.
 */
export function menuGrantsRoute(item: MenuItem, path: string): boolean {
  const section = APP_SECTIONS.find((entry) => entry.route.toLowerCase() === path.toLowerCase());

  if (section?.codigo && item.codigo === section.codigo) {
    return true;
  }

  return item.nombre.replace(/^\//, '').toLowerCase() === path.toLowerCase();
}

/**
 * @function routeForMenuItem
 * @description Resuelve la ruta de aplicación que corresponde a un ítem de menú.
 * @param item Ítem devuelto por el backend.
 * @returns Segmento de ruta, o el nombre del ítem cuando la sección aún no está catalogada.
 */
export function routeForMenuItem(item: MenuItem): string {
  const byCode = APP_SECTIONS.find((entry) => entry.codigo && entry.codigo === item.codigo);

  if (byCode) {
    return byCode.route;
  }

  const nombre = item.nombre.replace(/^\//, '');
  const byName = APP_SECTIONS.find((entry) => entry.route.toLowerCase() === nombre.toLowerCase());
  return byName?.route ?? nombre;
}

/**
 * @function descriptionForRoute
 * @description Busca la descripción de ayuda del menú para una ruta.
 * @param path Segmento de ruta.
 * @param menu Menú autorizado guardado en sesión.
 * @returns Texto de ayuda, o null cuando esa sección no trae descripción.
 */
export function descriptionForRoute(path: string, menu: MenuItem[]): string | null {
  const item = menu.find((entry) => menuGrantsRoute(entry, path));
  const text = item?.descripcion?.trim();
  return text ? text : null;
}
