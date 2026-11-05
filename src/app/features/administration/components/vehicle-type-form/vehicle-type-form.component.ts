import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { CreateVehicleTypeDTO, TipoVehiculo, UpdateVehicleTypeDTO } from '../../../../core/models';

/**
 * @class VehicleTypeFormComponent
 * @description Formulario de tipos de vehículo, separado del formulario de vehículos.
 */
@Component({
  selector: 'app-vehicle-type-form',
  imports: [ReactiveFormsModule],
  templateUrl: './vehicle-type-form.component.html',
  styleUrl: '../status-form/status-form.component.scss',
})
export class VehicleTypeFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  /**
   * @description Tipo en edición. Null al crear.
   */
  @Input() vehicleType: TipoVehiculo | null = null;

  /**
   * @description Bloquea el envío mientras la petición está en curso.
   */
  @Input() pending = false;

  /**
   * @description Emite el cuerpo de creación o actualización.
   */
  @Output() save = new EventEmitter<CreateVehicleTypeDTO | UpdateVehicleTypeDTO>();

  /**
   * @description Emite la cancelación.
   */
  @Output() cancel = new EventEmitter<void>();

  /**
   * @description Controles del tipo de vehículo.
   */
  protected readonly form = this.fb.group({
    nombre: ['', Validators.required],
    codigo: ['', Validators.required],
    carga: [false],
    activo: [true],
  });

  /**
   * @function ngOnChanges
   * @description Carga el tipo recibido en el formulario.
   * @param changes Cambios de las entradas.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['vehicleType']) {
      return;
    }

    if (this.vehicleType) {
      this.form.patchValue(this.vehicleType);
      return;
    }

    this.form.reset({ nombre: '', codigo: '', carga: false, activo: true });
  }

  /**
   * @function onSubmit
   * @description Emite el DTO que corresponde al modo del formulario.
   */
  protected onSubmit(): void {
    if (this.form.invalid || this.pending) {
      this.form.markAllAsTouched();
      return;
    }

    const nombre = this.form.controls.nombre.value ?? '';
    const codigo = this.form.controls.codigo.value ?? '';
    const carga = this.form.controls.carga.value ?? false;

    if (this.vehicleType) {
      this.save.emit({ nombre, codigo, carga, activo: this.form.controls.activo.value ?? false });
      return;
    }

    this.save.emit({ nombre, codigo, carga });
  }
}
