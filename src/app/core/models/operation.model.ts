/**
 * @description Ciclo visible de un servicio en las vistas operativas.
 * No es un catálogo confirmado por el backend.
 */
export type ServiceLifecycle =
  | 'pendiente'
  | 'programado'
  | 'en_proceso'
  | 'finalizado'
  | 'cancelado';

/**
 * @interface ServiceRecord
 * @description Vista local de un servicio. No representa la respuesta de un endpoint:
 * la colección disponible no define el contrato de creación, listado ni expediente.
 */
export interface ServiceRecord {
  /**
   * @description Identificador local de la vista.
   */
  id: number;

  /**
   * @description Número de registro visible.
   */
  registro: string;

  /**
   * @description Fecha del servicio en formato yyyy-mm-dd.
   */
  fecha: string;

  /**
   * @description Hora del servicio en formato HH:mm.
   */
  hora: string;

  /**
   * @description Nombre del cliente o asegurado.
   */
  asegurado: string;

  /**
   * @description Aseguradora asociada.
   */
  aseguradora: string;

  /**
   * @description Identificador del técnico asignado.
   */
  tecnicoId: number;

  /**
   * @description Nombre visible del técnico asignado.
   */
  tecnicoNombre: string;

  /**
   * @description Estado operativo usado por las vistas.
   */
  estado: ServiceLifecycle;

  /**
   * @description Número de autorización.
   */
  autorizacion: string;

  /**
   * @description Origen de la ruta.
   */
  origen: string;

  /**
   * @description Destino de la ruta.
   */
  destino: string;

  /**
   * @description Ciudad de la ruta.
   */
  ciudad: string;

  /**
   * @description Tipo de servicio.
   */
  tipoServicio: string;

  /**
   * @description Placa del vehículo atendido.
   */
  placa: string;

  /**
   * @description Teléfono de contacto.
   */
  telefono: string;

  /**
   * @description Valor económico registrado para la aseguradora.
   */
  valorAseguradora: number;

  /**
   * @description Valor económico registrado para el técnico.
   */
  valorTecnico: number;

  /**
   * @description Número de factura cuando existe.
   */
  numFactura: string | null;

  /**
   * @description Estado de facturación registrado.
   */
  estadoFactura: string;

  /**
   * @description Observaciones operativas.
   */
  observaciones: string;

  /**
   * @description Nombres de evidencias asociadas. No incluye el archivo.
   */
  evidencias: string[];

  /**
   * @description Fecha de cierre, cancelación o programación. Puede no existir.
   */
  fechaCierre: string | null;
}

/**
 * @interface CustodyStay
 * @description Reingreso con su valor numérico, separado de las observaciones.
 */
export interface CustodyStay {
  /**
   * @description Fecha y hora del reingreso.
   */
  fecha: string;

  /**
   * @description Valor cobrado en ese reingreso.
   */
  valor: number;
}

/**
 * @interface CustodyRecord
 * @description Custodia de un vehículo. El valor es numérico y no vive dentro de observaciones.
 */
export interface CustodyRecord {
  /**
   * @description Identificador local de la custodia.
   */
  id: number;

  /**
   * @description Registro del servicio relacionado.
   */
  servicioRegistro: string;

  /**
   * @description Vehículo custodiado.
   */
  vehiculo: string;

  /**
   * @description Fecha y hora de ingreso.
   */
  ingreso: string;

  /**
   * @description Fecha y hora de salida. Vacía mientras la custodia sigue activa.
   */
  salida: string | null;

  /**
   * @description Valor cobrado por la permanencia actual.
   */
  valor: number;

  /**
   * @description Estado de la custodia.
   */
  estado: 'activa' | 'finalizada';

  /**
   * @description Notas adicionales. No sustituyen el valor.
   */
  observaciones: string;

  /**
   * @description Indica si el vehículo tuvo reingreso.
   */
  reingreso: boolean;

  /**
   * @description Historial de reingresos con valor propio.
   */
  historialReingresos: CustodyStay[];

  /**
   * @description Técnico o responsable.
   */
  tecnicoNombre: string;

  /**
   * @description Aseguradora del servicio relacionado.
   */
  aseguradora: string;
}

/**
 * @interface ConciliationRow
 * @description Fila válida de un archivo de conciliación.
 */
export interface ConciliationRow {
  /**
   * @description Número de línea en el archivo, empezando en 1.
   */
  linea: number;

  /**
   * @description Autorización leída.
   */
  autorizacion: string;

  /**
   * @description Número de factura leído.
   */
  factura: string;
}

/**
 * @interface ConciliationIssue
 * @description Fila que no se puede procesar.
 */
export interface ConciliationIssue {
  /**
   * @description Línea del archivo.
   */
  linea: number;

  /**
   * @description Motivo por el que se rechaza la fila.
   */
  motivo: string;
}

/**
 * @interface ConciliationDraft
 * @description Resultado de validar la estructura del archivo antes de cruzarlo.
 */
export interface ConciliationDraft {
  /**
   * @description true cuando el archivo trae las columnas obligatorias.
   */
  valido: boolean;

  /**
   * @description Columnas obligatorias que no aparecieron.
   */
  columnasFaltantes: string[];

  /**
   * @description Filas procesables, sin duplicados ni vacíos.
   */
  filas: ConciliationRow[];

  /**
   * @description Autorizaciones repetidas dentro del archivo.
   */
  duplicados: string[];

  /**
   * @description Filas vacías o incompletas.
   */
  invalidas: ConciliationIssue[];
}

/**
 * @interface ConciliationMatch
 * @description Cruce de una autorización con los servicios conocidos en la vista.
 */
export interface ConciliationMatch {
  /**
   * @description Autorización buscada.
   */
  autorizacion: string;

  /**
   * @description Factura que se asignaría.
   */
  factura: string;

  /**
   * @description true cuando existe un servicio con esa autorización.
   */
  encontrada: boolean;

  /**
   * @description Registro del servicio encontrado.
   */
  registro: string | null;
}

/**
 * @interface RankingRow
 * @description Posición de un técnico según el dinero registrado en servicios finalizados.
 * No incluye rentabilidad: esa regla no está confirmada.
 */
export interface RankingRow {
  /**
   * @description Identificador del técnico.
   */
  tecnicoId: number;

  /**
   * @description Nombre del técnico.
   */
  nombre: string;

  /**
   * @description Cantidad de servicios finalizados en el periodo.
   */
  servicios: number;

  /**
   * @description Suma del valor registrado a la aseguradora.
   */
  dineroGenerado: number;

  /**
   * @description Suma del valor registrado al técnico.
   */
  valorTecnico: number;

  /**
   * @description Periodo consultado.
   */
  periodo: string;
}

/**
 * @interface ReportQuery
 * @description Filtros de la vista de informes. No corresponden a un query de backend.
 */
export interface ReportQuery {
  /**
   * @description Fecha inicial inclusive, yyyy-mm-dd. Opcional.
   */
  desde?: string;

  /**
   * @description Fecha final inclusive, yyyy-mm-dd. Opcional.
   */
  hasta?: string;

  /**
   * @description Aseguradora exacta. Opcional.
   */
  aseguradora?: string;

  /**
   * @description Técnico. Opcional.
   */
  tecnicoId?: number | null;

  /**
   * @description Estado operativo. Opcional.
   */
  estado?: string;

  /**
   * @description Estado de facturación. Opcional.
   */
  estadoFactura?: string;

  /**
   * @description Número de servicio o registro. Opcional.
   */
  registro?: string;

  /**
   * @description Número de autorización. Opcional.
   */
  autorizacion?: string;

  /**
   * @description Número de factura. Opcional.
   */
  factura?: string;
}

/**
 * @interface ReportView
 * @description Listado filtrado y sumas de valores ya registrados.
 * No calcula utilidad ni rentabilidad.
 */
export interface ReportView {
  /**
   * @description Servicios que cumplen los filtros.
   */
  servicios: ServiceRecord[];

  /**
   * @description Cantidad de servicios del listado.
   */
  cantidad: number;

  /**
   * @description Suma de valorAseguradora.
   */
  totalAseguradora: number;

  /**
   * @description Suma de valorTecnico.
   */
  totalTecnico: number;
}
