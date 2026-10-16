import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/auth/auth.service';
import type { ServiceRecord } from '../../../../core/models';
import { OperationCatalogService } from '../../../../core/operations/operation-catalog.service';
import {
  SERVICE_STATUS_LABEL,
  fileServices,
  formatCop,
  formatDateLabel,
  isDemoAdministrativeRole,
  visibleServices,
} from '../../../../core/operations/operation.logic';
import { PageHelpComponent } from '../../../../shared/components/page-help/page-help.component';
import { SelectComponent, type SelectOption } from '../../../../shared/components/select/select.component';

/**
 * @class FilesComponent
 * @description Consulta expedientes finalizados, cancelados y programados.
 */
@Component({
  selector: 'app-files',
  imports: [FormsModule, PageHelpComponent, SelectComponent],
  templateUrl: './files.component.html',
})
export class FilesComponent implements OnInit {
  private readonly auth = inject(AuthService);
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
   * @description Aviso de una edición que no sale del navegador.
   */
  protected readonly infoMessage = signal<string | null>(null);

  /**
   * @description Texto libre de búsqueda.
   */
  protected readonly query = signal('');

  /**
   * @description Filtro de estado del expediente.
   */
  protected readonly status = signal('');

  /**
   * @description Filtro de estado de facturación.
   */
  protected readonly billing = signal('');

  /**
   * @description Estados de expediente filtrables.
   */
  protected readonly statusOptions: SelectOption[] = [
    { value: 'finalizado', label: 'Finalizado' },
    { value: 'cancelado', label: 'Cancelado' },
    { value: 'programado', label: 'Programado' },
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
   * @description Expediente abierto.
   */
  protected readonly selectedId = signal<number | null>(null);

  /**
   * @description Observación editable por el rol administrativo en demo.
   */
  protected readonly note = signal('');

  /**
   * @description Evita guardar dos veces.
   */
  protected readonly busy = signal(false);

  /**
   * @description true cuando no hay endpoint de expedientes.
   */
  protected readonly contractPending = this.catalog.contractPending;

  /**
   * @description true cuando el rol demo puede editar la observación.
   */
  protected readonly administrative = isDemoAdministrativeRole(this.auth.getRolId());

  /**
   * @description Etiquetas de estado.
   */
  protected readonly statusLabel = SERVICE_STATUS_LABEL;

  /**
   * @description Expedientes visibles según rol y filtros.
   */
  protected readonly rows = computed(() => {
    const userId = Number(this.auth.getUserId());
    const visible = fileServices(
      visibleServices(this.catalog.services(), this.auth.getRolId(), Number.isFinite(userId) ? userId : null),
    );
    const text = this.query().trim().toLowerCase();

    return visible.filter((item) => {
      if (this.status() && item.estado !== this.status()) {
        return false;
      }
      if (this.billing() && item.estadoFactura !== this.billing()) {
        return false;
      }
      if (!text) {
        return true;
      }
      return `${item.registro} ${item.autorizacion} ${item.asegurado} ${item.numFactura ?? ''}`
        .toLowerCase()
        .includes(text);
    });
  });

  /**
   * @description Expediente seleccionado.
   */
  protected readonly selected = computed(() => this.rows().find((item) => item.id === this.selectedId()) ?? null);

  /**
   * @function ngOnInit
   * @description Cierra la carga inicial de la vista.
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
   * @function openFile
   * @description Abre el detalle de un expediente.
   * @param item Expediente elegido.
   */
  protected openFile(item: ServiceRecord): void {
    this.selectedId.set(item.id);
    this.note.set(item.observaciones);
    this.infoMessage.set(null);
  }

  /**
   * @function saveNote
   * @description Guarda la observación del expediente en demo si el rol es administrativo.
   */
  protected saveNote(): void {
    if (this.busy() || !this.administrative) {
      return;
    }

    const item = this.selected();
    if (!item) {
      return;
    }

    this.busy.set(true);
    if (this.contractPending || !this.catalog.updateDemoService(item.id, { observaciones: this.note() })) {
      this.infoMessage.set('Contrato pendiente: el expediente no se actualizó en el backend.');
    } else {
      this.infoMessage.set('Observación actualizada en la simulación.');
    }
    this.busy.set(false);
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
  protected dateLabel(value: string | null): string {
    return formatDateLabel(value);
  }

  /**
   * @function onQuery
   * @description Actualiza la búsqueda.
   * @param event Evento del campo.
   */
  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  /**
   * @function onNote
   * @description Actualiza la observación editable.
   * @param event Evento del campo.
   */
  protected onNote(event: Event): void {
    this.note.set((event.target as HTMLTextAreaElement).value);
  }
}
