import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

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
export class App {}
