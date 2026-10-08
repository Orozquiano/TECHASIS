/**
 * @interface TenantBranding
 * @description Identidad visual de una empresa. Los valores se resuelven en ejecución
 * y no deben quedar fijos en los componentes.
 */
export interface TenantBranding {
  /**
   * @description Identificador de la empresa. Puede no estar disponible antes de autenticar.
   */
  tenantId?: string;

  /**
   * @description Nombre visible de la empresa.
   */
  companyName?: string;

  /**
   * @description Referencia del logo corporativo.
   */
  logo?: string;

  /**
   * @description Color principal de la identidad visual.
   */
  primaryColor?: string;

  /**
   * @description Color secundario de la identidad visual.
   */
  secondaryColor?: string;
}
