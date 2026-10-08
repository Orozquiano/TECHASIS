/**
 * @description Ambientes de ejecución previstos para el frontend.
 */
export type EnvironmentName = 'development' | 'dev' | 'test' | 'preprod' | 'production';

/**
 * @interface AppEnvironment
 * @description Configuración pública del frontend según el ambiente de compilación.
 * Cualquier valor definido aquí queda visible en el navegador y no debe incluir secretos.
 */
export interface AppEnvironment {
  /**
   * @description Indica si la compilación corresponde al ambiente de producción.
   */
  production: boolean;

  /**
   * @description Nombre del ambiente compilado.
   */
  environmentName: EnvironmentName;

  /**
   * @description URL base de la API del backend. Vacía mientras esa URL no esté definida.
   */
  apiUrl: string;
}
