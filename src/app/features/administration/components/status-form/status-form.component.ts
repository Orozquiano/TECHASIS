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
import type { SaveServiceStatusDTO, ServiceStatus } from '../../../../core/models';

/**
 * @class StatusFormComponent
 * @description Formulario reactivo para crear o editar estados de servicio.
 */
@Component({
  selector: 'app-status-form',
  imports: [ReactiveFormsModule],
  templateUrl: './status-form.component.html',
  styleUrl: './status-form.component.scss',
})
export class StatusFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  /**
   * @description Estado en edición. Null en modo creación.
   */
  @Input() status: ServiceStatus | null = null;

  @Input() pending = false;

  /**
   * @description Emite el DTO listo para persistir.
   */
  @Output() save = new EventEmitter<SaveServiceStatusDTO>();

  /**
   * @description Emite cuando el usuario cancela el formulario.
   */
  @Output() cancel = new EventEmitter<void>();

  /**
   * @description Grupo de controles del formulario de estado.
   */
  protected readonly statusForm = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(20)]],
    descripcion: ['', [Validators.required, Validators.maxLength(100)]],
    activo: [true, Validators.required],
  });

  /**
   * @function ngOnChanges
   * @description Sincroniza el formulario con el estado recibido.
   * @param changes Cambios detectados en las entradas.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['status']) {
      return;
    }

    if (this.status) {
      this.statusForm.patchValue({
        codigo: this.status.codigo,
        descripcion: this.status.descripcion,
        activo: this.status.activo,
      });
    } else {
      this.statusForm.reset({ codigo: '', descripcion: '', activo: true });
    }
  }

  /**
   * @function onSubmit
   * @description Valida y emite los datos del estado.
   */
  protected onSubmit(): void {
    if (this.statusForm.invalid) {
      this.statusForm.markAllAsTouched();
      return;
    }

    this.save.emit(this.statusForm.getRawValue() as SaveServiceStatusDTO);
  }
}
