import type { ApiResponse } from '../models';

/**
 * @class AppMessages
 * @description Mensajes fijos que se muestran cuando el backend no autoriza su propio texto.
 */
export class AppMessages {
  /**
   * @description Texto genérico de una operación fallida.
   */
  static readonly GENERIC_ERROR = '[000]: No fue posible completar la operación. Inténtalo de nuevo.';
}

/**
 * @function formatApiMessage
 * @description Arma el texto visible de una respuesta fallida.
 * Si hay código de error, el formato es `[errorCode]: message`.
 * @param response Respuesta del backend. Puede no existir.
 * @returns Texto listo para el popup de error.
 */
export function formatApiMessage(
  response: Pick<ApiResponse<unknown>, 'message' | 'showsMessage' | 'errorCode'> | null,
): string {
  const text =
    response?.showsMessage && response.message ? response.message : AppMessages.GENERIC_ERROR;

  return response?.errorCode ? `[${response.errorCode}]: ${text}` : text;
}
