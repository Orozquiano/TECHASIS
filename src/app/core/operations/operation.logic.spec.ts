import { DEMO_SERVICES } from './demo-operations';
import { DEMO_CUSTODIES } from './demo-operations';
import {
  activeServices,
  buildRanking,
  buildReport,
  fileServices,
  matchAuthorizations,
  parseConciliationFile,
  permanenciaTexto,
  requiresManualValue,
  valorAcumulado,
  visibleServices,
} from './operation.logic';

describe('operation.logic', () => {
  it('exige el campo manual cuando la selección es OTRO', () => {
    expect(requiresManualValue('OTRO')).toBe(true);
    expect(requiresManualValue('OTRO (Pegar número)')).toBe(true);
    expect(requiresManualValue('otro')).toBe(true);
    expect(requiresManualValue('3001112233')).toBe(false);
    expect(requiresManualValue('')).toBe(false);
  });

  it('muestra todos los servicios al rol administrativo y solo los asignados al técnico', () => {
    expect(visibleServices(DEMO_SERVICES, 1, 1)).toHaveLength(DEMO_SERVICES.length);
    expect(visibleServices(DEMO_SERVICES, 2, 2).every((item) => item.tecnicoId === 2)).toBe(true);
    expect(visibleServices(DEMO_SERVICES, null, null)).toHaveLength(0);
  });

  it('separa servicios operativos y expedientes', () => {
    expect(activeServices(DEMO_SERVICES).map((item) => item.registro)).toEqual([
      'SR-1001',
      'SR-1002',
      'SR-1003',
    ]);
    expect(fileServices(DEMO_SERVICES).map((item) => item.estado)).not.toContain('pendiente');
    expect(fileServices(DEMO_SERVICES).map((item) => item.estado)).not.toContain('en_proceso');
  });

  it('no procesa un archivo sin las columnas obligatorias', () => {
    const draft = parseConciliationFile('AUTORIZACION,OTRO\nAUTH-1001,F-1');
    expect(draft.valido).toBe(false);
    expect(draft.columnasFaltantes).toEqual(['NUMERO DE FACTURA']);
    expect(draft.filas).toHaveLength(0);
  });

  it('separa duplicados, filas inválidas y autorizaciones no encontradas', () => {
    const content = [
      'Autorización;Número de factura',
      'AUTH-1004;F-900',
      'AUTH-404;F-901',
      'AUTH-1001;',
      'AUTH-1004;F-902',
    ].join('\n');
    const draft = parseConciliationFile(content);

    expect(draft.valido).toBe(true);
    expect(draft.duplicados).toEqual(['AUTH-1004']);
    expect(draft.invalidas).toHaveLength(1);
    expect(draft.filas.map((row) => row.autorizacion)).toEqual(['AUTH-404']);

    const matches = matchAuthorizations(draft.filas, DEMO_SERVICES);
    expect(matches[0]?.encontrada).toBe(false);
  });

  it('ordena el ranking por dinero registrado y no inventa rentabilidad', () => {
    const ranking = buildRanking(DEMO_SERVICES);
    expect(ranking.map((row) => row.nombre)).toEqual(['Carlos Pérez', 'Admin Techasis']);
    expect(ranking[0]?.dineroGenerado).toBe(300000);
    expect(ranking[0]).not.toHaveProperty('rentabilidad');
  });

  it('suma solo los valores registrados en el informe', () => {
    const report = buildReport(DEMO_SERVICES, { aseguradora: 'SURA', estado: 'finalizado' });
    expect(report.cantidad).toBe(1);
    expect(report.totalAseguradora).toBe(300000);
    expect(report.totalTecnico).toBe(110000);
    expect(report).not.toHaveProperty('utilidad');
  });

  it('calcula el valor acumulado y la permanencia de una custodia', () => {
    const finished = DEMO_CUSTODIES[1];
    expect(valorAcumulado(finished)).toBe(110000);
    expect(permanenciaTexto('2026-10-01T12:10:00', '2026-10-02T09:30:00')).toBe('21 h 20 min');
    expect(finished.observaciones).not.toContain('80000');
  });
});
