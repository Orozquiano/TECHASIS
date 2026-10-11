import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { NavbarComponent } from '../navbar/navbar.component';

/**
 * @class ShellComponent
 * @description Contenedor autenticado con cabecera, navegación y contenido.
 */
@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, HeaderComponent, NavbarComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {}
