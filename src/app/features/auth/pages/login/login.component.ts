import { Component, signal } from '@angular/core';

/**
 * @class LoginComponent
 * @description Pantalla inicial de acceso a la plataforma.
 */
@Component({
  imports: [],
  selector: 'app-login',
  styleUrl: './login.component.scss',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  /**
   * @description Indica si la contraseña se muestra en texto visible.
   */
  protected readonly passwordVisible = signal(false);

  /**
   * @function togglePasswordVisibility
   * @description Alterna la visibilidad del campo de contraseña.
   */
  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  /**
   * @function onSubmit
   * @description Evita el envío nativo del formulario.
   * La autenticación queda pendiente del contrato del backend.
   * @param event Evento de envío del formulario.
   */
  protected onSubmit(event: Event): void {
    event.preventDefault();
  }
}
