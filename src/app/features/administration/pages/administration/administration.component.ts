import { Component, computed, inject, OnInit, signal, WritableSignal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type {
  CreateUserDTO,
  Insurance,
  SaveInsuranceDTO,
  SaveServiceStatusDTO,
  SaveUserDTO,
  SaveVehicleDTO,
  ServiceStatus,
  User,
  UserInitDataParams,
  Vehicle,
  VehicleInitDataParams,
} from '../../../../core/models';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { StaggerEnterDirective } from '../../../../shared/directives/stagger-enter.directive';
import { InsuranceFormComponent } from '../../components/insurance-form/insurance-form.component';
import { StatusFormComponent } from '../../components/status-form/status-form.component';
import { UserFormComponent } from '../../components/user-form/user-form.component';
import { VehicleFormComponent } from '../../components/vehicle-form/vehicle-form.component';
import { InsuranceService } from '../../services/insurance.service';
import { ServiceStatusService } from '../../services/service-status.service';
import { UserService } from '../../services/user.service';
import { VehicleService } from '../../services/vehicle.service';

/**
 * @class AdministrationComponent
 * @description Pantalla de administración CRUD de usuarios, vehículos, aseguradoras y estados.
 */
@Component({
  selector: 'app-administration',
  imports: [
    ReactiveFormsModule,
    ModalComponent,
    UserFormComponent,
    VehicleFormComponent,
    StatusFormComponent,
    InsuranceFormComponent,
    StaggerEnterDirective,
  ],
  templateUrl: './administration.component.html',
  styleUrl: './administration.component.scss',
})
export class AdministrationComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly vehicleService = inject(VehicleService);
  private readonly insuranceService = inject(InsuranceService);
  private readonly statusService = inject(ServiceStatusService);

  protected readonly userSearchCtrl = new FormControl('', { nonNullable: true });
  protected readonly vehicleSearchCtrl = new FormControl('', { nonNullable: true });
  protected readonly insuranceSearchCtrl = new FormControl('', { nonNullable: true });
  protected readonly statusSearchCtrl = new FormControl('', { nonNullable: true });

  protected readonly isUsersOpen = signal(false);
  protected readonly isVehiclesOpen = signal(false);
  protected readonly isInsurancesOpen = signal(false);
  protected readonly isStatusesOpen = signal(false);
  protected readonly isModalLoading = signal(false);

  protected readonly users = signal<User[]>([]);
  protected readonly vehicles = signal<Vehicle[]>([]);
  protected readonly insurances = signal<Insurance[]>([]);
  protected readonly statuses = signal<ServiceStatus[]>([]);

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
    this.userService.getUsers().subscribe((res) => {
      this.users.set(res.data || []);
      done?.();
    });
  }

  /**
   * @function loadVehicles
   * @description Recarga el listado de vehículos.
   * @param done Aviso opcional cuando el listado ya quedó en memoria.
   */
  loadVehicles(done?: () => void): void {
    this.vehicleService.getVehicles().subscribe((res) => {
      this.vehicles.set(res.data || []);
      done?.();
    });
  }

  /**
   * @function loadInsurances
   * @description Recarga el listado de aseguradoras.
   * @param done Aviso opcional cuando el listado ya quedó en memoria.
   */
  loadInsurances(done?: () => void): void {
    this.insuranceService.getInsurances().subscribe((res) => {
      this.insurances.set(res.data || []);
      done?.();
    });
  }

  /**
   * @function loadStatuses
   * @description Recarga el listado de estados de servicio.
   * @param done Aviso opcional cuando el listado ya quedó en memoria.
   */
  loadStatuses(done?: () => void): void {
    this.statusService.getServiceStatuses().subscribe((res) => {
      this.statuses.set(res.data || []);
      done?.();
    });
  }

  /**
   * @function toggleSection
   * @description Alterna una sección acordeón y carga datos la primera vez.
   * @param section Sección a abrir o cerrar.
   */
  toggleSection(section: 'users' | 'vehicles' | 'insurances' | 'statuses'): void {
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
  saveUser(dto: SaveUserDTO): void {
    const currentUser = this.selectedUser();

    if (currentUser) {
      this.userService.updateUser(currentUser.id, dto).subscribe(() => {
        this.loadUsers();
        this.closeUserModal();
      });
    } else {
      this.userService.createUser(dto as CreateUserDTO).subscribe(() => {
        this.loadUsers();
        this.closeUserModal();
      });
    }
  }

  /**
   * @function saveVehicle
   * @description Crea o actualiza un vehículo según el modo del modal.
   * @param dto Datos del formulario de vehículo.
   */
  saveVehicle(dto: SaveVehicleDTO): void {
    const currentVehicle = this.selectedVehicle();

    if (currentVehicle) {
      this.vehicleService.updateVehicle(currentVehicle.id, dto).subscribe(() => {
        this.loadVehicles();
        this.closeVehicleModal();
      });
    } else {
      this.vehicleService.createVehicle(dto).subscribe(() => {
        this.loadVehicles();
        this.closeVehicleModal();
      });
    }
  }

  /**
   * @function saveInsurance
   * @description Crea o actualiza una aseguradora según el modo del modal.
   * @param dto Datos del formulario de aseguradora.
   */
  saveInsurance(dto: SaveInsuranceDTO): void {
    const currentInsurance = this.selectedInsurance();

    if (currentInsurance) {
      this.insuranceService.updateInsurance(currentInsurance.id, dto).subscribe(() => {
        this.loadInsurances();
        this.closeInsuranceModal();
      });
    } else {
      this.insuranceService.createInsurance(dto).subscribe(() => {
        this.loadInsurances();
        this.closeInsuranceModal();
      });
    }
  }

  /**
   * @function saveStatus
   * @description Crea o actualiza un estado de servicio según el modo del modal.
   * @param dto Datos del formulario de estado.
   */
  saveStatus(dto: SaveServiceStatusDTO): void {
    const currentStatus = this.selectedStatus();

    if (currentStatus) {
      this.statusService.updateServiceStatus(currentStatus.id, dto).subscribe(() => {
        this.loadStatuses();
        this.closeStatusModal();
      });
    } else {
      this.statusService.createServiceStatus(dto).subscribe(() => {
        this.loadStatuses();
        this.closeStatusModal();
      });
    }
  }

  /**
   * @function deleteUser
   * @description Elimina un usuario tras confirmación.
   * @param id Identificador del usuario.
   */
  deleteUser(id: number): void {
    if (confirm('¿Desea eliminar este usuario?')) {
      this.userService.deleteUser(id).subscribe(() => this.loadUsers());
    }
  }

  /**
   * @function deleteVehicle
   * @description Elimina un vehículo tras confirmación.
   * @param id Identificador del vehículo.
   */
  deleteVehicle(id: number): void {
    if (confirm('¿Desea eliminar este vehículo?')) {
      this.vehicleService.deleteVehicle(id).subscribe(() => this.loadVehicles());
    }
  }

  /**
   * @function deleteInsurance
   * @description Elimina una aseguradora tras confirmación.
   * @param id Identificador de la aseguradora.
   */
  deleteInsurance(id: number): void {
    if (confirm('¿Desea eliminar esta aseguradora?')) {
      this.insuranceService.deleteInsurance(id).subscribe(() => this.loadInsurances());
    }
  }

  /**
   * @function deleteStatus
   * @description Elimina un estado de servicio tras confirmación.
   * @param id Identificador del estado.
   */
  deleteStatus(id: number): void {
    if (confirm('¿Desea eliminar este estado?')) {
      this.statusService.deleteServiceStatus(id).subscribe(() => this.loadStatuses());
    }
  }
}
