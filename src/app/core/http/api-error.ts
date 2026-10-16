import { HttpErrorResponse } from '@angular/common/http';
import type { ApiResponse } from '../models';

/**
 * @class ContractPendingError
 * @description Señal de una operación cuyo contrato no está confirmado en Postman.
 */
export class ContractPendingError extends Error {
  /**
   * @description Marca estable para reconocer el contrato pendiente.
   */
  readonly contract = 'pending' as const;

  /**
   * @param message Texto que puede mostrarse al usuario.
   */
  constructor(message: string) {
    super(message);
    this.name = 'ContractPendingError';
  }
}

/**
 * @function isApiEnvelope
 * @description Reconoce el envelope real del backend.
 * @param value Valor desconocido.
 * @returns true cuando tiene success, message y showsMessage.
 */
function isApiEnvelope(value: unknown): value is ApiResponse<unknown> {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const record = value as Record<string, unknown>;
  return typeof record['success'] === 'boolean' && typeof record['showsMessage'] === 'boolean';
}

/**
 * @function readApiEnvelope
 * @description Extrae el envelope desde un error HTTP o desde una respuesta de negocio lanzada como error.
 * @param error Error capturado por una suscripción.
 * @returns Envelope o null cuando la respuesta no trae ese contrato.
 */
export function readApiEnvelope(error: unknown): ApiResponse<unknown> | null {
  if (error instanceof HttpErrorResponse && isApiEnvelope(error.error)) {
    return error.error;
  }

  if (isApiEnvelope(error)) {
    return error;
  }

  return null;
}

/**
 * @function messageFromHttpError
 * @description Traduce un error HTTP o de negocio a un texto comprensible.
 * Usa el mensaje del backend solo cuando showsMessage es true.
 * @param error Error capturado.
 * @param fallback Texto contextual cuando el backend no autoriza su mensaje.
 * @returns Texto para la interfaz.
 */
export function messageFromHttpError(error: unknown, fallback: string): string {
  if (error instanceof ContractPendingError) {
    return error.message;
  }

  if (error instanceof HttpErrorResponse && error.status === 0) {
    return 'No hay conexión con el servidor. Inténtalo de nuevo.';
  }

  const envelope = readApiEnvelope(error);
  if (envelope?.showsMessage && envelope.message) {
    return envelope.errorCode ? `[${envelope.errorCode}]: ${envelope.message}` : envelope.message;
  }

  if (error instanceof HttpErrorResponse) {
    if (error.status === 401) {
      return 'La sesión no es válida. Vuelve a iniciar sesión.';
    }
    if (error.status === 403) {
      return 'No tienes permiso para esta operación.';
    }
    if (error.status === 404) {
      return 'No se encontró el registro solicitado.';
    }
    if (error.status === 409) {
      return fallback;
    }
  }

  return fallback;
}
