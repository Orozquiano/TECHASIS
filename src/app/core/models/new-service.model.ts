import type { ApiResponse } from './api-response.model';
import type { Insurance } from './insurance.model';
import type { ServiceStatus } from './service-status.model';
import type { User } from './user.model';
import type { Vehicle } from './vehicle.model';

/**
 * @interface Telefono
 * @description Teléfono catalogado para el formulario de nuevo servicio.
 */
export interface Telefono {
  id: number;
  descripcion: string;
  codigo: string;
}

/**
 * @interface ServiceInitPayload
 * @description Parámetros administrativos para iniciar un servicio.
 */
export interface ServiceInitPayload {
  telefonos: Telefono[];
  usuariosTecnicos: User[];
  gruas: Vehicle[];
  estadosServicio: ServiceStatus[];
  aseguradoras: Insurance[];
}

/**
 * @description Respuesta tipada de parámetros de nuevo servicio.
 */
export type ServiceInitData = ApiResponse<ServiceInitPayload>;
