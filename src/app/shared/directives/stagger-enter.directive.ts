import {
  afterNextRender,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  numberAttribute,
} from '@angular/core';
import {
  MOTION_EASE_OUT,
  MOTION_ENTER_MS,
  MOTION_RISE_KEYFRAMES,
  MOTION_STAGGER_MS,
  prefersReducedMotion,
} from '../../core/motion/motion.tokens';

/**
 * @class StaggerEnterDirective
 * @description Aplica una entrada escalonada (fade + scale + rise) a los hijos
 * del host, o al propio host cuando no hay hijos animables.
 */
@Directive({
  selector: '[appStaggerEnter]',
  standalone: true,
})
export class StaggerEnterDirective {
  /**
   * @description Elemento anfitrión donde se aplica la coreografía.
   */
  private readonly host = inject(ElementRef<HTMLElement>);

  /**
   * @description Referencia de destrucción para cancelar animaciones vivas.
   */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * @description Animaciones iniciadas por la directiva.
   */
  private readonly animations: Animation[] = [];

  /**
   * @description Retraso base antes del primer elemento, en milisegundos.
   */
  readonly delayMs = input(0, { alias: 'appStaggerEnterDelay', transform: numberAttribute });

  /**
   * @description Separación entre elementos sucesivos, en milisegundos.
   */
  readonly staggerMs = input(MOTION_STAGGER_MS, {
    alias: 'appStaggerEnterStep',
    transform: numberAttribute,
  });

  /**
   * @description Selector CSS de hijos a animar. Vacío anima el host.
   */
  readonly childSelector = input('', { alias: 'appStaggerEnterChildren' });

  constructor() {
    afterNextRender(() => this.play());

    this.destroyRef.onDestroy(() => {
      this.animations.forEach((animation) => {
        if (animation.playState === 'running') {
          animation.cancel();
        }
      });
    });
  }

  /**
   * @function play
   * @description Ejecuta la secuencia de entrada respetando reduced-motion.
   */
  private play(): void {
    if (prefersReducedMotion()) {
      return;
    }

    const root = this.host.nativeElement;
    const selector = this.childSelector().trim();
    const targets = selector
      ? Array.from(root.querySelectorAll(selector)).filter(
          (node): node is HTMLElement => node instanceof HTMLElement,
        )
      : this.resolveDirectChildren(root);

    if (targets.length === 0) {
      this.animateNode(root, this.delayMs());
      return;
    }

    targets.forEach((node, index) => {
      this.animateNode(node, this.delayMs() + index * this.staggerMs());
    });
  }

  /**
   * @function resolveDirectChildren
   * @description Obtiene hijos directos visibles del contenedor.
   * @param root Contenedor raíz.
   * @returns Lista de elementos a animar.
   */
  private resolveDirectChildren(root: HTMLElement): HTMLElement[] {
    return Array.from(root.children).filter(
      (node): node is HTMLElement =>
        node instanceof HTMLElement && getComputedStyle(node).display !== 'none',
    );
  }

  /**
   * @function animateNode
   * @description Lanza la animación rise sobre un nodo.
   * @param node Elemento objetivo.
   * @param delay Retraso de inicio en milisegundos.
   */
  private animateNode(node: HTMLElement, delay: number): void {
    node.style.willChange = 'opacity, transform';
    const animation = node.animate(MOTION_RISE_KEYFRAMES, {
      duration: MOTION_ENTER_MS,
      delay,
      easing: MOTION_EASE_OUT,
      fill: 'both',
    });

    animation.finished.finally(() => {
      node.style.willChange = '';
    });

    this.animations.push(animation);
  }
}
