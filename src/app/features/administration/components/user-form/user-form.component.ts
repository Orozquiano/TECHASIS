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
import type { Rol, SaveUserDTO, TipoDocumento, User } from '../../../../core/models';
import { SelectComponent, type SelectOption } from '../../../../shared/components/select/select.component';

/**
 * @class UserFormComponent
 * @description Formulario reactivo para crear o editar usuarios.
 */
@Component({
  selector: 'app-user-form',
  imports: [ReactiveFormsModule, SelectComponent],
  templateUrl: './user-form.component.html',
  styleUrl: './user-form.component.scss',
})
export class UserFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  /**
   * @description Usuario en edición. Null en modo creación.
   */
  @Input() user: User | null = null;

  /**
   * @description Tipos de documento disponibles.
   */
  @Input() tiposDocumento: TipoDocumento[] = [];

  /**
   * @description Roles disponibles.
   */
  @Input() roles: Rol[] = [];

  /**
   * @description Emite el DTO listo para persistir.
   */
  @Output() save = new EventEmitter<SaveUserDTO>();

  /**
   * @description Emite cuando el usuario cancela el formulario.
   */
  @Output() cancel = new EventEmitter<void>();

  /**
   * @description Opciones del tipo de documento, sin la entrada vacía de ayuda.
   */
  protected get tipoDocumentoOptions(): SelectOption[] {
    return this.tiposDocumento.map((tipo) => ({
      value: String(tipo.id),
      label: `${tipo.nombre} (${tipo.codigo})`,
    }));
  }

  /**
   * @description Opciones de rol, sin la entrada vacía de ayuda.
   */
  protected get rolOptions(): SelectOption[] {
    return this.roles.map((rol) => ({
      value: String(rol.id),
      label: rol.nombre,
    }));
  }

  /**
   * @description Grupo de controles del formulario de usuario.
   */
  protected readonly userForm = this.fb.group({
    tipoDocumentoId: ['', Validators.required],
    documento: ['', Validators.required],
    rolId: ['', Validators.required],
    primerNombre: ['', Validators.required],
    segundoNombre: [''],
    primerApellido: ['', Validators.required],
    segundoApellido: [''],
    clave: [''],
  });

  /**
   * @function ngOnChanges
   * @description Sincroniza el formulario con el usuario recibido.
   * @param changes Cambios detectados en las entradas.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['user']) {
      return;
    }

    if (this.user) {
      this.userForm.patchValue({
        tipoDocumentoId: String(this.user.tipoDocumentoId),
        documento: this.user.documento,
        rolId: String(this.user.rolId),
        primerNombre: this.user.primerNombre,
        segundoNombre: this.user.segundoNombre || '',
        primerApellido: this.user.primerApellido,
        segundoApellido: this.user.segundoApellido || '',
        clave: '',
      });
      this.userForm.get('clave')?.clearValidators();
    } else {
      this.userForm.reset({
        tipoDocumentoId: '',
        rolId: '',
        segundoNombre: '',
        segundoApellido: '',
        clave: '',
      });
      this.userForm.get('clave')?.setValidators([Validators.required]);
    }

    this.userForm.get('clave')?.updateValueAndValidity();
  }

  /**
   * @function onSubmit
   * @description Valida y emite los datos del formulario.
   */
  protected onSubmit(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.save.emit(this.userForm.getRawValue() as SaveUserDTO);
  }
}
