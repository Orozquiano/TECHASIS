import { computed, Injectable, signal } from '@angular/core';

/**
 * @class PageOverlayService
 * @description Indica si hay un diálogo modal cubriendo la página.
 */
@Injectable({ providedIn: 'root' })
export class PageOverlayService {
  private readonly openCount = signal(0);

  /**
   * @description Verdadero mientras al menos un modal está visible.
   */
  readonly isOpen = computed(() => this.openCount() > 0);

  /**
   * @function acquire
   * @description Registra la apertura de un modal.
   */
  acquire(): void {
    this.openCount.update((count) => count + 1);
  }

  /**
   * @function release
   * @description Registra el cierre de un modal.
   */
  release(): void {
    this.openCount.update((count) => Math.max(0, count - 1));
  }
}
