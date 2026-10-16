import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import type { CustodyRecord } from '../../../../core/models';
import { OperationCatalogService } from '../../../../core/operations/operation-catalog.service';
import { formatCop, permanenciaTexto, valorAcumulado } from '../../../../core/operations/operation.logic';
import { PageHelpComponent } from '../../../../shared/components/page-help/page-help.component';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';
import { SelectComponent, type SelectOption } from '../../../../shared/components/select/select.component';
import { TimeFieldComponent } from '../../../../shared/components/time-field/time-field.component';

/**
 * @class WachenComponent
 * @description Administra custodias con valor numérico, permanencia y reingresos.
 */
@Component({
  selector: 'app-wachen',
  imports: [FormsModule, PageHelpComponent, DateFieldComponent, SelectComponent, TimeFieldComponent],
  templateUrl: './wachen.component.html',
  styleUrl: './wachen.component.scss',
})
export class WachenComponent implements OnInit {
  private readonly catalog = inject(OperationCatalogService);

  /**
   * @description Estados de custodia del filtro.
   */
  protected readonly custodyStatusOptions: SelectOption[] = [
    { value: 'activa', label: 'Activas' },
    { value: 'finalizada', label: 'Finalizadas' },
  ];

  /**
   * @description Estados del formulario de custodia.
   */
  protected readonly formStatusOptions: SelectOption[] = [
    { value: 'activa', label: 'Activa' },
    { value: 'finalizada', label: 'Finalizada' },
  ];

  /**
   * @description Opciones del filtro de reingreso.
   */
  protected readonly reentryOptions: SelectOption[] = [
    { value: 'si', label: 'Con reingreso' },
    { value: 'no', label: 'Sin reingreso' },
  ];

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
  protected readonly form = signal(emptyCustodyForm());

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
   * @function clearForm
   * @description Vacía el formulario de registro y cierra la confirmación.
   */
  protected clearForm(): void {
    if (this.busy()) {
      return;
    }

    this.form.set(emptyCustodyForm());
    this.confirming.set(false);
    this.errorMessage.set(null);
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
    field: 'vehiculo' | 'valor' | 'observaciones' | 'tecnicoNombre' | 'aseguradora' | 'servicioRegistro',
    event: Event,
  ): void {
    this.patch(field, (event.target as HTMLInputElement).value);
  }

  /**
   * @function datePart
   * @description Separa la fecha de un valor fecha-hora.
   * @param value Valor guardado. Puede estar vacío.
   * @returns Fecha yyyy-mm-dd, o cadena vacía.
   */
  protected datePart(value: string): string {
    return value.split('T')[0] ?? '';
  }

  /**
   * @function timePart
   * @description Separa la hora de un valor fecha-hora.
   * @param value Valor guardado. Puede estar vacío.
   * @returns Hora HH:mm, o cadena vacía.
   */
  protected timePart(value: string): string {
    return (value.split('T')[1] ?? '').slice(0, 5);
  }

  /**
   * @function setDateTime
   * @description Vuelve a armar la fecha y la hora de ingreso o salida.
   * @param field Campo fecha-hora del formulario.
   * @param part Parte que acaba de cambiar.
   * @param value Nuevo valor de esa parte.
   */
  protected setDateTime(field: 'ingreso' | 'salida', part: 'date' | 'time', value: string): void {
    const current = this.form()[field];
    const date = part === 'date' ? value : this.datePart(current);
    const time = part === 'time' ? value : this.timePart(current) || '00:00';
    this.patch(field, date ? `${date}T${time || '00:00'}:00` : '');
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

/**
 * @function emptyCustodyForm
 * @description Devuelve el formulario de custodia sin datos.
 * @returns Campos vacíos, con estado activa.
 */
function emptyCustodyForm(): {
  vehiculo: string;
  ingreso: string;
  salida: string;
  valor: string;
  estado: string;
  observaciones: string;
  reingreso: boolean;
  tecnicoNombre: string;
  aseguradora: string;
  servicioRegistro: string;
} {
  return {
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
  };
}
