import type {
  ConciliationDraft,
  ConciliationIssue,
  ConciliationMatch,
  ConciliationRow,
  CustodyRecord,
  RankingRow,
  ReportQuery,
  ReportView,
  ServiceLifecycle,
  ServiceRecord,
} from '../models/operation.model';

/**
 * @description Columnas obligatorias del archivo de conciliación.
 */
export const CONCILIATION_COLUMNS = ['AUTORIZACION', 'NUMERO DE FACTURA'] as const;

/**
 * @description Etiquetas visibles de los estados operativos de la vista.
 */
export const SERVICE_STATUS_LABEL: Record<ServiceLifecycle, string> = {
  pendiente: 'Pendiente',
  programado: 'Programado',
  en_proceso: 'En proceso',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
};

/**
 * @function isDemoAdministrativeRole
 * @description Indica si el rol del catálogo demo puede ver todos los servicios.
 * Administrador es 1 y Operador es 3. El técnico es 2.
 * El backend real no confirma esta correspondencia para producción.
 * @param rolId Identificador de rol guardado en la sesión.
 * @returns true para los roles administrativos del catálogo demo.
 */
export function isDemoAdministrativeRole(rolId: number | null): boolean {
  return rolId === 1 || rolId === 3;
}

/**
 * @function requiresManualValue
 * @description Detecta la opción OTRO que obliga a completar el campo manual.
 * @param value Valor seleccionado en el catálogo.
 * @returns true cuando la selección es OTRO o comienza por OTRO.
 */
export function requiresManualValue(value: string | null | undefined): boolean {
  const normalized = (value ?? '').trim().toUpperCase();
  return normalized === 'OTRO' || normalized.startsWith('OTRO ');
}

/**
 * @function visibleServices
 * @description Limita el listado según el rol demo y el usuario autenticado.
 * @param items Servicios conocidos en la vista.
 * @param rolId Rol de la sesión.
 * @param userId Identificador del usuario autenticado.
 * @returns Servicios visibles para ese rol.
 */
export function visibleServices(
  items: ServiceRecord[],
  rolId: number | null,
  userId: number | null,
): ServiceRecord[] {
  if (isDemoAdministrativeRole(rolId)) {
    return items;
  }

  if (userId == null) {
    return [];
  }

  return items.filter((item) => item.tecnicoId === userId);
}

/**
 * @function activeServices
 * @description Conserva servicios pendientes, programados o en proceso.
 * @param items Servicios a filtrar.
 * @returns Servicios que siguen operativos.
 */
export function activeServices(items: ServiceRecord[]): ServiceRecord[] {
  return items.filter(
    (item) =>
      item.estado === 'pendiente' || item.estado === 'programado' || item.estado === 'en_proceso',
  );
}

/**
 * @function fileServices
 * @description Conserva servicios que se administran como expediente.
 * @param items Servicios a filtrar.
 * @returns Finalizados, cancelados y programados.
 */
export function fileServices(items: ServiceRecord[]): ServiceRecord[] {
  return items.filter(
    (item) =>
      item.estado === 'finalizado' || item.estado === 'cancelado' || item.estado === 'programado',
  );
}

/**
 * @function parseConciliationFile
 * @description Valida un CSV o TXT y separa filas procesables, duplicadas e inválidas.
 * No procesa el archivo si faltan las columnas obligatorias.
 * @param content Texto completo del archivo.
 * @returns Borrador de conciliación.
 */
export function parseConciliationFile(content: string): ConciliationDraft {
  const text = content.replace(/^\uFEFF/, '').trim();

  if (!text) {
    return {
      valido: false,
      columnasFaltantes: [...CONCILIATION_COLUMNS],
      filas: [],
      duplicados: [],
      invalidas: [{ linea: 1, motivo: 'El archivo está vacío.' }],
    };
  }

  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const delimiter = detectDelimiter(lines[0]);
  const headers = splitRow(lines[0], delimiter).map(normalizeHeader);
  const missing = CONCILIATION_COLUMNS.filter((column) => !headers.includes(column));

  if (missing.length > 0) {
    return {
      valido: false,
      columnasFaltantes: [...missing],
      filas: [],
      duplicados: [],
      invalidas: [],
    };
  }

  const authorizationIndex = headers.indexOf('AUTORIZACION');
  const invoiceIndex = headers.indexOf('NUMERO DE FACTURA');
  const raw: ConciliationRow[] = [];
  const invalidas: ConciliationIssue[] = [];

  for (let index = 1; index < lines.length; index += 1) {
    const columns = splitRow(lines[index], delimiter);
    const autorizacion = (columns[authorizationIndex] ?? '').trim();
    const factura = (columns[invoiceIndex] ?? '').trim();

    if (!autorizacion || !factura) {
      invalidas.push({
        linea: index + 1,
        motivo: 'Autorización o número de factura vacío.',
      });
      continue;
    }

    raw.push({ linea: index + 1, autorizacion, factura });
  }

  const counts = new Map<string, number>();
  for (const row of raw) {
    counts.set(row.autorizacion, (counts.get(row.autorizacion) ?? 0) + 1);
  }

  const duplicados = [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([autorizacion]) => autorizacion);
  const filas = raw.filter((row) => counts.get(row.autorizacion) === 1);

  return {
    valido: true,
    columnasFaltantes: [],
    filas,
    duplicados,
    invalidas,
  };
}

/**
 * @function matchAuthorizations
 * @description Cruza autorizaciones procesables con los servicios de la vista.
 * @param rows Filas válidas del archivo.
 * @param services Servicios contra los que se busca.
 * @returns Resultado de cada cruce.
 */
export function matchAuthorizations(
  rows: ConciliationRow[],
  services: Pick<ServiceRecord, 'autorizacion' | 'registro'>[],
): ConciliationMatch[] {
  return rows.map((row) => {
    const found = services.find((service) => service.autorizacion.trim() === row.autorizacion.trim());
    return {
      autorizacion: row.autorizacion,
      factura: row.factura,
      encontrada: Boolean(found),
      registro: found?.registro ?? null,
    };
  });
}

/**
 * @function conciliationResultCsv
 * @description Arma un CSV descargable con el resultado de la vista previa.
 * @param matches Cruces calculados.
 * @param duplicados Autorizaciones repetidas.
 * @param invalidas Filas rechazadas.
 * @returns Texto CSV.
 */
export function conciliationResultCsv(
  matches: ConciliationMatch[],
  duplicados: string[],
  invalidas: ConciliationIssue[],
): string {
  const lines = ['AUTORIZACION,NUMERO DE FACTURA,RESULTADO,REGISTRO'];

  for (const match of matches) {
    lines.push(
      [
        escapeCsv(match.autorizacion),
        escapeCsv(match.factura),
        match.encontrada ? 'ENCONTRADA' : 'NO ENCONTRADA',
        escapeCsv(match.registro ?? ''),
      ].join(','),
    );
  }

  for (const autorizacion of duplicados) {
    lines.push(`${escapeCsv(autorizacion)},,DUPLICADA,`);
  }

  for (const issue of invalidas) {
    lines.push(`,,INVALIDA,"${issue.motivo.replaceAll('"', '""')} linea ${issue.linea}"`);
  }

  return lines.join('\n');
}

/**
 * @function buildRanking
 * @description Ordena técnicos por la suma del valor registrado a la aseguradora, de mayor a menor.
 * Solo cuenta servicios finalizados. No calcula rentabilidad.
 * @param items Servicios de la vista.
 * @param desde Fecha inicial inclusive. Opcional.
 * @param hasta Fecha final inclusive. Opcional.
 * @returns Ranking del periodo.
 */
export function buildRanking(items: ServiceRecord[], desde?: string, hasta?: string): RankingRow[] {
  const period = formatPeriod(desde, hasta);
  const grouped = new Map<number, RankingRow>();

  for (const item of items) {
    if (item.estado !== 'finalizado' || !inRange(item.fecha, desde, hasta)) {
      continue;
    }

    const current = grouped.get(item.tecnicoId) ?? {
      tecnicoId: item.tecnicoId,
      nombre: item.tecnicoNombre,
      servicios: 0,
      dineroGenerado: 0,
      valorTecnico: 0,
      periodo: period,
    };

    current.servicios += 1;
    current.dineroGenerado += item.valorAseguradora;
    current.valorTecnico += item.valorTecnico;
    grouped.set(item.tecnicoId, current);
  }

  return [...grouped.values()].sort(
    (left, right) =>
      right.dineroGenerado - left.dineroGenerado || left.nombre.localeCompare(right.nombre, 'es'),
  );
}

/**
 * @function buildReport
 * @description Filtra servicios y suma los valores que ya están registrados.
 * @param items Servicios de la vista.
 * @param query Filtros de la pantalla.
 * @returns Listado y totales de campos almacenados.
 */
export function buildReport(items: ServiceRecord[], query: ReportQuery): ReportView {
  const servicios = items.filter((item) => matchesReport(item, query));
  return {
    servicios,
    cantidad: servicios.length,
    totalAseguradora: servicios.reduce((sum, item) => sum + item.valorAseguradora, 0),
    totalTecnico: servicios.reduce((sum, item) => sum + item.valorTecnico, 0),
  };
}

/**
 * @function countByInsurer
 * @description Cuenta servicios por aseguradora.
 * @param items Servicios a contar.
 * @returns Parejas de aseguradora y cantidad, de mayor a menor.
 */
export function countByInsurer(items: ServiceRecord[]): { aseguradora: string; cantidad: number }[] {
  const counts = new Map<string, number>();

  for (const item of items) {
    counts.set(item.aseguradora, (counts.get(item.aseguradora) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([aseguradora, cantidad]) => ({ aseguradora, cantidad }))
    .sort((left, right) => right.cantidad - left.cantidad || left.aseguradora.localeCompare(right.aseguradora, 'es'));
}

/**
 * @function countInMonth
 * @description Cuenta servicios cuya fecha pertenece al mes indicado.
 * @param items Servicios a contar.
 * @param month Mes en formato yyyy-mm.
 * @returns Cantidad de servicios.
 */
export function countInMonth(items: ServiceRecord[], month: string): number {
  return items.filter((item) => item.fecha.startsWith(month)).length;
}

/**
 * @function valorAcumulado
 * @description Suma el valor actual de la custodia y los valores de sus reingresos.
 * @param custody Custodia consultada.
 * @returns Valor acumulado registrado.
 */
export function valorAcumulado(custody: CustodyRecord): number {
  return custody.historialReingresos.reduce((sum, stay) => sum + stay.valor, custody.valor);
}

/**
 * @function permanenciaTexto
 * @description Calcula el tiempo entre el ingreso y la salida, o hasta el instante indicado.
 * @param ingreso Fecha y hora de ingreso.
 * @param salida Fecha y hora de salida. Puede no existir.
 * @param now Instante de referencia cuando la custodia sigue activa.
 * @returns Duración legible o un guion si las fechas no se pueden interpretar.
 */
export function permanenciaTexto(ingreso: string, salida: string | null, now = Date.now()): string {
  const start = Date.parse(ingreso);
  const end = salida ? Date.parse(salida) : now;

  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    return '—';
  }

  const minutes = Math.floor((end - start) / 60000);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return hours > 0 ? `${hours} h ${rest} min` : `${rest} min`;
}

/**
 * @function formatCop
 * @description Presenta un valor en pesos colombianos sin decimales.
 * @param value Monto a mostrar.
 * @returns Texto monetario.
 */
export function formatCop(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * @function formatDateLabel
 * @description Presenta una fecha yyyy-mm-dd como dd/mm/aaaa.
 * @param value Fecha de origen.
 * @returns Fecha visible.
 */
export function formatDateLabel(value: string | null): string {
  if (!value) {
    return '—';
  }

  const [year, month, day] = value.slice(0, 10).split('-');
  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}

/**
 * @function normalizeHeader
 * @description Homologa un encabezado para compararlo con las columnas obligatorias.
 * @param value Texto original del encabezado.
 * @returns Encabezado sin acentos, en mayúsculas y con espacios simples.
 */
function normalizeHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/["']/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * @function detectDelimiter
 * @description Elige el separador más frecuente de la fila de encabezados.
 * @param header Primera línea del archivo.
 * @returns Separador detectado.
 */
function detectDelimiter(header: string): string {
  const candidates = [',', ';', '\t'];
  return candidates.reduce((best, candidate) =>
    header.split(candidate).length > header.split(best).length ? candidate : best,
  );
}

/**
 * @function splitRow
 * @description Divide una fila respetando campos entre comillas.
 * @param line Línea del archivo.
 * @param delimiter Separador elegido.
 * @returns Columnas de la fila.
 */
function splitRow(line: string, delimiter: string): string[] {
  const columns: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (char === delimiter && !quoted) {
      columns.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  columns.push(current.trim());
  return columns;
}

/**
 * @function escapeCsv
 * @description Escapa un valor para escribirlo en CSV.
 * @param value Texto original.
 * @returns Valor seguro para una celda.
 */
function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }

  return value;
}

/**
 * @function inRange
 * @description Comprueba si una fecha cae en el rango inclusive.
 * @param fecha Fecha yyyy-mm-dd.
 * @param desde Límite inicial. Opcional.
 * @param hasta Límite final. Opcional.
 * @returns true cuando la fecha pertenece al rango.
 */
function inRange(fecha: string, desde?: string, hasta?: string): boolean {
  if (desde && fecha < desde) {
    return false;
  }

  if (hasta && fecha > hasta) {
    return false;
  }

  return true;
}

/**
 * @function formatPeriod
 * @description Describe el periodo usado por el ranking.
 * @param desde Fecha inicial. Opcional.
 * @param hasta Fecha final. Opcional.
 * @returns Texto del periodo.
 */
function formatPeriod(desde?: string, hasta?: string): string {
  if (!desde && !hasta) {
    return 'Todo el historial disponible';
  }

  return `${formatDateLabel(desde ?? '')} – ${formatDateLabel(hasta ?? '')}`;
}

/**
 * @function matchesReport
 * @description Evalúa si un servicio cumple los filtros del informe.
 * @param item Servicio evaluado.
 * @param query Filtros activos.
 * @returns true cuando el servicio debe aparecer.
 */
function matchesReport(item: ServiceRecord, query: ReportQuery): boolean {
  if (!inRange(item.fecha, query.desde, query.hasta)) {
    return false;
  }

  if (query.aseguradora && item.aseguradora !== query.aseguradora) {
    return false;
  }

  if (query.tecnicoId && item.tecnicoId !== query.tecnicoId) {
    return false;
  }

  if (query.estado && item.estado !== query.estado) {
    return false;
  }

  if (query.estadoFactura && item.estadoFactura !== query.estadoFactura) {
    return false;
  }

  if (query.registro && !item.registro.toLowerCase().includes(query.registro.trim().toLowerCase())) {
    return false;
  }

  if (
    query.autorizacion &&
    !item.autorizacion.toLowerCase().includes(query.autorizacion.trim().toLowerCase())
  ) {
    return false;
  }

  if (query.factura && !(item.numFactura ?? '').toLowerCase().includes(query.factura.trim().toLowerCase())) {
    return false;
  }

  return true;
}
