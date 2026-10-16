import { Component, DestroyRef, ElementRef, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
  RouterOutlet,
} from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { NavbarComponent } from '../navbar/navbar.component';

/**
 * @description Duración de la entrada del contenido nuevo, en milisegundos.
 */
const PAGE_ENTER_MS = 280;

/**
 * @description Curva compartida con la cápsula de selección.
 */
const PAGE_MOTION_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * @class ShellComponent
 * @description Contenedor autenticado con cabecera, navegación y contenido.
 * Al cambiar de sección, la página nueva aparece solo con opacidad.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, HeaderComponent, NavbarComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly stage = viewChild<ElementRef<HTMLElement>>('stage');

  /**
   * @description Orden visual de las secciones, de izquierda a derecha.
   */
  private readonly sectionOrder = [
    'newService',
    'services',
    'files',
    'conciliations',
    'reports',
    'ranking',
    'wachen',
    'administration',
  ];

  /**
   * @description Identificador de la navegación que tiene una transición en curso.
   */
  private motionId = 0;

  /**
   * @description Animación de opacidad de la página que entra.
   */
  private enteringAnimation: Animation | null = null;

  constructor() {
    this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.preparePageMotion(event);
        return;
      }

      if (event instanceof NavigationEnd) {
        this.playPageMotion(event.id);
        return;
      }

      if (event instanceof NavigationCancel || event instanceof NavigationError) {
        if (event.id === this.motionId) {
          this.finishPageMotion();
        }
      }
    });
  }

  /**
   * @function preparePageMotion
   * @description Prepara un fundido de opacidad si el cambio es entre secciones.
   * No clona la página: esa copia dejaba un fondo propio y deformaba los selectores.
   * @param event Inicio de la navegación solicitada.
   */
  private preparePageMotion(event: NavigationStart): void {
    this.finishPageMotion();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const from = this.sectionIndex(this.router.url);
    const to = this.sectionIndex(event.url);
    if (from < 0 || to < 0 || from === to) {
      return;
    }

    this.motionId = event.id;
    window.scrollTo(0, 0);
  }

  /**
   * @function playPageMotion
   * @description Hace aparecer la página nueva solo con opacidad.
   * @param navigationId Identificador de la navegación que terminó.
   */
  private playPageMotion(navigationId: number): void {
    if (navigationId !== this.motionId) {
      return;
    }

    const entering = this.pageElement(this.stage()?.nativeElement);
    if (!entering) {
      requestAnimationFrame(() => {
        if (this.motionId !== navigationId) {
          return;
        }
        const nextPage = this.pageElement(this.stage()?.nativeElement);
        if (!nextPage) {
          this.finishPageMotion();
          return;
        }
        this.fadeIn(nextPage, navigationId);
      });
      return;
    }

    this.fadeIn(entering, navigationId);
  }

  /**
   * @function fadeIn
   * @description Funde la página que acaba de montarse, sin desplazarla ni escalarla.
   * @param entering Página activa.
   * @param navigationId Identificador de la navegación asociada.
   */
  private fadeIn(entering: HTMLElement, navigationId: number): void {
    this.enteringAnimation = entering.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: PAGE_ENTER_MS,
      easing: PAGE_MOTION_EASING,
      fill: 'forwards',
    });

    this.enteringAnimation.finished.then(
      () => {
        if (this.motionId === navigationId) {
          this.finishPageMotion();
        }
      },
      () => undefined,
    );
  }

  /**
   * @function finishPageMotion
   * @description Termina el fundido y deja la página en su opacidad normal.
   */
  private finishPageMotion(): void {
    this.stopMotion(this.enteringAnimation);
    this.enteringAnimation = null;
    this.motionId = 0;

    const page = this.pageElement(this.stage()?.nativeElement);
    if (page) {
      page.style.opacity = '';
      page.style.transform = '';
    }
  }

  /**
   * @function stopMotion
   * @description Cancela la animación para que no deje opacidad residual.
   * @param animation Animación de entrada. Puede no existir.
   */
  private stopMotion(animation: Animation | null): void {
    animation?.cancel();
  }

  /**
   * @function pageElement
   * @description Obtiene el componente de página montado en el contenedor.
   * @param stage Contenedor de la ruta activa.
   * @returns Elemento de la página, o null si todavía no está montado.
   */
  private pageElement(stage: HTMLElement | undefined): HTMLElement | null {
    if (!stage) {
      return null;
    }

    return (
      [...stage.children].find(
        (node): node is HTMLElement =>
          node instanceof HTMLElement && node.tagName !== 'ROUTER-OUTLET',
      ) ?? null
    );
  }

  /**
   * @function sectionIndex
   * @description Ubica una URL en el orden visual de la navegación.
   * @param url URL completa o relativa.
   * @returns Índice de la sección, o -1 si no pertenece a la navegación.
   */
  private sectionIndex(url: string): number {
    const [path] = url.split(/[?#]/);
    const section = path.split('/').filter(Boolean)[0] ?? '';
    return this.sectionOrder.indexOf(section);
  }
}
