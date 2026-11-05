import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type {
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
import { APP_ENVIRONMENT } from '../../../../core/config/app-environment';
import { messageFromHttpError } from '../../../../core/http/api-error';
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
   * @description El listado reciente no tiene endpoint. En demo se muestran datos locales.
   */
  protected readonly contractPending = !inject(APP_ENVIRONMENT).useMockApi;

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
  protected readonly catalogsReady = signal(false);

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
  protected cargarDatosIniciales(): void {
    this.errorMessage.set(null);

    this.newServiceService.getServiceInitData().subscribe({
      next: (res) => {
        const data = res.data;
        if (
          !data ||
          data.telefonos.length === 0 ||
          data.usuariosTecnicos.length === 0 ||
          data.gruas.length === 0 ||
          data.estadosServicio.length === 0 ||
          data.aseguradoras.length === 0
        ) {
          this.catalogsReady.set(false);
          this.errorMessage.set('Faltan parámetros indispensables para registrar el servicio.');
          return;
        }

        this.telefonosLista.set(data.telefonos);
        this.tecnicosLista.set(data.usuariosTecnicos);
        this.gruasLista.set(data.gruas);
        this.estadoServicioLista.set(data.estadosServicio);
        this.aseguradoraLista.set(data.aseguradoras);
        this.catalogsReady.set(true);
      },
      error: (err: unknown) => {
        this.catalogsReady.set(false);
        this.errorMessage.set(
          messageFromHttpError(err, 'No se pudieron cargar los parámetros iniciales del servicio.'),
        );
      },
    });
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

    if (this.saving() || !this.catalogsReady()) {
      return;
    }

    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      this.errorMessage.set('Revisa los campos obligatorios antes de guardar.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);
    this.newServiceService.saveService().subscribe({
      error: (err: unknown) => {
        this.errorMessage.set(
          messageFromHttpError(
            err,
            'Contrato pendiente: no existe un endpoint para crear el servicio.',
          ),
        );
        this.saving.set(false);
      },
    });
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
