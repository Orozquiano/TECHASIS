import { Component, ElementRef, HostListener, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ThemeService } from '../../core/theme/theme.service';

/**
 * @class MenuHamburguesaComponent
 * @description Menú de usuario anclado al navbar, con identidad, tema y cierre de sesión.
 */
@Component({
  selector: 'app-menu-hamburguesa',
  imports: [],
  templateUrl: './menu-hamburguesa.component.html',
  styleUrl: './menu-hamburguesa.component.scss',
})
export class MenuHamburguesaComponent {
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /**
   * @description Indica si el panel del menú está visible.
   */
  protected readonly isOpen = signal(false);

  /**
   * @description Nombre visible mientras no exista el perfil real del usuario.
   */
  protected readonly userName = 'Gerardo Hernández';

  /**
   * @description Identificación provisional generada para esta vista.
   */
  protected readonly identification = Math.floor(10000000 + Math.random() * 90000000);

  /**
   * @description Tema efectivo aplicado, expuesto para la plantilla.
   */
  protected readonly resolvedTheme = this.themeService.resolvedTheme;

  /**
   * @description Modo de preferencia (automático o manual).
   */
  protected readonly themeMode = this.themeService.mode;

  /**
   * @function toggleMenu
   * @description Abre o cierra el panel del menú de usuario.
   * @param event Evento del botón para no cerrarlo al propagarse.
   */
  protected toggleMenu(event: Event): void {
    event.stopPropagation();
    this.isOpen.update((open) => !open);
  }

  /**
   * @function onThemeToggle
   * @description Alterna el tema claro/oscuro y persiste la preferencia manual.
   * @param event Evento del interruptor.
   */
  protected onThemeToggle(event: Event): void {
    event.stopPropagation();
    this.themeService.toggleDarkMode(!this.themeService.isDark());
  }

  /**
   * @function onThemeKeydown
   * @description Permite activar el interruptor con teclado.
   * @param event Evento de teclado del interruptor.
   */
  protected onThemeKeydown(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();
      this.themeService.toggleDarkMode(!this.themeService.isDark());
    }
  }

  /**
   * @function onUseSystemTheme
   * @description Restaura el modo automático siguiendo al sistema operativo.
   * @param event Evento del botón de sistema.
   */
  protected onUseSystemTheme(event: Event): void {
    event.stopPropagation();
    this.themeService.useSystemTheme();
  }

  /**
   * @function onLogout
   * @description Cierra la sesión y redirige al login.
   */
  protected onLogout(): void {
    this.isOpen.set(false);
    this.authService.logout();
    void this.router.navigate(['/login']);
  }

  /**
   * @function onDocumentClick
   * @description Cierra el menú cuando el clic ocurre fuera del componente.
   * @param event Evento de clic en el documento.
   */
  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }

  /**
   * @function onEscape
   * @description Cierra el menú con la tecla Escape.
   */
  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.isOpen.set(false);
  }
}
