import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

/**
 * @interface NavItem
 * @description Elemento de navegación del área autenticada.
 */
interface NavItem {
  label: string;
  route: string;
}

/**
 * @class NavbarComponent
 * @description Barra de navegación filtrada según permisos del menú del usuario.
 */
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  /**
   * @description Catálogo completo de rutas conocidas por la aplicación.
   */
  private readonly allNavItems: NavItem[] = [
    { label: 'Nuevo servicio', route: 'newService' },
    { label: 'Servicios', route: 'services' },
    { label: 'Expedientes', route: 'files' },
    { label: 'Conciliación', route: 'conciliations' },
    { label: 'Informes', route: 'reports' },
    { label: 'Ranking', route: 'ranking' },
    { label: 'Custodias', route: 'wachen' },
    { label: 'Administración', route: 'administration' },
  ];

  /**
   * @description Ítems visibles según permisos del usuario.
   */
  protected readonly visibleNavItems = signal<NavItem[]>([]);

  /**
   * @function ngOnInit
   * @description Filtra el menú al inicializar el componente.
   */
  ngOnInit(): void {
    this.filterMenuByPermissions();
  }

  /**
   * @function filterMenuByPermissions
   * @description Reduce el menú a las rutas autorizadas en sesión.
   */
  private filterMenuByPermissions(): void {
    const allowedRoutes = this.authService.getUserRoutesFromStorage();

    this.visibleNavItems.set(
      this.allNavItems.filter((item) =>
        allowedRoutes.some(
          (allowed) => allowed.nombre.toLowerCase() === item.route.toLowerCase(),
        ),
      ),
    );
  }

  /**
   * @function onLogout
   * @description Cierra la sesión y redirige al login.
   */
  protected onLogout(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
