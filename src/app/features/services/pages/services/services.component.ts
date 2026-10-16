import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../../../core/auth/auth.service';
import type { ServiceLifecycle, ServiceRecord } from '../../../../core/models';
import { OperationCatalogService } from '../../../../core/operations/operation-catalog.service';
import {
  SERVICE_STATUS_LABEL,
  activeServices,
  formatCop,
  formatDateLabel,
  isDemoAdministrativeRole,
  visibleServices,
} from '../../../../core/operations/operation.logic';
import { PageHelpComponent } from '../../../../shared/components/page-help/page-help.component';

/**
 * @class ServicesComponent
 * @description Lista servicios pendientes, programados y en proceso según el rol de la sesión.
 */
@Component({
  selector: 'app-services',
  imports: [PageHelpComponent],
  templateUrl: './services.component.html',
})
export class ServicesComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly catalog = inject(OperationCatalogService);

  /**
   * @description Mensajes que la vista puede preparar para el técnico. El envío no tiene endpoint.
   */
  protected readonly predefinedMessages = [
    'El servicio quedó asignado. Confirma la salida.',
    'El cliente actualizó la dirección. Revisa el origen.',
    'La aseguradora pidió evidencia del vehículo antes de continuar.',
  ];

  /**
   * @description Estados que la vista ofrece. El backend aún no confirma las transiciones.
   */
  protected readonly statuses = Object.entries(SERVICE_STATUS_LABEL) as [ServiceLifecycle, string][];

  /**
   * @description Indica la carga inicial de la vista.
   */
  protected readonly loading = signal(true);

  /**
   * @description Error visible de la vista.
   */
  protected readonly errorMessage = signal<string | null>(null);

  /**
   * @description Aviso de una acción que no salió del navegador.
   */
  protected readonly infoMessage = signal<string | null>(null);

  /**
   * @description Texto de búsqueda.
   */
  protected readonly query = signal('');

  /**
   * @description Servicio abierto en el detalle.
   */
  protected readonly selectedId = signal<number | null>(null);

  /**
   * @description Evita aplicar dos veces la misma confirmación.
   */
  protected readonly busy = signal(false);

  /**
   * @description Acción sensible que espera confirmación.
   */
  protected readonly pendingAction = signal<'estado' | 'asignacion' | 'mensaje' | null>(null);

  /**
   * @description Estado elegido antes de confirmar.
   */
  protected readonly nextStatus = signal<ServiceLifecycle | ''>('');

  /**
   * @description Técnico elegido antes de confirmar.
   */
  protected readonly nextTechnician = signal('');

  /**
   * @description Observación escrita en el detalle.
   */
  protected readonly note = signal('');

  /**
   * @description Mensaje predefinido elegido.
   */
  protected readonly message = signal('');

  /**
   * @description true cuando no hay endpoint para consultar o modificar servicios.
   */
  protected readonly contractPending = this.catalog.contractPending;

  /**
   * @description true cuando el rol demo es administrativo.
   */
  protected readonly administrative = isDemoAdministrativeRole(this.auth.getRolId());

  /**
   * @description Etiquetas de estado reutilizadas por la plantilla.
   */
  protected readonly statusLabel = SERVICE_STATUS_LABEL;

  /**
   * @description Servicios operativos visibles para el rol actual.
   */
  protected readonly rows = computed(() => {
    const userId = Number(this.auth.getUserId());
    const visible = visibleServices(
      this.catalog.services(),
      this.auth.getRolId(),
      Number.isFinite(userId) ? userId : null,
    );
    const text = this.query().trim().toLowerCase();

    return activeServices(visible).filter((item) => {
      if (!text) {
        return true;
      }

      return `${item.registro} ${item.asegurado} ${item.aseguradora} ${item.tecnicoNombre}`
        .toLowerCase()
        .includes(text);
    });
  });

  /**
   * @description Servicio seleccionado dentro del listado visible.
   */
  protected readonly selected = computed(
    () => this.rows().find((item) => item.id === this.selectedId()) ?? null,
  );

  /**
   * @description Técnicos presentes en la vista demo para reasignar.
   */
  protected readonly technicians = computed(() => {
    const names = new Map<number, string>();
    for (const item of this.catalog.services()) {
      names.set(item.tecnicoId, item.tecnicoNombre);
    }
    return [...names.entries()].map(([id, nombre]) => ({ id, nombre }));
  });

  /**
   * @function ngOnInit
   * @description Cierra el estado de carga de la vista local.
   */
  ngOnInit(): void {
    this.loading.set(false);
  }

  /**
   * @function retry
   * @description Limpia el error y vuelve a leer la vista local.
   */
  protected retry(): void {
    this.errorMessage.set(null);
    this.loading.set(false);
  }

  /**
   * @function selectService
   * @description Abre el detalle de un servicio.
   * @param item Servicio elegido.
   */
  protected selectService(item: ServiceRecord): void {
    this.selectedId.set(item.id);
    this.note.set(item.observaciones);
    this.nextStatus.set(item.estado);
    this.nextTechnician.set(String(item.tecnicoId));
    this.pendingAction.set(null);
    this.infoMessage.set(null);
  }

  /**
   * @function ask
   * @description Pide confirmación antes de una acción sensible.
   * @param action Acción que el usuario quiere aplicar.
   */
  protected ask(action: 'estado' | 'asignacion' | 'mensaje'): void {
    this.pendingAction.set(action);
  }

  /**
   * @function confirm
   * @description Aplica la acción confirmada en demo o informa que el contrato falta.
   */
  protected confirm(): void {
    if (this.busy()) {
      return;
    }

    const item = this.selected();
    const action = this.pendingAction();
    if (!item || !action) {
      return;
    }

    this.busy.set(true);

    if (this.contractPending) {
      this.infoMessage.set('Contrato pendiente: el cambio no se envió al backend.');
      this.busy.set(false);
      this.pendingAction.set(null);
      return;
    }

    if (action === 'estado') {
      const estado = this.nextStatus();
      if (!estado) {
        this.busy.set(false);
        return;
      }
      this.catalog.updateDemoService(item.id, { estado });
      this.infoMessage.set('Estado actualizado en la simulación. El backend aún no confirma esta transición.');
    }

    if (action === 'asignacion') {
      const tecnicoId = Number(this.nextTechnician());
      const tecnico = this.technicians().find((candidate) => candidate.id === tecnicoId);
      if (!tecnico) {
        this.busy.set(false);
        return;
      }
      this.catalog.updateDemoService(item.id, { tecnicoId, tecnicoNombre: tecnico.nombre });
      this.infoMessage.set('Asignación actualizada en la simulación. No hay endpoint de reasignación.');
    }

    if (action === 'mensaje') {
      this.infoMessage.set('Mensaje preparado en pantalla. No existe un endpoint para enviarlo al técnico.');
    }

    this.pendingAction.set(null);
    this.busy.set(false);
  }

  /**
   * @function saveNote
   * @description Guarda la observación en demo o informa el contrato pendiente.
   */
  protected saveNote(): void {
    if (this.busy()) {
      return;
    }

    const item = this.selected();
    if (!item) {
      return;
    }

    this.busy.set(true);
    if (this.contractPending || !this.catalog.updateDemoService(item.id, { observaciones: this.note() })) {
      this.infoMessage.set('Contrato pendiente: la observación no se envió al backend.');
    } else {
      this.infoMessage.set('Observación guardada en la simulación.');
    }
    this.busy.set(false);
  }

  /**
   * @function addEvidence
   * @description Registra el nombre de una evidencia en demo, sin subir el archivo.
   * @param event Cambio del input de archivo.
   */
  protected addEvidence(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const item = this.selected();
    input.value = '';

    if (!file || !item) {
      return;
    }

    if (this.contractPending || !this.catalog.updateDemoService(item.id, { evidencias: [...item.evidencias, file.name] })) {
      this.infoMessage.set('Contrato pendiente: la evidencia no se cargó al backend.');
      return;
    }

    this.infoMessage.set('Nombre de evidencia guardado en la simulación. El archivo no se envió.');
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
   * @description Formatea una fecha de servicio.
   * @param value Fecha yyyy-mm-dd.
   * @returns Fecha visible.
   */
  protected dateLabel(value: string | null): string {
    return formatDateLabel(value);
  }

  /**
   * @function onQuery
   * @description Actualiza el texto de búsqueda.
   * @param event Evento del campo.
   */
  protected onQuery(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  /**
   * @function onNote
   * @description Actualiza la observación del detalle.
   * @param event Evento del campo.
   */
  protected onNote(event: Event): void {
    this.note.set((event.target as HTMLTextAreaElement).value);
  }

  /**
   * @function onStatus
   * @description Actualiza el estado elegido.
   * @param event Evento del selector.
   */
  protected onStatus(event: Event): void {
    this.nextStatus.set((event.target as HTMLSelectElement).value as ServiceLifecycle);
  }

  /**
   * @function onTechnician
   * @description Actualiza el técnico elegido.
   * @param event Evento del selector.
   */
  protected onTechnician(event: Event): void {
    this.nextTechnician.set((event.target as HTMLSelectElement).value);
  }

  /**
   * @function onMessage
   * @description Actualiza el mensaje predefinido elegido.
   * @param event Evento del selector.
   */
  protected onMessage(event: Event): void {
    this.message.set((event.target as HTMLSelectElement).value);
  }
}
