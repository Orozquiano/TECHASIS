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
 * @description Duración de la salida del contenido, en milisegundos.
 */
const PAGE_EXIT_MS = 220;

/**
 * @description Duración de la entrada del contenido nuevo, en milisegundos.
 */
const PAGE_ENTER_MS = 320;

/**
 * @description Curva compartida con la cápsula de selección.
 */
const PAGE_MOTION_EASING = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * @description Sentido del cambio según el orden visual de la navegación.
 */
type PageMotionDirection = 'forward' | 'back';

/**
 * @class ShellComponent
 * @description Contenedor autenticado con cabecera, navegación y contenido.
 * Al cambiar de sección, el contenido actual desaparece y el nuevo vuelve a aparecer.
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
   * @description Sentido pendiente hasta que la página nueva está en el documento.
   */
  private motionDirection: PageMotionDirection = 'forward';

  /**
   * @description Copia visual de la página que se está yendo.
   */
  private leavingPage: HTMLElement | null = null;

  /**
   * @description Animación de la página que entra.
   */
  private enteringAnimation: Animation | null = null;

  /**
   * @description Animación de la página que sale.
   */
  private leavingAnimation: Animation | null = null;

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
   * @description Conserva la página actual y decide el sentido antes de sustituirla.
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

    const stage = this.stage()?.nativeElement;
    const current = this.pageElement(stage);
    const shell = stage?.closest('.shell');
    if (!stage || !current || !(shell instanceof HTMLElement) || current.offsetWidth === 0) {
      return;
    }

    const rect = current.getBoundingClientRect();
    const clone = current.cloneNode(true) as HTMLElement;
    this.copyControlState(current, clone);
    clone.classList.add('shell_leaving');
    clone.setAttribute('aria-hidden', 'true');
    clone.setAttribute('inert', '');
    clone.querySelectorAll('[id]').forEach((node) => node.removeAttribute('id'));
    this.placeLeavingPage(clone, rect, shell);
    shell.appendChild(clone);

    this.leavingPage = clone;
    this.motionId = event.id;
    this.motionDirection = to > from ? 'forward' : 'back';
    window.scrollTo(0, 0);
  }

  /**
   * @function playPageMotion
   * @description Lanza la secuencia de desaparición y reaparición del contenido.
   * @param navigationId Identificador de la navegación que terminó.
   */
  private playPageMotion(navigationId: number): void {
    if (navigationId !== this.motionId || !this.leavingPage) {
      return;
    }

    const stage = this.stage()?.nativeElement;
    const entering = this.pageElement(stage);
    if (!stage || !entering) {
      requestAnimationFrame(() => {
        if (this.motionId !== navigationId) {
          return;
        }
        const nextStage = this.stage()?.nativeElement;
        const nextPage = this.pageElement(nextStage);
        if (!nextStage || !nextPage) {
          this.finishPageMotion();
          return;
        }
        this.animatePageChange(nextStage, nextPage, navigationId);
      });
      return;
    }

    this.animatePageChange(stage, entering, navigationId);
  }

  /**
   * @function animatePageChange
   * @description Hace desaparecer la página anterior y, al terminar, hace aparecer la nueva.
   * @param stage Contenedor de la página activa.
   * @param entering Página que acaba de montarse.
   * @param navigationId Identificador de la navegación asociada.
   */
  private animatePageChange(stage: HTMLElement, entering: HTMLElement, navigationId: number): void {
    const leaving = this.leavingPage;
    if (!leaving) {
      return;
    }

    stage.dataset['nav'] = this.motionDirection;
    const easing = PAGE_MOTION_EASING;

    entering.style.opacity = '0';
    entering.style.transform = 'translate3d(0, 12px, 0) scale(0.985)';

    this.leavingAnimation = leaving.animate(
      [
        { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
        { opacity: 0, transform: 'translate3d(0, -10px, 0) scale(0.985)' },
      ],
      { duration: PAGE_EXIT_MS, easing, fill: 'forwards' },
    );

    this.leavingAnimation.finished.then(
      () => {
        if (this.motionId !== navigationId) {
          return;
        }

        leaving.style.visibility = 'hidden';
        this.enteringAnimation = entering.animate(
          [
            { opacity: 0, transform: 'translate3d(0, 14px, 0) scale(0.985)' },
            { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
          ],
          { duration: PAGE_ENTER_MS, easing, fill: 'forwards' },
        );

        this.enteringAnimation.finished.then(
          () => {
            if (this.motionId === navigationId) {
              entering.style.opacity = '';
              entering.style.transform = '';
              this.finishPageMotion();
            }
          },
          () => undefined,
        );
      },
      () => undefined,
    );
  }

  /**
   * @function finishPageMotion
   * @description Quita la copia de la página anterior y deja el contenido en su lugar.
   */
  private finishPageMotion(): void {
    this.stopMotion(this.enteringAnimation);
    this.stopMotion(this.leavingAnimation);
    this.enteringAnimation = null;
    this.leavingAnimation = null;
    this.leavingPage?.remove();
    this.leavingPage = null;
    this.motionId = 0;

    const stage = this.stage()?.nativeElement;
    if (stage) {
      delete stage.dataset['nav'];
      const page = this.pageElement(stage);
      if (page) {
        page.style.opacity = '';
        page.style.transform = '';
      }
    }
  }

  /**
   * @function stopMotion
   * @description Quita la animación de la página, también cuando ya terminó,
   * para que no deje un transform que desplace los paneles fijos.
   * @param animation Animación de entrada o salida. Puede no existir.
   */
  private stopMotion(animation: Animation | null): void {
    animation?.cancel();
  }

  /**
   * @function placeLeavingPage
   * @description Fija la copia sobre el área visible, por debajo de la cabecera y la barra.
   * @param clone Copia de la página que sale.
   * @param rect Posición de la página original en el viewport.
   * @param shell Contenedor del que se copia el fondo.
   */
  private placeLeavingPage(clone: HTMLElement, rect: DOMRect, shell: HTMLElement): void {
    const shellStyle = getComputedStyle(shell);
    const topBar = document.querySelector('.shell_top')?.getBoundingClientRect().bottom ?? 0;
    const tabBar = document.querySelector('.tabbar');
    let bottomLimit = window.innerHeight;
    if (tabBar instanceof HTMLElement && getComputedStyle(tabBar).display !== 'none') {
      bottomLimit = tabBar.getBoundingClientRect().top;
    }

    const clipTop = Math.max(0, topBar - rect.top);
    const clipBottom = Math.max(0, rect.bottom - bottomLimit);

    clone.style.position = 'fixed';
    clone.style.zIndex = '20';
    clone.style.top = `${rect.top}px`;
    clone.style.left = `${rect.left}px`;
    clone.style.width = `${rect.width}px`;
    clone.style.height = `${rect.height}px`;
    clone.style.margin = '0';
    clone.style.boxSizing = 'border-box';
    clone.style.display = 'block';
    clone.style.overflow = 'hidden';
    clone.style.pointerEvents = 'none';
    clone.style.clipPath = `inset(${clipTop}px 0px ${clipBottom}px 0px)`;
    clone.style.backgroundColor = shellStyle.backgroundColor;
    clone.style.backgroundImage = shellStyle.backgroundImage;
    clone.style.backgroundRepeat = shellStyle.backgroundRepeat;
    clone.style.backgroundSize = shellStyle.backgroundSize;
    clone.style.backgroundPosition = shellStyle.backgroundPosition;
    clone.style.backgroundAttachment = 'fixed';
  }

  /**
   * @function copyControlState
   * @description Copia el valor visible de los campos, que cloneNode no conserva.
   * @param source Página original.
   * @param clone Copia visual de esa página.
   */
  private copyControlState(source: HTMLElement, clone: HTMLElement): void {
    const sourceControls = source.querySelectorAll('input, textarea, select');
    const cloneControls = clone.querySelectorAll('input, textarea, select');

    sourceControls.forEach((control, index) => {
      const target = cloneControls[index];
      if (control instanceof HTMLInputElement && target instanceof HTMLInputElement) {
        target.checked = control.checked;
        target.value = control.value;
        return;
      }
      if (control instanceof HTMLTextAreaElement && target instanceof HTMLTextAreaElement) {
        target.value = control.value;
        return;
      }
      if (control instanceof HTMLSelectElement && target instanceof HTMLSelectElement) {
        target.value = control.value;
      }
    });
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
