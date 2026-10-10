import { Component, input } from '@angular/core';

/**
 * @class CardComponent
 * @description Contenedor tipográfico de sección para formularios operativos.
 */
@Component({
  selector: 'app-card',
  imports: [],
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss',
})
export class CardComponent {
  /**
   * @description Título visible de la sección.
   */
  readonly title = input('');

  /**
   * @description Indica si la sección contiene campos obligatorios.
   */
  readonly required = input(false);
}
