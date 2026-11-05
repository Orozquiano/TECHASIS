import { Component, computed, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type {
  BaseRate,
  CreateInsuranceDTO,
  CreateMenuDTO,
  CreateUserDTO,
  CreateVehicleTypeDTO,
  Insurance,
  MenuItem,
  SaveBaseRateDTO,
  SaveServiceStatusDTO,
  SaveVehicleDTO,
  ServiceStatus,
  TipoVehiculo,
  UpdateInsuranceDTO,
  UpdateUserDTO,
  UpdateVehicleTypeDTO,
  User,
  UserInitDataParams,
  Vehicle,
  VehicleInitDataParams,
} from '../../../../core/models';
import { messageFromHttpError } from '../../../../core/http/api-error';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PageHelpComponent } from '../../../../shared/components/page-help/page-help.component';
import { Observable } from 'rxjs';
import { BaseRateFormComponent } from '../../components/base-rate-form/base-rate-form.component';
import { InsuranceFormComponent } from '../../components/insurance-form/insurance-form.component';
import { StatusFormComponent } from '../../components/status-form/status-form.component';
import { UserFormComponent } from '../../components/user-form/user-form.component';
import { VehicleFormComponent } from '../../components/vehicle-form/vehicle-form.component';
import { VehicleTypeFormComponent } from '../../components/vehicle-type-form/vehicle-type-form.component';
import { BaseRateService } from '../../services/base-rate.service';
import { InsuranceService } from '../../services/insurance.service';
import { MenuService } from '../../services/menu.service';
import { ServiceStatusService } from '../../services/service-status.service';
import { UserService } from '../../services/user.service';
import { VehicleService } from '../../services/vehicle.service';
import { VehicleTypeService } from '../../services/vehicle-type.service';

/**
 * @class AdministrationComponent
 * @description Pantalla de administración de usuarios, vehículos, tipos, aseguradoras, estados, tarifas y menú.
 */
@Component({
  selector: 'app-administration',
  imports: [
    PageHelpComponent,
    ReactiveFormsModule,
    ModalComponent,
    UserFormComponent,
    VehicleFormComponent,
    VehicleTypeFormComponent,
    StatusFormComponent,
    InsuranceFormComponent,
    BaseRateFormComponent,
  ],
  templateUrl: './administration.component.html',
  styleUrl: './administration.component.scss',
})
export class AdministrationComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly vehicleService = inject(VehicleService);
  private readonly insuranceService = inject(InsuranceService);
  private readonly statusService = inject(ServiceStatusService);
  private readonly vehicleTypeService = inject(VehicleTypeService);
  private readonly baseRateService = inject(BaseRateService);
  private readonly menuService = inject(MenuService);

  protected readonly userSearchCtrl = new FormControl('', { nonNullable: true });
  protected readonly vehicleSearchCtrl = new FormControl('', { nonNullable: true });
  protected readonly insuranceSearchCtrl = new FormControl('', { nonNullable: true });
  protected readonly statusSearchCtrl = new FormControl('', { nonNullable: true });

  protected readonly isUsersOpen = signal(false);
  protected readonly isVehiclesOpen = signal(false);
  protected readonly isInsurancesOpen = signal(false);
  protected readonly isStatusesOpen = signal(false);
  protected readonly isTypesOpen = signal(false);
  protected readonly isRatesOpen = signal(false);
  protected readonly isMenusOpen = signal(false);
  protected readonly isModalLoading = signal(false);
  protected readonly saving = signal(false);
  protected readonly actionError = signal<string | null>(null);

  protected readonly users = signal<User[]>([]);
  protected readonly vehicles = signal<Vehicle[]>([]);
  protected readonly insurances = signal<Insurance[]>([]);
  protected readonly statuses = signal<ServiceStatus[]>([]);
  protected readonly vehicleTypes = signal<TipoVehiculo[]>([]);
  protected readonly rateInsurers = signal<Insurance[]>([]);
  protected readonly createdRates = signal<BaseRate[]>([]);
  protected readonly menus = signal<MenuItem[]>([]);
  protected readonly selectedType = signal<TipoVehiculo | null>(null);
  protected readonly isTypeModalOpen = signal(false);
  protected readonly isRateModalOpen = signal(false);
  protected readonly editingRateId = signal<number | null>(null);

  protected readonly userParams = signal<UserInitDataParams>({
    tiposDocumento: [],
    roles: [],
  });

  protected readonly vehicleParams = signal<VehicleInitDataParams>({
    tiposVehiculo: [],
  });

  protected readonly isUserModalOpen = signal(false);
  protected readonly selectedUser = signal<User | null>(null);
  protected readonly isVehicleModalOpen = signal(false);
  protected readonly selectedVehicle = signal<Vehicle | null>(null);
  protected readonly isInsuranceModalOpen = signal(false);
  protected readonly selectedInsurance = signal<Insurance | null>(null);
  protected readonly isStatusModalOpen = signal(false);
  protected readonly selectedStatus = signal<ServiceStatus | null>(null);

  protected readonly userSearch = signal('');
  protected readonly vehicleSearch = signal('');
  protected readonly insuranceSearch = signal('');
  protected readonly statusSearch = signal('');

  protected readonly filteredUsers = computed(() => {
    const query = this.userSearch().toLowerCase();
    return this.users().filter(
      (user) =>
        user.primerNombre.toLowerCase().includes(query) || user.documento.includes(query),
    );
  });

  protected readonly filteredVehicles = computed(() => {
    const query = this.vehicleSearch().toLowerCase();
    return this.vehicles().filter(
      (vehicle) =>
        vehicle.placa.toLowerCase().includes(query) || vehicle.codigo.includes(query),
    );
  });

  protected readonly filteredInsurances = computed(() => {
    const query = this.insuranceSearch().toLowerCase();
    return this.insurances().filter(
      (insurance) =>
        insurance.nombre.toLowerCase().includes(query) || insurance.codigo.includes(query),
    );
  });

  protected readonly filteredStatuses = computed(() => {
    const query = this.statusSearch().toLowerCase();
    return this.statuses().filter(
      (status) =>
        status.descripcion.toLowerCase().includes(query) || status.codigo.includes(query),
    );
  });

  /**
   * @function ngOnInit
   * @description Abre la sección de usuarios y suscribe los filtros de búsqueda.
   */
  ngOnInit(): void {
    this.userSearchCtrl.valueChanges.subscribe((value) => this.userSearch.set(value));
    this.vehicleSearchCtrl.valueChanges.subscribe((value) => this.vehicleSearch.set(value));
    this.insuranceSearchCtrl.valueChanges.subscribe((value) => this.insuranceSearch.set(value));
    this.statusSearchCtrl.valueChanges.subscribe((value) => this.statusSearch.set(value));
    this.toggleSection('users');
  }

  /**
   * @function loadUsers
   * @description Recarga el listado de usuarios.
   * @param done Aviso opcional cuando el listado ya quedó en memoria.
   */
  loadUsers(done?: () => void): void {
    this.userService.getUsers().subscribe({
      next: (res) => {
        this.users.set(res.data ?? []);
        done?.();
      },
      error: (err: unknown) => {
        this.fail(err, 'No se pudo cargar el listado de usuarios.');
        done?.();
      },
    });
  }

  /**
   * @function loadVehicles
   * @description Recarga el listado de vehículos.
   * @param done Aviso opcional cuando el listado ya quedó en memoria.
   */
  loadVehicles(done?: () => void): void {
    this.vehicleService.getVehicles().subscribe({
      next: (res) => {
        this.vehicles.set(res.data ?? []);
        done?.();
      },
      error: (err: unknown) => {
        this.fail(err, 'No se pudo cargar el listado de vehículos.');
        done?.();
      },
    });
  }

  /**
   * @function loadInsurances
   * @description Recarga el listado de aseguradoras.
   * @param done Aviso opcional cuando el listado ya quedó en memoria.
   */
  loadInsurances(done?: () => void): void {
    this.insuranceService.getInsurances().subscribe({
      next: (res) => {
        this.insurances.set(res.data ?? []);
        done?.();
      },
      error: (err: unknown) => {
        this.fail(err, 'No se pudo cargar el listado de aseguradoras.');
        done?.();
      },
    });
  }

  /**
   * @function loadStatuses
   * @description Recarga el listado de estados de servicio.
   * @param done Aviso opcional cuando el listado ya quedó en memoria.
   */
  loadStatuses(done?: () => void): void {
    this.statusService.getServiceStatuses().subscribe({
      next: (res) => {
        this.statuses.set(res.data ?? []);
        done?.();
      },
      error: (err: unknown) => {
        this.fail(err, 'No se pudo cargar el listado de estados.');
        done?.();
      },
    });
  }

  /**
   * @function fail
   * @description Publica el error de una operación sin cerrar el modal.
   * @param err Error capturado.
   * @param fallback Texto contextual.
   */
  private fail(err: unknown, fallback: string): void {
    this.saving.set(false);
    this.isModalLoading.set(false);
    this.actionError.set(messageFromHttpError(err, fallback));
  }

  /**
   * @function write
   * @description Ejecuta una escritura evitando envíos duplicados.
   * @param request Petición HTTP.
   * @param onSuccess Acción tras una respuesta exitosa.
   * @param fallback Texto si el backend no muestra su mensaje.
   */
  private write(request: Observable<unknown>, onSuccess: () => void, fallback: string): void {
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    this.actionError.set(null);
    request.subscribe({
      next: () => {
        this.saving.set(false);
        onSuccess();
      },
      error: (err: unknown) => this.fail(err, fallback),
    });
  }

  /**
   * @function toggleSection
   * @description Alterna una sección acordeón y carga datos la primera vez.
   * @param section Sección a abrir o cerrar.
   */
  toggleSection(section: 'users' | 'vehicles' | 'insurances' | 'statuses' | 'types' | 'rates' | 'menus'): void {
    if (section === 'users') {
      this.toggleLoadedSection(this.isUsersOpen, this.users().length > 0, (done) => this.loadUsers(done));
    }

    if (section === 'vehicles') {
      this.toggleLoadedSection(this.isVehiclesOpen, this.vehicles().length > 0, (done) =>
        this.loadVehicles(done),
      );
    }

    if (section === 'insurances') {
      this.toggleLoadedSection(this.isInsurancesOpen, this.insurances().length > 0, (done) =>
        this.loadInsurances(done),
      );
    }

    if (section === 'statuses') {
      this.toggleLoadedSection(this.isStatusesOpen, this.statuses().length > 0, (done) =>
        this.loadStatuses(done),
      );
    }

    if (section === 'types') {
      this.toggleLoadedSection(this.isTypesOpen, this.vehicleTypes().length > 0, (done) =>
        this.loadVehicleTypes(done),
      );
    }

    if (section === 'rates') {
      this.toggleLoadedSection(this.isRatesOpen, this.rateInsurers().length > 0, (done) =>
        this.loadRateParams(done),
      );
    }

    if (section === 'menus') {
      this.toggleLoadedSection(this.isMenusOpen, this.menus().length > 0, (done) => this.loadMenus(done));
    }
  }

  /**
   * @function toggleLoadedSection
   * @description Cierra la sección o la abre cuando sus datos ya están listos para animarse.
   * @param open Estado de apertura de la sección.
   * @param hasData Indica si el listado ya fue cargado.
   * @param load Carga el listado y avisa cuando terminó.
   */
  private toggleLoadedSection(
    open: WritableSignal<boolean>,
    hasData: boolean,
    load: (done: () => void) => void,
  ): void {
    if (open()) {
      open.set(false);
      return;
    }

    if (!hasData) {
      load(() => open.set(true));
      return;
    }

    open.set(true);
  }

  /**
   * @function loadUserParams
   * @description Carga tipos de documento y roles para el formulario.
   */
  loadUserParams(): void {
    this.userService.getInitData().subscribe((res) => {
      if (res.success && res.data) {
        this.userParams.set(res.data);
      }
    });
  }

  /**
   * @function loadVehicleParams
   * @description Carga tipos de vehículo para el formulario.
   */
  loadVehicleParams(): void {
    this.vehicleService.getInitData().subscribe((res) => {
      if (res.success && res.data) {
        this.vehicleParams.set(res.data);
      }
    });
  }

  /**
   * @function openUserModal
   * @description Abre el modal de usuario en modo creación o edición.
   * @param userId Identificador del usuario. Opcional.
   */
  openUserModal(userId?: number): void {
    if (this.userParams().tiposDocumento.length === 0) {
      this.loadUserParams();
    }

    this.isUserModalOpen.set(true);

    if (userId) {
      this.isModalLoading.set(true);
      this.userService.getUserById(userId).subscribe({
        next: (res) => {
          this.selectedUser.set(res.data);
          this.isModalLoading.set(false);
        },
        error: () => {
          this.isModalLoading.set(false);
          this.closeUserModal();
        },
      });
    } else {
      this.selectedUser.set(null);
      this.isModalLoading.set(false);
    }
  }

  /**
   * @function closeUserModal
   * @description Cierra el modal de usuario.
   */
  closeUserModal(): void {
    this.isUserModalOpen.set(false);
    this.selectedUser.set(null);
  }

  /**
   * @function openVehicleModal
   * @description Abre el modal de vehículo en modo creación o edición.
   * @param vehicleId Identificador del vehículo. Opcional.
   */
  openVehicleModal(vehicleId?: number): void {
    if (this.vehicleParams().tiposVehiculo.length === 0) {
      this.loadVehicleParams();
    }

    this.isVehicleModalOpen.set(true);

    if (vehicleId) {
      this.isModalLoading.set(true);
      this.vehicleService.getVehicleById(vehicleId).subscribe({
        next: (res) => {
          this.selectedVehicle.set(res.data);
          this.isModalLoading.set(false);
        },
        error: () => {
          this.isModalLoading.set(false);
          this.closeVehicleModal();
        },
      });
    } else {
      this.selectedVehicle.set(null);
      this.isModalLoading.set(false);
    }
  }

  /**
   * @function closeVehicleModal
   * @description Cierra el modal de vehículo.
   */
  closeVehicleModal(): void {
    this.isVehicleModalOpen.set(false);
    this.selectedVehicle.set(null);
  }

  /**
   * @function openInsuranceModal
   * @description Abre el modal de aseguradora en modo creación o edición.
   * @param insuranceId Identificador de la aseguradora. Opcional.
   */
  openInsuranceModal(insuranceId?: number): void {
    this.isInsuranceModalOpen.set(true);

    if (insuranceId) {
      this.isModalLoading.set(true);
      this.insuranceService.getInsuranceById(insuranceId).subscribe({
        next: (res) => {
          this.selectedInsurance.set(res.data);
          this.isModalLoading.set(false);
        },
        error: () => {
          this.isModalLoading.set(false);
          this.closeInsuranceModal();
        },
      });
    } else {
      this.selectedInsurance.set(null);
      this.isModalLoading.set(false);
    }
  }

  /**
   * @function closeInsuranceModal
   * @description Cierra el modal de aseguradora.
   */
  closeInsuranceModal(): void {
    this.isInsuranceModalOpen.set(false);
    this.selectedInsurance.set(null);
  }

  /**
   * @function openStatusModal
   * @description Abre el modal de estado en modo creación o edición.
   * @param statusId Identificador del estado. Opcional.
   */
  openStatusModal(statusId?: number): void {
    this.isStatusModalOpen.set(true);

    if (statusId) {
      this.isModalLoading.set(true);
      this.statusService.getServiceStatusById(statusId).subscribe({
        next: (res) => {
          this.selectedStatus.set(res.data);
          this.isModalLoading.set(false);
        },
        error: () => {
          this.isModalLoading.set(false);
          this.closeStatusModal();
        },
      });
    } else {
      this.selectedStatus.set(null);
      this.isModalLoading.set(false);
    }
  }

  /**
   * @function closeStatusModal
   * @description Cierra el modal de estado.
   */
  closeStatusModal(): void {
    this.isStatusModalOpen.set(false);
    this.selectedStatus.set(null);
  }

  /**
   * @function saveUser
   * @description Crea o actualiza un usuario según el modo del modal.
   * @param dto Datos del formulario de usuario.
   */
  saveUser(dto: CreateUserDTO | UpdateUserDTO): void {
    const currentUser = this.selectedUser();

    if (currentUser) {
      this.write(
        this.userService.updateUser(currentUser.id, dto),
        () => {
          this.loadUsers();
          this.closeUserModal();
        },
        'No se pudo actualizar el usuario.',
      );
      return;
    }

    if (!('clave' in dto) || !dto.clave) {
      this.actionError.set('La clave es obligatoria para crear el usuario.');
      return;
    }

    this.write(
      this.userService.createUser({ ...dto, clave: dto.clave }),
      () => {
        this.loadUsers();
        this.closeUserModal();
      },
      'No se pudo crear el usuario.',
    );
  }

  /**
   * @function saveVehicle
   * @description Crea o actualiza un vehículo según el modo del modal.
   * @param dto Datos del formulario de vehículo.
   */
  saveVehicle(dto: SaveVehicleDTO): void {
    const currentVehicle = this.selectedVehicle();
    const request = currentVehicle
      ? this.vehicleService.updateVehicle(currentVehicle.id, dto)
      : this.vehicleService.createVehicle(dto);

    this.write(
      request,
      () => {
        this.loadVehicles();
        this.closeVehicleModal();
      },
      'No se pudo guardar el vehículo.',
    );
  }

  /**
   * @function saveInsurance
   * @description Crea o actualiza una aseguradora según el modo del modal.
   * @param dto Datos del formulario de aseguradora.
   */
  saveInsurance(dto: CreateInsuranceDTO | UpdateInsuranceDTO): void {
    const currentInsurance = this.selectedInsurance();

    if (currentInsurance && 'activo' in dto) {
      this.write(
        this.insuranceService.updateInsurance(currentInsurance.id, dto),
        () => {
          this.loadInsurances();
          this.closeInsuranceModal();
        },
        'No se pudo actualizar la aseguradora.',
      );
      return;
    }

    if (!('activo' in dto)) {
      this.write(
        this.insuranceService.createInsurance(dto),
        () => {
          this.loadInsurances();
          this.closeInsuranceModal();
        },
        'No se pudo crear la aseguradora.',
      );
    }
  }

  /**
   * @function saveStatus
   * @description Crea o actualiza un estado de servicio según el modo del modal.
   * @param dto Datos del formulario de estado.
   */
  saveStatus(dto: SaveServiceStatusDTO): void {
    const currentStatus = this.selectedStatus();
    const request = currentStatus
      ? this.statusService.updateServiceStatus(currentStatus.id, dto)
      : this.statusService.createServiceStatus(dto);

    this.write(
      request,
      () => {
        this.loadStatuses();
        this.closeStatusModal();
      },
      'No se pudo guardar el estado.',
    );
  }

  /**
   * @function deleteUser
   * @description Elimina un usuario tras confirmación.
   * @param id Identificador del usuario.
   */
  deleteUser(id: number): void {
    if (confirm('¿Desea eliminar este usuario?')) {
      this.write(this.userService.deleteUser(id), () => this.loadUsers(), 'No se pudo eliminar el usuario.');
    }
  }

  /**
   * @function deleteVehicle
   * @description Elimina un vehículo tras confirmación.
   * @param id Identificador del vehículo.
   */
  deleteVehicle(id: number): void {
    if (confirm('¿Desea eliminar este vehículo?')) {
      this.write(
        this.vehicleService.deleteVehicle(id),
        () => this.loadVehicles(),
        'No se pudo eliminar el vehículo.',
      );
    }
  }

  /**
   * @function deleteInsurance
   * @description Elimina una aseguradora tras confirmación.
   * @param id Identificador de la aseguradora.
   */
  deleteInsurance(id: number): void {
    if (confirm('¿Desea eliminar esta aseguradora?')) {
      this.write(
        this.insuranceService.deleteInsurance(id),
        () => this.loadInsurances(),
        'No se pudo eliminar la aseguradora.',
      );
    }
  }

  /**
   * @function deleteStatus
   * @description Elimina un estado de servicio tras confirmación.
   * @param id Identificador del estado.
   */
  deleteStatus(id: number): void {
    if (confirm('¿Desea eliminar este estado?')) {
      this.write(
        this.statusService.deleteServiceStatus(id),
        () => this.loadStatuses(),
        'No se pudo eliminar el estado.',
      );
    }
  }

  /**
   * @function loadVehicleTypes
   * @description Recarga los tipos de vehículo.
   * @param done Aviso al terminar.
   */
  loadVehicleTypes(done?: () => void): void {
    this.vehicleTypeService.getVehicleTypes().subscribe({
      next: (res) => {
        this.vehicleTypes.set(res.data ?? []);
        done?.();
      },
      error: (err: unknown) => {
        this.fail(err, 'No se pudo cargar los tipos de vehículo.');
        done?.();
      },
    });
  }

  /**
   * @function loadRateParams
   * @description Carga las aseguradoras de la tarifa base. El listado remoto sigue pendiente.
   * @param done Aviso al terminar.
   */
  loadRateParams(done?: () => void): void {
    this.baseRateService.getParams().subscribe({
      next: (res) => {
        this.rateInsurers.set(res.data?.aseguradoras ?? []);
        done?.();
      },
      error: (err: unknown) => {
        this.fail(err, 'No se pudieron cargar los parámetros de tarifas.');
        done?.();
      },
    });
  }

  /**
   * @function loadMenus
   * @description Recarga el menú documentado.
   * @param done Aviso al terminar.
   */
  loadMenus(done?: () => void): void {
    this.menuService.getMenus().subscribe({
      next: (res) => {
        this.menus.set(res.data ?? []);
        done?.();
      },
      error: (err: unknown) => {
        this.fail(err, 'No se pudo cargar el menú.');
        done?.();
      },
    });
  }

  /**
   * @function openTypeModal
   * @description Abre el formulario de tipo de vehículo.
   * @param id Identificador a editar. Opcional.
   */
  openTypeModal(id?: number): void {
    this.isTypeModalOpen.set(true);
    this.selectedType.set(this.vehicleTypes().find((item) => item.id === id) ?? null);
  }

  /**
   * @function closeTypeModal
   * @description Cierra el formulario de tipo de vehículo.
   */
  closeTypeModal(): void {
    this.isTypeModalOpen.set(false);
    this.selectedType.set(null);
  }

  /**
   * @function saveVehicleType
   * @description Crea o actualiza un tipo de vehículo.
   * @param dto Datos del formulario.
   */
  saveVehicleType(dto: CreateVehicleTypeDTO | UpdateVehicleTypeDTO): void {
    const current = this.selectedType();
    if (current && 'activo' in dto) {
      this.write(
        this.vehicleTypeService.updateVehicleType(current.id, dto),
        () => {
          this.loadVehicleTypes();
          this.closeTypeModal();
        },
        'No se pudo actualizar el tipo de vehículo.',
      );
      return;
    }

    if (!('activo' in dto)) {
      this.write(
        this.vehicleTypeService.createVehicleType(dto),
        () => {
          this.loadVehicleTypes();
          this.closeTypeModal();
        },
        'No se pudo crear el tipo de vehículo.',
      );
    }
  }

  /**
   * @function deleteVehicleType
   * @description Elimina un tipo de vehículo tras confirmación.
   * @param id Identificador del tipo.
   */
  deleteVehicleType(id: number): void {
    if (confirm('¿Desea eliminar este tipo de vehículo?')) {
      this.write(
        this.vehicleTypeService.deleteVehicleType(id),
        () => this.loadVehicleTypes(),
        'No se pudo eliminar el tipo de vehículo.',
      );
    }
  }

  /**
   * @function openRateModal
   * @description Abre el formulario de tarifa. La edición usa un id ya creado en esta sesión.
   * @param id Identificador a actualizar. Opcional.
   */
  openRateModal(id?: number): void {
    this.editingRateId.set(id ?? null);
    this.isRateModalOpen.set(true);
  }

  /**
   * @function closeRateModal
   * @description Cierra el formulario de tarifa.
   */
  closeRateModal(): void {
    this.isRateModalOpen.set(false);
    this.editingRateId.set(null);
  }

  /**
   * @function saveBaseRate
   * @description Crea o actualiza una tarifa con las rutas confirmadas.
   * @param dto Cuerpo documentado.
   */
  saveBaseRate(dto: SaveBaseRateDTO): void {
    if (this.saving()) {
      return;
    }

    this.saving.set(true);
    this.actionError.set(null);
    const id = this.editingRateId();
    const request = id
      ? this.baseRateService.updateBaseRate(id, dto)
      : this.baseRateService.createBaseRate(dto);

    request.subscribe({
      next: (res) => {
        this.saving.set(false);
        if (res.data) {
          const saved = res.data;
          this.createdRates.update((items) => [saved, ...items.filter((item) => item.id !== saved.id)]);
        }
        this.closeRateModal();
      },
      error: (err: unknown) => this.fail(err, 'No se pudo guardar la tarifa base.'),
    });
  }

  /**
   * @function createMenu
   * @description Crea un ítem de menú con el cuerpo documentado.
   * @param dto Datos del menú.
   */
  createMenu(dto: CreateMenuDTO): void {
    this.write(
      this.menuService.createMenu(dto),
      () => this.loadMenus(),
      'No se pudo crear el ítem de menú.',
    );
  }
}
