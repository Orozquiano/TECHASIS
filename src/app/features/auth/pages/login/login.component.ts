import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { APP_ENVIRONMENT } from '../../../../core/config/app-environment';
import { DEMO_CREDENTIALS } from '../../../../core/http/mock-api.store';
import { readApiEnvelope } from '../../../../core/http/api-error';
import { formatApiMessage } from '../../../../core/messages/app-messages';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

/**
 * @class LoginComponent
 * @description Pantalla inicial de acceso a la plataforma.
 */
@Component({
  imports: [ReactiveFormsModule, ModalComponent],
  selector: 'app-login',
  styleUrl: './login.component.scss',
  templateUrl: './login.component.html',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly env = inject(APP_ENVIRONMENT);

  /**
   * @description Indica si la app corre con API simulada.
   */
  protected readonly isDemoMode = this.env.useMockApi;

  /**
   * @description Credenciales visibles solo en el despliegue demo.
   */
  protected readonly demoCredentials = DEMO_CREDENTIALS;

  /**
   * @description Indica si la contraseña se muestra en texto visible.
   */
  protected readonly passwordVisible = signal(false);

  /**
   * @description Indica si la autenticación está en curso.
   */
  protected readonly isLoading = signal(false);

  /**
   * @description Mensaje mostrado en el popup de error.
   */
  protected readonly errorMessage = signal<string | null>(null);

  /**
   * @description Indica si el popup de error está abierto.
   */
  protected readonly errorOpen = signal(false);

  /**
   * @description Formulario reactivo de inicio de sesión.
   */
  protected readonly loginForm = this.fb.nonNullable.group({
    user: [this.env.useMockApi ? DEMO_CREDENTIALS.user : '', Validators.required],
    password: [this.env.useMockApi ? DEMO_CREDENTIALS.password : '', Validators.required],
    remember: [false],
  });

  /**
   * @function togglePasswordVisibility
   * @description Alterna la visibilidad del campo de contraseña.
   */
  protected togglePasswordVisibility(): void {
    this.passwordVisible.update((visible) => !visible);
  }

  /**
   * @function onSubmit
   * @description Autentica al usuario y navega a su ruta por defecto.
   */
  protected onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.errorOpen.set(false);
    this.errorMessage.set(null);
    this.isLoading.set(true);

    const { user, password, remember } = this.loginForm.getRawValue();

    this.authService.login({ user, password }, remember).subscribe({
      next: ({ defaultRoute }) => {
        this.isLoading.set(false);
        void this.router.navigate([`/${defaultRoute}`]);
      },
      error: (err: unknown) => {
        this.isLoading.set(false);
        this.errorMessage.set(formatApiMessage(readApiEnvelope(err)));
        this.errorOpen.set(true);
      },
    });
  }

  /**
   * @function closeError
   * @description Cierra el popup de error de autenticación.
   */
  protected closeError(): void {
    this.errorOpen.set(false);
  }
}
