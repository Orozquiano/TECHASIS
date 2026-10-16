import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OperationCatalogService } from '../../../../core/operations/operation-catalog.service';
import {
  buildReport,
  countByInsurer,
  countInMonth,
  formatCop,
  formatDateLabel,
} from '../../../../core/operations/operation.logic';
import { PageHelpComponent } from '../../../../shared/components/page-help/page-help.component';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';
import { SelectComponent, type SelectOption } from '../../../../shared/components/select/select.component';

/**
 * @class ReportsComponent
 * @description Muestra conteos y sumas de valores ya registrados. No calcula ventas, cartera ni utilidad.
 */
@Component({
  selector: 'app-reports',
  imports: [FormsModule, PageHelpComponent, DateFieldComponent, SelectComponent],
  templateUrl: './reports.component.html',
})
export class ReportsComponent implements OnInit {
  private readonly catalog = inject(OperationCatalogService);

  /**
   * @description Indica la carga inicial.
   */
  protected readonly loading = signal(true);

  /**
   * @description Error visible.
   */
  protected readonly errorMessage = signal<string | null>(null);

  /**
   * @description Filtros de la vista. No se envían a un endpoint.
   */
  protected readonly desde = signal('');
  protected readonly hasta = signal('');
  protected readonly aseguradora = signal('');
  protected readonly tecnicoId = signal('');
  protected readonly estado = signal('');
  protected readonly estadoFactura = signal('');
  protected readonly registro = signal('');
  protected readonly autorizacion = signal('');
  protected readonly factura = signal('');

  /**
   * @description true cuando no hay endpoint de informes.
   */
  protected readonly contractPending = this.catalog.contractPending;

  /**
   * @description Mes local usado para el conteo.
   */
  protected readonly month = localMonth();

  /**
   * @description Día local usado para el conteo.
   */
  protected readonly today = localDate();

  /**
   * @description Aseguradoras presentes en la vista.
   */
  protected readonly insurers = computed(() => unique(this.catalog.services().map((item) => item.aseguradora)));

  /**
   * @description Técnicos presentes en la vista.
   */
  protected readonly technicians = computed(() => {
    const names = new Map<number, string>();
    for (const item of this.catalog.services()) {
      names.set(item.tecnicoId, item.tecnicoNombre);
    }
    return [...names.entries()].map(([id, nombre]) => ({ id, nombre }));
  });

  /**
   * @description Opciones de aseguradora para el selector.
   */
  protected readonly insurerOptions = computed<SelectOption[]>(() =>
    this.insurers().map((item) => ({ value: item, label: item })),
  );

  /**
   * @description Opciones de técnico para el selector.
   */
  protected readonly technicianOptions = computed<SelectOption[]>(() =>
    this.technicians().map((item) => ({ value: String(item.id), label: item.nombre })),
  );

  /**
   * @description Estados operativos filtrables.
   */
  protected readonly statusOptions: SelectOption[] = [
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'programado', label: 'Programado' },
    { value: 'en_proceso', label: 'En proceso' },
    { value: 'finalizado', label: 'Finalizado' },
    { value: 'cancelado', label: 'Cancelado' },
  ];

  /**
   * @description Estados de facturación filtrables.
   */
  protected readonly billingOptions: SelectOption[] = [
    { value: 'NO FACTURADO', label: 'No facturado' },
    { value: 'FACTURADO', label: 'Facturado' },
    { value: 'FACTURADO Y PAGADO', label: 'Facturado y pagado' },
  ];

  /**
   * @description Informe calculado con los filtros actuales.
   */
  protected readonly report = computed(() =>
    buildReport(this.catalog.services(), {
      desde: this.desde() || undefined,
      hasta: this.hasta() || undefined,
      aseguradora: this.aseguradora() || undefined,
      tecnicoId: this.tecnicoId() ? Number(this.tecnicoId()) : null,
      estado: this.estado() || undefined,
      estadoFactura: this.estadoFactura() || undefined,
      registro: this.registro() || undefined,
      autorizacion: this.autorizacion() || undefined,
      factura: this.factura() || undefined,
    }),
  );

  /**
   * @description Conteo del mes sobre los servicios filtrados.
   */
  protected readonly monthCount = computed(() => countInMonth(this.report().servicios, this.month));

  /**
   * @description Conteo del día sobre los servicios filtrados.
   */
  protected readonly dayCount = computed(
    () => this.report().servicios.filter((item) => item.fecha === this.today).length,
  );

  /**
   * @description Cantidad de servicios por aseguradora en el resultado filtrado.
   */
  protected readonly byInsurer = computed(() => countByInsurer(this.report().servicios));

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
   * @function money
   * @description Formatea un valor registrado.
   * @param value Monto.
   * @returns Texto en pesos.
   */
  protected money(value: number): string {
    return formatCop(value);
  }

  /**
   * @function dateLabel
   * @description Formatea una fecha.
   * @param value Fecha de origen.
   * @returns Fecha visible.
   */
  protected dateLabel(value: string): string {
    return formatDateLabel(value);
  }

  /**
   * @function setText
   * @description Escribe un filtro de texto.
   * @param field Campo del filtro.
   * @param event Evento del input.
   */
  protected setText(field: 'registro' | 'autorizacion' | 'factura', event: Event): void {
    this[field].set((event.target as HTMLInputElement).value);
  }
}

/**
 * @function localDate
 * @description Arma la fecha local en formato yyyy-mm-dd.
 * @returns Fecha local.
 */
function localDate(): string {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * @function localMonth
 * @description Arma el mes local en formato yyyy-mm.
 * @returns Mes local.
 */
function localMonth(): string {
  return localDate().slice(0, 7);
}

/**
 * @function unique
 * @description Quita valores repetidos conservando el orden.
 * @param values Textos de origen.
 * @returns Lista sin repetidos.
 */
function unique(values: string[]): string[] {
  return [...new Set(values)];
}
