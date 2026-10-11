/**
 * @interface ApiResponse
 * @description Contrato genérico de respuesta del backend Techasis.
 */
export interface ApiResponse<T> {
  /**
   * @description Payload de la operación. Puede ser null cuando no hay datos.
   */
  data: T | null;

  /**
   * @description Indica si la operación se completó correctamente.
   */
  success: boolean;

  /**
   * @description Mensaje informativo o de error asociado a la respuesta.
   */
  message: string;

  /**
   * @description Indica si el mensaje debe mostrarse al usuario.
   */
  showsMessage: boolean;

  /**
   * @description Código de error del backend. Puede ser null.
   */
  errorCode: string | null;

  /**
   * @description Marca temporal de la respuesta.
   */
  timestamp: string;
}
