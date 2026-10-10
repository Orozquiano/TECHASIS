import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { SaveVehicleDTO, TipoVehiculo, Vehicle } from '../../../../core/models';

/**
 * @class VehicleFormComponent
 * @description Formulario reactivo para crear o editar vehículos.
 */
@Component({
  selector: 'app-vehicle-form',
  imports: [ReactiveFormsModule],
  templateUrl: './vehicle-form.component.html',
  styleUrl: './vehicle-form.component.scss',
})
export class VehicleFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() vehicle: Vehicle | null = null;
  @Input() tiposVehiculo: TipoVehiculo[] = [];
  @Output() save = new EventEmitter<SaveVehicleDTO>();
  @Output() cancel = new EventEmitter<void>();

  protected readonly vehicleForm = this.fb.group({
    tipoVehiculoId: ['', Validators.required],
    placa: ['', Validators.required],
    codigo: ['', Validators.required],
  });

  /**
   * @function ngOnChanges
   * @description Sincroniza el formulario con el vehículo recibido.
   * @param changes Cambios detectados en las entradas.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['vehicle']) {
      return;
    }

    if (this.vehicle) {
      this.vehicleForm.patchValue({
        tipoVehiculoId: String(this.vehicle.tipoVehiculo.id),
        placa: this.vehicle.placa,
        codigo: this.vehicle.codigo,
      });
    } else {
      this.vehicleForm.reset({ tipoVehiculoId: '', placa: '', codigo: '' });
    }
  }

  /**
   * @function onSubmit
   * @description Valida y emite los datos del vehículo.
   */
  protected onSubmit(): void {
    if (this.vehicleForm.invalid) {
      this.vehicleForm.markAllAsTouched();
      return;
    }

    this.save.emit(this.vehicleForm.getRawValue() as SaveVehicleDTO);
  }
}
