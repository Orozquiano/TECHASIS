import {
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { descriptionForRoute } from '../../../core/navigation/app-sections';

/**
 * @class PageHelpComponent
 * @description Marca de ayuda junto al título de la sección, con la descripción del menú.
 */
@Component({
  selector: 'app-page-help',
  templateUrl: './page-help.component.html',
  styleUrl: './page-help.component.scss',
})
export class PageHelpComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly trigger = viewChild<ElementRef<HTMLElement>>('trigger');
  private readonly tip = viewChild<ElementRef<HTMLElement>>('tip');

  /**
   * @description Segmento de ruta activo.
   */
  private readonly path = signal(this.currentPath());

  /**
   * @description Texto de ayuda de la sección actual.
   */
  protected readonly description = computed(() =>
    descriptionForRoute(this.path(), this.authService.getUserRoutesFromStorage()),
  );

  /**
   * @description Identificador del texto asociado al botón de ayuda.
   */
  protected readonly tipId = `page-help-${this.path().replace(/[^a-z0-9_-]/gi, '') || 'section'}`;

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.path.set(this.currentPath()));

    afterRenderEffect(() => {
      this.description();
      this.placeTip();
    });
  }

  /**
   * @function onViewportChange
   * @description Reubica el mensaje si la pantalla se mueve o cambia de tamaño.
   */
  @HostListener('window:resize')
  @HostListener('window:scroll')
  protected onViewportChange(): void {
    this.placeTip();
  }

  /**
   * @function placeTip
   * @description Coloca el mensaje dentro del ancho visible, debajo o encima del botón.
   */
  protected placeTip(): void {
    const trigger = this.trigger()?.nativeElement;
    const tip = this.tip()?.nativeElement;

    if (!trigger || !tip) {
      return;
    }

    const margin = 12;
    const rect = trigger.getBoundingClientRect();
    const width = Math.min(340, window.innerWidth - margin * 2);
    let left = rect.left;

    if (left + width > window.innerWidth - margin) {
      left = window.innerWidth - margin - width;
    }

    if (left < margin) {
      left = margin;
    }

    tip.style.width = `${width}px`;
    tip.style.left = `${left}px`;

    const height = tip.offsetHeight;
    const below = rect.bottom + 6;
    const above = rect.top - 6 - height;
    const fitsBelow = below + height <= window.innerHeight - margin;
    tip.style.top = `${fitsBelow || above < margin ? below : above}px`;
  }

  /**
   * @function currentPath
   * @description Obtiene el primer segmento de la URL actual.
   * @returns Ruta activa sin barras ni consulta.
   */
  private currentPath(): string {
    return this.router.url.split('?')[0].split('/').filter(Boolean)[0] ?? '';
  }
}
