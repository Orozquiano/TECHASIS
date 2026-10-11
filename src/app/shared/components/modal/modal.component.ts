import { afterNextRender, Component, effect, ElementRef, inject, input, output } from '@angular/core';
import { PageOverlayService } from '../../overlay/page-overlay.service';

/**
 * @class ModalComponent
 * @description Diálogo modal reutilizable para formularios de administración.
 */
@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  private readonly pageOverlay = inject(PageOverlayService);
  private readonly host = inject(ElementRef<HTMLElement>);

  /**
   * @description Controla la visibilidad del modal.
   */
  readonly isOpen = input(false);

  /**
   * @description Título mostrado en la cabecera del modal.
   */
  readonly title = input('');

  /**
   * @description Evento emitido al cerrar el modal.
   */
  readonly closed = output<void>();

  constructor() {
    afterNextRender(() => {
      document.body.appendChild(this.host.nativeElement);
    });

    effect((onCleanup) => {
      if (!this.isOpen()) {
        return;
      }

      this.pageOverlay.acquire();
      onCleanup(() => this.pageOverlay.release());
    });
  }

  /**
   * @function close
   * @description Solicita el cierre del modal.
   */
  close(): void {
    this.closed.emit();
  }
}
