import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './core/theme/theme.service';

/**
 * @class App
 * @description Componente raíz que muestra la vista correspondiente a la ruta activa.
 */
@Component({
  imports: [RouterOutlet],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  /**
   * @description Servicio de tema inicializado al arrancar la aplicación.
   */
  private readonly themeService = inject(ThemeService);

  constructor() {
    this.themeService.initialize();
  }
}
