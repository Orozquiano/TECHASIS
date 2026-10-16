import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type {
  ApiResponse,
  Insurance,
  ServiceStatus,
  Telefono,
  User,
  Vehicle,
} from '../../../../core/models';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { PageHelpComponent } from '../../../../shared/components/page-help/page-help.component';
import { DateFieldComponent } from '../../../../shared/components/date-field/date-field.component';
import { TimeFieldComponent } from '../../../../shared/components/time-field/time-field.component';
import {
  SelectComponent,
  type SelectOption,
} from '../../../../shared/components/select/select.component';
import type { ServiceLifecycle } from '../../../../core/models';
import { OperationCatalogService } from '../../../../core/operations/operation-catalog.service';
import {
  SERVICE_STATUS_LABEL,
  formatDateLabel,
  requiresManualValue,
} from '../../../../core/operations/operation.logic';
import { NewServiceService } from '../../services/new-service.service';

/**
 * @class NewServiceComponent
 * @description Formulario operativo para registrar un nuevo servicio de grúa.
 */
@Component({
  selector: 'app-new-service',
  imports: [
    CardComponent,
    DateFieldComponent,
    PageHelpComponent,
    ReactiveFormsModule,
    SelectComponent,
    TimeFieldComponent,
  ],
  templateUrl: './new-service.component.html',
  styleUrl: './new-service.component.scss',
})
export class NewServiceComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly newServiceService = inject(NewServiceService);
  private readonly catalog = inject(OperationCatalogService);

  /**
   * @description Catálogo de teléfonos disponibles.
   */
  protected readonly telefonosLista = signal<Telefono[]>([]);

  /**
   * @description Técnicos disponibles para asignación.
   */
  protected readonly tecnicosLista = signal<User[]>([]);

  /**
   * @description Grúas disponibles para el servicio.
   */
  protected readonly gruasLista = signal<Vehicle[]>([]);

  /**
   * @description Estados de servicio disponibles.
   */
  protected readonly estadoServicioLista = signal<ServiceStatus[]>([]);

  /**
   * @description Aseguradoras disponibles.
   */
  protected readonly aseguradoraLista = signal<Insurance[]>([]);

  /**
   * @description Mensaje de error de carga o validación.
   */
  protected readonly errorMessage = signal<string | null>(null);

  /**
   * @description Mensaje informativo tras un guardado local.
   */
  protected readonly infoMessage = signal<string | null>(null);

  /**
   * @description Evita enviar el formulario dos veces.
   */
  protected readonly saving = signal(false);

  /**
   * @description true cuando la creación de servicios no tiene endpoint.
   */
  protected readonly contractPending = this.catalog.contractPending;

  /**
   * @description Últimos servicios de la vista, del más reciente al más antiguo.
   */
  protected readonly recientes = computed(() => this.catalog.services().slice(0, 5));

  /**
   * @description Etiquetas de estado para el listado reciente.
   */
  protected readonly statusLabel = SERVICE_STATUS_LABEL;

  /**
   * @description Teléfonos listos para el selector.
   */
  protected readonly telefonoOptions = computed<SelectOption[]>(() =>
    this.telefonosLista().map((tel) => ({ value: tel.descripcion, label: tel.descripcion })),
  );

  /**
   * @description Técnicos listos para el selector.
   */
  protected readonly tecnicoOptions = computed<SelectOption[]>(() => [
    ...this.tecnicosLista().map((tec) => ({
      value: String(tec.id),
      label: `${tec.primerNombre} ${tec.primerApellido}`,
    })),
    { value: 'OTRO', label: 'OTRO' },
  ]);

  /**
   * @description Placas de grúa listas para el selector.
   */
  protected readonly gruaOptions = computed<SelectOption[]>(() => [
    ...this.gruasLista().map((grua) => ({ value: String(grua.id), label: grua.placa })),
    { value: 'OTRO', label: 'OTRO' },
  ]);

  /**
   * @description Estados de servicio listos para el selector.
   */
  protected readonly estadoOptions = computed<SelectOption[]>(() =>
    this.estadoServicioLista().map((estado) => ({
      value: String(estado.id),
      label: estado.descripcion,
    })),
  );

  /**
   * @description Tipos de vehículo del servicio.
   */
  protected readonly tipoVehiculoOptions: SelectOption[] = [
    { value: 'liviano', label: 'Liviano' },
    { value: 'semipesado', label: 'Semipesado' },
  ];

  /**
   * @description Operadoras disponibles cuando la aseguradora es IKE.
   */
  protected readonly operadoraIkeOptions: SelectOption[] = [
    { value: 'HDI', label: 'HDI' },
    { value: 'HDI BRANDEADA', label: 'HDI BRANDEADA' },
    { value: 'PREVISORA', label: 'PREVISORA' },
    { value: 'MUNDIAL', label: 'MUNDIAL' },
    { value: 'IKE CORP', label: 'IKE CORP' },
  ];

  /**
   * @description Estados de facturación del servicio.
   */
  protected readonly estadoFacturaOptions: SelectOption[] = [
    { value: 'NO FACTURADO', label: 'NO FACTURADO' },
    { value: 'FACTURADO', label: 'FACTURADO' },
    { value: 'FACTURADO Y PAGADO', label: 'FACTURADO Y PAGADO' },
  ];

  /**
   * @description Formulario reactivo del nuevo servicio.
   */
  protected readonly serviceForm = this.fb.group({
    tipoServicio: ['', Validators.required],
    registroNum: [{ value: '', disabled: true }],
    nombreAsegurado: ['', Validators.required],
    placaVehiculo: ['', Validators.required],
    telefonoSel: ['', Validators.required],
    telefonoOtro: [''],
    numAutorizacion: ['', Validators.required],
    fechaServicio: ['', Validators.required],
    horaServicio: ['', Validators.required],
    tecnicoSel: ['', Validators.required],
    tecnicoOtro: [''],
    placaGruaSel: ['', Validators.required],
    placaGruaOtro: [''],
    estadoServicioSel: ['', Validators.required],
    origen: ['', Validators.required],
    destino: ['', Validators.required],
    aseguradora: ['', Validators.required],
    aseguradoraOtro: [''],
    operadoraIke: [''],
    ciudadDestino: ['', Validators.required],
    tipoVehiculo: [''],
    kmNormal: [0],
    kmZonaRoja: [0],
    otroConcepto: [''],
    otroValor: [null as number | null],
    tarifaTecnicoSel: [''],
    tarifaTecnicoOtro: [null as number | null],
    observaciones: [''],
    estadoFactura: [''],
    numFactura: [''],
  });

  /**
   * @description Tipos de servicio seleccionables.
   */
  protected readonly tiposServicio = [
    { value: 'GRUA', label: 'Grúa' },
    { value: 'DESPLAZAMIENTO', label: 'Desplazamiento' },
    { value: 'CARRO_TALLER', label: 'Carro taller' },
    { value: 'CONDUCTOR_ELEGIDO', label: 'Conductor elegido' },
    { value: 'MENSAJERIA', label: 'Mensajería' },
    { value: 'HOGAR', label: 'Hogar' },
  ];

  /**
   * @function ngOnInit
   * @description Carga catálogos iniciales y configura validadores condicionales.
   */
  ngOnInit(): void {
    this.cargarDatosIniciales();

    this.serviceForm.get('aseguradora')?.valueChanges.subscribe((valor) => {
      this.handleConditionalValidators(valor ?? '');
    });
    this.bindManualControl('telefonoSel', 'telefonoOtro');
    this.bindManualControl('tecnicoSel', 'tecnicoOtro');
    this.bindManualControl('placaGruaSel', 'placaGruaOtro');
  }

  /**
   * @function cargarDatosIniciales
   * @description Obtiene parámetros administrativos del backend.
   */
  private cargarDatosIniciales(): void {
    this.errorMessage.set(null);

    this.newServiceService.getServiceInitData().subscribe({
      next: (res) => {
        const data = res.data!;

        this.telefonosLista.set(data.telefonos);
        this.tecnicosLista.set(data.usuariosTecnicos);
        this.gruasLista.set(data.gruas);
        this.estadoServicioLista.set(data.estadosServicio);
        this.aseguradoraLista.set(data.aseguradoras);
      },
      error: (err: unknown) => {
        const apiRes = this.resolveApiError(err);

        if (apiRes?.showsMessage && apiRes.message) {
          this.errorMessage.set(apiRes.message);
        } else {
          this.errorMessage.set('No se pudieron cargar los parámetros iniciales del servicio.');
        }
      },
    });
  }

  /**
   * @function resolveApiError
   * @description Normaliza errores HTTP o ApiResponse hacia un contrato común.
   * @param err Error capturado por la suscripción.
   * @returns Respuesta tipada o null cuando no se puede interpretar.
   */
  private resolveApiError(err: unknown): ApiResponse<null> | null {
    if (!err || typeof err !== 'object') {
      return null;
    }

    if ('error' in err) {
      const nested = (err as { error?: unknown }).error;
      return nested && typeof nested === 'object' ? (nested as ApiResponse<null>) : null;
    }

    return err as ApiResponse<null>;
  }

  /**
   * @function setTipoServicio
   * @description Actualiza el tipo de servicio seleccionado.
   * @param tipo Código del tipo de servicio.
   */
  protected setTipoServicio(tipo: string): void {
    this.serviceForm.patchValue({ tipoServicio: tipo });
  }

  /**
   * @function setAseguradora
   * @description Actualiza la aseguradora seleccionada.
   * @param aseg Nombre de la aseguradora.
   */
  protected setAseguradora(aseg: string): void {
    this.serviceForm.patchValue({ aseguradora: aseg });
  }

  /**
   * @function handleConditionalValidators
   * @description Ajusta validadores según la aseguradora elegida.
   * @param aseguradora Nombre de la aseguradora.
   */
  private handleConditionalValidators(aseguradora: string): void {
    const otroCtrl = this.serviceForm.get('aseguradoraOtro');
    const ikeCtrl = this.serviceForm.get('operadoraIke');
    const asegUpper = aseguradora.toUpperCase().trim();

    if (asegUpper === 'OTRO') {
      otroCtrl?.setValidators([Validators.required]);
      ikeCtrl?.clearValidators();
      ikeCtrl?.setValue('');
    } else if (asegUpper === 'IKE') {
      ikeCtrl?.setValidators([Validators.required]);
      otroCtrl?.clearValidators();
      otroCtrl?.setValue('');
    } else {
      otroCtrl?.clearValidators();
      otroCtrl?.setValue('');
      ikeCtrl?.clearValidators();
      ikeCtrl?.setValue('');
    }

    otroCtrl?.updateValueAndValidity();
    ikeCtrl?.updateValueAndValidity();
  }

  /**
   * @function bindManualControl
   * @description Vuelve obligatorio el campo manual cuando la selección es OTRO.
   * @param source Control del catálogo.
   * @param manual Control que el usuario completa a mano.
   */
  private bindManualControl(source: string, manual: string): void {
    this.serviceForm.get(source)?.valueChanges.subscribe((valor) => {
      const control = this.serviceForm.get(manual);
      if (requiresManualValue(valor)) {
        control?.setValidators([Validators.required]);
      } else {
        control?.clearValidators();
        control?.setValue('');
      }
      control?.updateValueAndValidity({ emitEvent: false });
    });
  }

  /**
   * @function guardarServicio
   * @description Valida el formulario y lo guarda en demo, o informa que el contrato de creación no existe.
   */
  protected guardarServicio(): void {
    this.infoMessage.set(null);

    if (this.saving()) {
      return;
    }

    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      this.errorMessage.set('Revisa los campos obligatorios antes de guardar.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    const raw = this.serviceForm.getRawValue();

    if (this.catalog.contractPending) {
      this.infoMessage.set('Contrato pendiente: el servicio no se envió. No existe un endpoint de creación.');
      this.saving.set(false);
      return;
    }

    const tecnico = this.tecnicosLista().find((item) => String(item.id) === raw.tecnicoSel);
    const created = this.catalog.addDemoService({
      fecha: raw.fechaServicio ?? '',
      hora: raw.horaServicio ?? '',
      asegurado: raw.nombreAsegurado ?? '',
      aseguradora:
        raw.aseguradora?.toUpperCase() === 'OTRO' ? (raw.aseguradoraOtro ?? '') : (raw.aseguradora ?? ''),
      tecnicoId: raw.tecnicoSel === 'OTRO' ? 0 : Number(raw.tecnicoSel),
      tecnicoNombre:
        raw.tecnicoSel === 'OTRO'
          ? (raw.tecnicoOtro ?? '')
          : `${tecnico?.primerNombre ?? ''} ${tecnico?.primerApellido ?? ''}`.trim(),
      estado: this.resolveLifecycle(raw.estadoServicioSel ?? ''),
      autorizacion: raw.numAutorizacion ?? '',
      origen: raw.origen ?? '',
      destino: raw.destino ?? '',
      ciudad: raw.ciudadDestino ?? '',
      tipoServicio: raw.tipoServicio ?? '',
      placa: raw.placaVehiculo ?? '',
      telefono: requiresManualValue(raw.telefonoSel) ? (raw.telefonoOtro ?? '') : (raw.telefonoSel ?? ''),
      valorAseguradora: 0,
      valorTecnico: Number(raw.tarifaTecnicoOtro ?? 0) || 0,
      numFactura: raw.numFactura || null,
      estadoFactura: raw.estadoFactura ?? '',
      observaciones: raw.observaciones ?? '',
      evidencias: [],
      fechaCierre: null,
    });

    this.limpiarFormulario();
    this.infoMessage.set(
      created
        ? `Servicio ${created.registro} guardado en la simulación. El endpoint de creación sigue pendiente.`
        : 'No se pudo guardar el servicio en la simulación.',
    );
    this.saving.set(false);
  }

  /**
   * @function resolveLifecycle
   * @description Traduce la descripción del catálogo de estados a la vista operativa.
   * Si la descripción no coincide, el servicio queda pendiente.
   * @param statusId Identificador elegido en el formulario.
   * @returns Estado usado por los listados.
   */
  private resolveLifecycle(statusId: string): ServiceLifecycle {
    const description = (
      this.estadoServicioLista().find((item) => String(item.id) === statusId)?.descripcion ?? ''
    ).toLowerCase();

    if (description.includes('cancel')) {
      return 'cancelado';
    }
    if (description.includes('final')) {
      return 'finalizado';
    }
    if (description.includes('program')) {
      return 'programado';
    }
    if (description.includes('proceso') || description.includes('curso')) {
      return 'en_proceso';
    }
    return 'pendiente';
  }

  /**
   * @function dateLabel
   * @description Presenta la fecha de un servicio reciente.
   * @param value Fecha yyyy-mm-dd.
   * @returns Fecha visible.
   */
  protected dateLabel(value: string): string {
    return formatDateLabel(value);
  }

  /**
   * @function limpiarFormulario
   * @description Restablece el formulario a sus valores iniciales.
   */
  protected limpiarFormulario(): void {
    this.serviceForm.reset({
      tipoServicio: '',
      tipoVehiculo: '',
      kmNormal: 0,
      kmZonaRoja: 0,
      estadoFactura: '',
      aseguradora: '',
      telefonoSel: '',
      tecnicoSel: '',
      placaGruaSel: '',
      estadoServicioSel: '',
    });

    this.errorMessage.set(null);
    this.infoMessage.set(null);
  }
}
