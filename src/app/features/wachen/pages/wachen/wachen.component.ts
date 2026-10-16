import { Component, computed, inject, OnInit, signal } from '@angular/core';
import type { CustodyRecord } from '../../../../core/models';
import { OperationCatalogService } from '../../../../core/operations/operation-catalog.service';
import { formatCop, permanenciaTexto, valorAcumulado } from '../../../../core/operations/operation.logic';
import { PageHelpComponent } from '../../../../shared/components/page-help/page-help.component';

/**
 * @class WachenComponent
 * @description Administra custodias con valor numérico, permanencia y reingresos.
 */
@Component({
  selector: 'app-wachen',
  imports: [PageHelpComponent],
  templateUrl: './wachen.component.html',
})
export class WachenComponent implements OnInit {
  private readonly catalog = inject(OperationCatalogService);

  /**
   * @description Indica la carga inicial.
   */
  protected readonly loading = signal(true);

  /**
   * @description Error de validación o de la vista.
   */
  protected readonly errorMessage = signal<string | null>(null);

  /**
   * @description Aviso de un registro que no sale del navegador.
   */
  protected readonly infoMessage = signal<string | null>(null);

  /**
   * @description Filtro de estado.
   */
  protected readonly status = signal('');

  /**
   * @description Filtro de reingreso.
   */
  protected readonly reentry = signal('');

  /**
   * @description Custodia abierta.
   */
  protected readonly selectedId = signal<number | null>(null);

  /**
   * @description true mientras se confirma el registro.
   */
  protected readonly confirming = signal(false);

  /**
   * @description Evita registrar dos veces.
   */
  protected readonly busy = signal(false);

  /**
   * @description Campos del formulario de custodia.
   */
  protected readonly form = signal({
    vehiculo: '',
    ingreso: '',
    salida: '',
    valor: '',
    estado: 'activa',
    observaciones: '',
    reingreso: false,
    tecnicoNombre: '',
    aseguradora: '',
    servicioRegistro: '',
  });

  /**
   * @description true cuando no hay endpoint de custodias.
   */
  protected readonly contractPending = this.catalog.contractPending;

  /**
   * @description Custodias filtradas.
   */
  protected readonly rows = computed(() =>
    this.catalog.custodias().filter((item) => {
      if (this.status() && item.estado !== this.status()) {
        return false;
      }
      if (this.reentry() === 'si' && !item.reingreso) {
        return false;
      }
      if (this.reentry() === 'no' && item.reingreso) {
        return false;
      }
      return true;
    }),
  );

  /**
   * @description Custodia seleccionada.
   */
  protected readonly selected = computed(() => this.rows().find((item) => item.id === this.selectedId()) ?? null);

  /**
   * @function ngOnInit
   * @description Cierra la carga inicial.
   */
  ngOnInit(): void {
    this.loading.set(false);
  }

  /**
   * @function retry
   * @description Limpia el error de la vista.
   */
  protected retry(): void {
    this.errorMessage.set(null);
    this.loading.set(false);
  }

  /**
   * @function openCustody
   * @description Abre el detalle de una custodia.
   * @param item Custodia elegida.
   */
  protected openCustody(item: CustodyRecord): void {
    this.selectedId.set(item.id);
  }

  /**
   * @function patch
   * @description Actualiza un campo del formulario.
   * @param field Campo que cambia.
   * @param value Nuevo valor.
   */
  protected patch(field: string, value: string | boolean): void {
    this.form.update((current) => ({ ...current, [field]: value }));
  }

  /**
   * @function askSave
   * @description Valida el valor numérico y pide confirmación.
   */
  protected askSave(): void {
    const draft = this.form();
    const valor = Number(draft.valor);
    if (!draft.vehiculo.trim() || !draft.ingreso || !Number.isFinite(valor) || valor < 0) {
      this.errorMessage.set('Indica el vehículo, el ingreso y un valor numérico mayor o igual a cero.');
      return;
    }

    this.errorMessage.set(null);
    this.confirming.set(true);
  }

  /**
   * @function save
   * @description Registra la custodia en demo o informa el contrato pendiente.
   */
  protected save(): void {
    if (this.busy()) {
      return;
    }

    const draft = this.form();
    this.busy.set(true);

    if (this.contractPending) {
      this.infoMessage.set('Contrato pendiente: la custodia no se envió al backend.');
      this.confirming.set(false);
      this.busy.set(false);
      return;
    }

    const created = this.catalog.addDemoCustody({
      servicioRegistro: draft.servicioRegistro.trim(),
      vehiculo: draft.vehiculo.trim(),
      ingreso: draft.ingreso,
      salida: draft.salida || null,
      valor: Number(draft.valor),
      estado: draft.estado === 'finalizada' ? 'finalizada' : 'activa',
      observaciones: draft.observaciones.trim(),
      reingreso: draft.reingreso,
      historialReingresos: [],
      tecnicoNombre: draft.tecnicoNombre.trim(),
      aseguradora: draft.aseguradora.trim(),
    });

    this.infoMessage.set(created ? `Custodia ${created.vehiculo} registrada en la simulación.` : 'No se pudo registrar la custodia.');
    this.confirming.set(false);
    this.busy.set(false);
  }

  /**
   * @function money
   * @description Formatea un valor de custodia.
   * @param value Monto.
   * @returns Texto en pesos.
   */
  protected money(value: number): string {
    return formatCop(value);
  }

  /**
   * @function stay
   * @description Describe la permanencia de una custodia.
   * @param item Custodia consultada.
   * @returns Duración legible.
   */
  protected stay(item: CustodyRecord): string {
    return permanenciaTexto(item.ingreso, item.salida);
  }

  /**
   * @function total
   * @description Suma el valor actual y los reingresos.
   * @param item Custodia consultada.
   * @returns Valor acumulado.
   */
  protected total(item: CustodyRecord): number {
    return valorAcumulado(item);
  }

  /**
   * @function onText
   * @description Actualiza un campo de texto.
   * @param field Campo del formulario.
   * @param event Evento del input.
   */
  protected onText(
    field: 'vehiculo' | 'ingreso' | 'salida' | 'valor' | 'observaciones' | 'tecnicoNombre' | 'aseguradora' | 'servicioRegistro',
    event: Event,
  ): void {
    this.patch(field, (event.target as HTMLInputElement).value);
  }

  /**
   * @function onStatus
   * @description Actualiza el filtro o el estado del formulario.
   * @param target Destino del valor.
   * @param event Evento del selector.
   */
  protected onStatus(target: 'filter' | 'form', event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (target === 'filter') {
      this.status.set(value);
      return;
    }
    this.patch('estado', value);
  }

  /**
   * @function onReentryFilter
   * @description Actualiza el filtro de reingreso.
   * @param event Evento del selector.
   */
  protected onReentryFilter(event: Event): void {
    this.reentry.set((event.target as HTMLSelectElement).value);
  }

  /**
   * @function onReentry
   * @description Actualiza la marca de reingreso del formulario.
   * @param event Evento del checkbox.
   */
  protected onReentry(event: Event): void {
    this.patch('reingreso', (event.target as HTMLInputElement).checked);
  }
}
