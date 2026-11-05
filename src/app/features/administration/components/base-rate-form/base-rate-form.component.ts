import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import type { Insurance, SaveBaseRateDTO } from '../../../../core/models';
import { SelectComponent, type SelectOption } from '../../../../shared/components/select/select.component';

/**
 * @class BaseRateFormComponent
 * @description Formulario de creación y actualización de tarifas base.
 */
@Component({
  selector: 'app-base-rate-form',
  imports: [ReactiveFormsModule, SelectComponent],
  templateUrl: './base-rate-form.component.html',
  styleUrl: '../status-form/status-form.component.scss',
})
export class BaseRateFormComponent {
  private readonly fb = inject(FormBuilder);

  /**
   * @description Aseguradoras que llegan de los parámetros tarifarios.
   */
  @Input() insurers: Insurance[] = [];

  /**
   * @description Identificador a actualizar. Null crea una tarifa.
   */
  @Input() rateId: number | null = null;

  /**
   * @description Bloquea el envío mientras la petición está en curso.
   */
  @Input() pending = false;

  /**
   * @description Emite el cuerpo documentado.
   */
  @Output() save = new EventEmitter<SaveBaseRateDTO>();

  /**
   * @description Emite la cancelación.
   */
  @Output() cancel = new EventEmitter<void>();

  /**
   * @description Opciones de aseguradora para el selector.
   */
  protected get insurerOptions(): SelectOption[] {
    return this.insurers.map((item) => ({ value: String(item.id), label: item.nombre }));
  }

  /**
   * @description Controles de la tarifa.
   */
  protected readonly form = this.fb.group({
    aseguradoraId: ['', Validators.required],
    descripcion: ['', Validators.required],
    valor: [0, [Validators.required, Validators.min(0)]],
    codigo: ['', Validators.required],
  });

  /**
   * @function onSubmit
   * @description Emite la tarifa con la aseguradora referenciada por id.
   */
  protected onSubmit(): void {
    if (this.form.invalid || this.pending) {
      this.form.markAllAsTouched();
      return;
    }

    const aseguradoraId = Number(this.form.controls.aseguradoraId.value);
    this.save.emit({
      aseguradora: { id: aseguradoraId },
      descripcion: this.form.controls.descripcion.value ?? '',
      valor: Number(this.form.controls.valor.value ?? 0),
      codigo: this.form.controls.codigo.value ?? '',
    });
  }
}
