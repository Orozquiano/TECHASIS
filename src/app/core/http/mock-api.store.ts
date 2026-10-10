import type {
  Insurance,
  MenuItem,
  ServiceStatus,
  Telefono,
  TipoDocumento,
  TipoVehiculo,
  User,
  Vehicle,
  Rol,
} from '../models';

/**
 * @description Credenciales válidas del modo demo.
 */
export const DEMO_CREDENTIALS = {
  user: '1111111111',
  password: 'admin',
} as const;

/**
 * @function createDemoMenu
 * @description Construye el menú completo disponible en el despliegue simulado.
 * @returns Ítems de menú alineados con las rutas de la aplicación.
 */
export function createDemoMenu(): MenuItem[] {
  return [
    { id: 1, padreMenuId: null, nombre: 'newService', descripcion: 'Nuevo servicio', codigo: 'NS' },
    { id: 2, padreMenuId: null, nombre: 'services', descripcion: 'Servicios', codigo: 'SV' },
    { id: 3, padreMenuId: null, nombre: 'files', descripcion: 'Expedientes', codigo: 'FL' },
    {
      id: 4,
      padreMenuId: null,
      nombre: 'conciliations',
      descripcion: 'Conciliación',
      codigo: 'CN',
    },
    { id: 5, padreMenuId: null, nombre: 'reports', descripcion: 'Informes', codigo: 'RP' },
    { id: 6, padreMenuId: null, nombre: 'ranking', descripcion: 'Ranking', codigo: 'RK' },
    { id: 7, padreMenuId: null, nombre: 'wachen', descripcion: 'Custodias', codigo: 'WC' },
    {
      id: 8,
      padreMenuId: null,
      nombre: 'administration',
      descripcion: 'Administración',
      codigo: 'AD',
    },
  ];
}

/**
 * @class MockApiStore
 * @description Almacén en memoria con datos simulados para el modo demo.
 */
export class MockApiStore {
  /**
   * @description Contador incremental para nuevos identificadores.
   */
  private nextId = 100;

  /**
   * @description Tipos de documento simulados.
   */
  readonly tiposDocumento: TipoDocumento[] = [
    { id: 1, nombre: 'Cédula de ciudadanía', codigo: 'CC' },
    { id: 2, nombre: 'Cédula de extranjería', codigo: 'CE' },
  ];

  /**
   * @description Roles simulados.
   */
  readonly roles: Rol[] = [
    { id: 1, nombre: 'Administrador', codigo: 'ADMIN' },
    { id: 2, nombre: 'Técnico', codigo: 'TEC' },
    { id: 3, nombre: 'Operador', codigo: 'OP' },
  ];

  /**
   * @description Tipos de vehículo simulados.
   */
  readonly tiposVehiculo: TipoVehiculo[] = [
    { id: 1, nombre: 'Grúa', codigo: 'GRU' },
    { id: 2, nombre: 'Carro taller', codigo: 'CT' },
  ];

  /**
   * @description Teléfonos catalogados simulados.
   */
  readonly telefonos: Telefono[] = [
    { id: 1, descripcion: '3001112233', codigo: 'TEL1' },
    { id: 2, descripcion: '3104445566', codigo: 'TEL2' },
    { id: 3, descripcion: 'OTRO (Pegar número)', codigo: 'OTRO' },
  ];

  /**
   * @description Usuarios simulados.
   */
  users: User[] = [
    {
      id: 1,
      tipoDocumentoId: 1,
      documento: '1111111111',
      primerNombre: 'Admin',
      segundoNombre: null,
      primerApellido: 'Techasis',
      segundoApellido: null,
      rolId: 1,
      activo: true,
    },
    {
      id: 2,
      tipoDocumentoId: 1,
      documento: '2222222222',
      primerNombre: 'Carlos',
      segundoNombre: 'Andrés',
      primerApellido: 'Pérez',
      segundoApellido: null,
      rolId: 2,
      activo: true,
    },
    {
      id: 3,
      tipoDocumentoId: 1,
      documento: '3333333333',
      primerNombre: 'Laura',
      segundoNombre: null,
      primerApellido: 'Gómez',
      segundoApellido: 'Ríos',
      rolId: 2,
      activo: true,
    },
  ];

  /**
   * @description Vehículos / grúas simulados.
   */
  vehicles: Vehicle[] = [
    {
      id: 1,
      tipoVehiculo: this.tiposVehiculo[0],
      placa: 'ABC123',
      codigo: 'G01',
      activo: true,
    },
    {
      id: 2,
      tipoVehiculo: this.tiposVehiculo[0],
      placa: 'XYZ789',
      codigo: 'G02',
      activo: true,
    },
  ];

  /**
   * @description Aseguradoras simuladas.
   */
  insurances: Insurance[] = [
    { id: 1, nombre: 'BOLIVAR', codigo: 'BOL', activo: true },
    { id: 2, nombre: 'AXA', codigo: 'AXA', activo: true },
    { id: 3, nombre: 'IKE', codigo: 'IKE', activo: true },
    { id: 4, nombre: 'OTRO', codigo: 'OTR', activo: true },
  ];

  /**
   * @description Estados de servicio simulados.
   */
  statuses: ServiceStatus[] = [
    { id: 1, descripcion: 'En proceso', codigo: 'EP', activo: true },
    { id: 2, descripcion: 'Finalizado', codigo: 'FN', activo: true },
    { id: 3, descripcion: 'Cancelado', codigo: 'CA', activo: true },
  ];

  /**
   * @function next
   * @description Genera el siguiente identificador disponible.
   * @returns Identificador numérico nuevo.
   */
  next(): number {
    this.nextId += 1;
    return this.nextId;
  }
}

/**
 * @description Instancia compartida del almacén demo durante la sesión del navegador.
 */
export const mockApiStore = new MockApiStore();
