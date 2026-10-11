import { Component, inject, OnInit, signal } from '@angular/core';
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
import { NewServiceService } from '../../services/new-service.service';

/**
 * @class NewServiceComponent
 * @description Formulario operativo para registrar un nuevo servicio de grúa.
 */
@Component({
  selector: 'app-new-service',
  imports: [CardComponent, ReactiveFormsModule],
  templateUrl: './new-service.component.html',
  styleUrl: './new-service.component.scss',
})
export class NewServiceComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly newServiceService = inject(NewServiceService);

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
   * @description Formulario reactivo del nuevo servicio.
   */
  protected readonly serviceForm = this.fb.group({
    tipoServicio: ['GRUA', Validators.required],
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
    tipoVehiculo: ['liviano'],
    kmNormal: [0],
    kmZonaRoja: [0],
    otroConcepto: [''],
    otroValor: [null as number | null],
    tarifaTecnicoSel: [''],
    tarifaTecnicoOtro: [null as number | null],
    observaciones: [''],
    estadoFactura: ['NO FACTURADO'],
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
        const aseguradoras = data.aseguradoras;

        if (aseguradoras.length > 0) {
          this.serviceForm.patchValue({ aseguradora: aseguradoras[0].nombre });
        }

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
   * @function guardarServicio
   * @description Valida el formulario. El contrato POST permanece pendiente del backend.
   */
  protected guardarServicio(): void {
    this.infoMessage.set(null);

    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      this.errorMessage.set('Revisa los campos obligatorios antes de guardar.');
      return;
    }

    this.errorMessage.set(null);
    this.infoMessage.set(
      'Formulario listo. El endpoint de guardado se conectará cuando el backend lo exponga.',
    );
    console.info('Datos a enviar:', this.serviceForm.getRawValue());
  }

  /**
   * @function limpiarFormulario
   * @description Restablece el formulario a sus valores iniciales.
   */
  protected limpiarFormulario(): void {
    const primera = this.aseguradoraLista()[0]?.nombre ?? '';

    this.serviceForm.reset({
      tipoServicio: 'GRUA',
      tipoVehiculo: 'liviano',
      kmNormal: 0,
      kmZonaRoja: 0,
      estadoFactura: 'NO FACTURADO',
      aseguradora: primera,
      telefonoSel: '',
      tecnicoSel: '',
      placaGruaSel: '',
      estadoServicioSel: '',
    });

    this.errorMessage.set(null);
    this.infoMessage.set(null);
  }
}
