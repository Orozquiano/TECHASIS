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
import type { CreateInsuranceDTO, Insurance, UpdateInsuranceDTO } from '../../../../core/models';

/**
 * @class InsuranceFormComponent
 * @description Formulario reactivo para crear o editar aseguradoras.
 */
@Component({
  selector: 'app-insurance-form',
  imports: [ReactiveFormsModule],
  templateUrl: './insurance-form.component.html',
  styleUrl: './insurance-form.component.scss',
})
export class InsuranceFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() insurance: Insurance | null = null;
  @Input() pending = false;
  @Output() save = new EventEmitter<CreateInsuranceDTO | UpdateInsuranceDTO>();
  @Output() cancel = new EventEmitter<void>();

  protected readonly insuranceForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    codigo: ['', [Validators.required, Validators.maxLength(20)]],
    activo: [true, Validators.required],
  });

  /**
   * @function ngOnChanges
   * @description Sincroniza el formulario con la aseguradora recibida.
   * @param changes Cambios detectados en las entradas.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['insurance']) {
      return;
    }

    if (this.insurance) {
      this.insuranceForm.patchValue({
        nombre: this.insurance.nombre,
        codigo: this.insurance.codigo,
        activo: this.insurance.activo,
      });
    } else {
      this.insuranceForm.reset({ nombre: '', codigo: '', activo: true });
    }
  }

  /**
   * @function onSubmit
   * @description Valida y emite los datos de la aseguradora.
   */
  protected onSubmit(): void {
    if (this.insuranceForm.invalid) {
      this.insuranceForm.markAllAsTouched();
      return;
    }

    const nombre = this.insuranceForm.controls.nombre.value ?? '';
    const codigo = this.insuranceForm.controls.codigo.value ?? '';

    if (this.insurance) {
      this.save.emit({
        nombre,
        codigo,
        activo: this.insuranceForm.controls.activo.value ?? false,
      });
      return;
    }

    this.save.emit({ nombre, codigo });
  }
}
