import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { APP_ENVIRONMENT } from '../../../../core/config/app-environment';
import { DEMO_CREDENTIALS } from '../../../../core/http/mock-api.store';
import type { ApiResponse } from '../../../../core/models';

/**
 * @class LoginComponent
 * @description Pantalla inicial de acceso a la plataforma.
 */
@Component({
  imports: [ReactiveFormsModule],
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
   * @description Mensaje de error de autenticación.
   */
  protected readonly errorMessage = signal<string | null>(null);

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
        const apiRes = this.resolveApiError(err);

        if (apiRes?.showsMessage && apiRes.message) {
          this.errorMessage.set(apiRes.message);
        } else {
          this.errorMessage.set('Credenciales inválidas o error de conexión.');
        }
      },
    });
  }

  /**
   * @function resolveApiError
   * @description Normaliza errores HTTP o ApiResponse hacia un contrato común.
   * @param err Error capturado por la suscripción.
   * @returns Respuesta tipada o null cuando no se puede interpretar.
   */
  private resolveApiError(err: unknown): ApiResponse<null> | null {
    if (!err || typeof err !== 'object') {
      return null;
    }

    if ('error' in err) {
      const nested = (err as { error?: unknown }).error;
      return nested && typeof nested === 'object' ? (nested as ApiResponse<null>) : null;
    }

    return err as ApiResponse<null>;
  }
}
