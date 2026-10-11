import { Component, input, output } from '@angular/core';

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

  /**
   * @function close
   * @description Solicita el cierre del modal.
   */
  close(): void {
    this.closed.emit();
  }
}
