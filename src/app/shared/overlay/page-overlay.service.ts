import { computed, Injectable, signal } from '@angular/core';

/**
 * @class PageOverlayService
 * @description Indica si hay un diálogo modal cubriendo la página y bloquea el scroll de fondo.
 */
@Injectable({ providedIn: 'root' })
export class PageOverlayService {
  /**
   * @description Cantidad de modales abiertos (afecta la UI de navegación).
   */
  private readonly openCount = signal(0);

  /**
   * @description Cantidad de bloqueos de scroll activos (modales u hojas).
   */
  private scrollLockCount = 0;

  /**
   * @description Posición vertical preservada mientras el scroll está bloqueado.
   */
  private lockedScrollY = 0;

  /**
   * @description Indica si el documento tiene el scroll bloqueado.
   */
  private isScrollLocked = false;

  /**
   * @description Verdadero mientras al menos un modal está visible.
   */
  readonly isOpen = computed(() => this.openCount() > 0);

  /**
   * @function acquire
   * @description Registra la apertura de un modal y bloquea el scroll de la página.
   */
  acquire(): void {
    this.openCount.update((count) => count + 1);
    this.acquireScrollLock();
  }

  /**
   * @function release
   * @description Registra el cierre de un modal y restaura el scroll si corresponde.
   */
  release(): void {
    this.openCount.update((count) => Math.max(0, count - 1));
    this.releaseScrollLock();
  }

  /**
   * @function acquireScrollLock
   * @description Bloquea el scroll de la página sin marcar un modal de navegación.
   */
  acquireScrollLock(): void {
    this.scrollLockCount += 1;
    this.syncScrollLock();
  }

  /**
   * @function releaseScrollLock
   * @description Libera un bloqueo de scroll previamente adquirido.
   */
  releaseScrollLock(): void {
    this.scrollLockCount = Math.max(0, this.scrollLockCount - 1);
    this.syncScrollLock();
  }

  /**
   * @function syncScrollLock
   * @description Activa o libera el bloqueo de scroll según los bloqueos activos.
   */
  private syncScrollLock(): void {
    const shouldLock = this.scrollLockCount > 0;

    if (shouldLock && !this.isScrollLocked) {
      this.lockScroll();
      return;
    }

    if (!shouldLock && this.isScrollLocked) {
      this.unlockScroll();
    }
  }

  /**
   * @function lockScroll
   * @description Fija el documento para que no se desplace el fondo tras el popup.
   */
  private lockScroll(): void {
    this.isScrollLocked = true;
    this.lockedScrollY = window.scrollY;

    const { body } = document;
    const html = document.documentElement;

    body.style.position = 'fixed';
    body.style.top = `-${this.lockedScrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    body.style.width = '100%';
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    html.style.overscrollBehavior = 'none';
  }

  /**
   * @function unlockScroll
   * @description Restaura el scroll del documento y la posición previa.
   */
  private unlockScroll(): void {
    this.isScrollLocked = false;

    const { body } = document;
    const html = document.documentElement;

    body.style.position = '';
    body.style.top = '';
    body.style.left = '';
    body.style.right = '';
    body.style.width = '';
    body.style.overflow = '';
    html.style.overflow = '';
    html.style.overscrollBehavior = '';

    window.scrollTo(0, this.lockedScrollY);
  }
}
