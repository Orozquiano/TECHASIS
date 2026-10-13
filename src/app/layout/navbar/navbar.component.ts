import { NgTemplateOutlet } from '@angular/common';
import {
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  HostListener,
  inject,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { APP_SECTIONS, menuGrantsRoute, type AppSection } from '../../core/navigation/app-sections';
import { PageOverlayService } from '../../shared/overlay/page-overlay.service';
import { MenuHamburguesaComponent } from '../menu-hamburguesa/menu-hamburguesa.component';

/**
 * @class NavbarComponent
 * @description Navegación del área autenticada: cápsula en escritorio y barra inferior en pantallas estrechas.
 */
@Component({
  selector: 'app-navbar',
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive, MenuHamburguesaComponent],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
})
export class NavbarComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageOverlay = inject(PageOverlayService);
  private readonly navTrack = viewChild<ElementRef<HTMLElement>>('navTrack');
  private readonly navPill = viewChild<ElementRef<HTMLElement>>('navPill');
  private readonly tabTrack = viewChild<ElementRef<HTMLElement>>('tabTrack');
  private readonly tabPill = viewChild<ElementRef<HTMLElement>>('tabPill');

  /**
   * @description Verdadero mientras un modal cubre la página.
   */
  protected readonly pageOverlayOpen = this.pageOverlay.isOpen;

  /**
   * @description Catálogo completo de secciones conocidas por la aplicación.
   */
  private readonly allNavItems: readonly AppSection[] = APP_SECTIONS;

  /**
   * @description Ítems visibles según el menú autorizado.
   */
  protected readonly visibleNavItems = signal<readonly AppSection[]>([]);

  /**
   * @description Ruta actual, usada para marcar el acceso Más.
   */
  private readonly currentUrl = signal(this.router.url);

  /**
   * @description Indica si el listado de secciones adicionales está abierto.
   */
  protected readonly moreOpen = signal(false);

  /**
   * @description Desplazamiento vertical de la hoja mientras se arrastra el clip.
   */
  protected readonly sheetOffset = signal(0);

  /**
   * @description Indica si el clip de la hoja se está arrastrando.
   */
  protected readonly sheetDragging = signal(false);

  /**
   * @description Punto vertical donde empezó el arrastre del clip.
   */
  private sheetStartY = 0;

  /**
   * @description Velocidad del arrastre, en píxeles por milisegundo.
   */
  private sheetVelocity = 0;

  /**
   * @description Última posición vertical registrada durante el arrastre.
   */
  private sheetLastY = 0;

  /**
   * @description Momento de la última muestra del arrastre.
   */
  private sheetLastTime = 0;

  /**
   * @description Temporizador del cierre animado de la hoja.
   */
  private sheetCloseTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * @description Hasta cinco destinos directos. El resto queda en Más.
   */
  protected readonly tabItems = computed(() => {
    const items = this.visibleNavItems();
    return items.length <= 5 ? items : items.slice(0, 4);
  });

  /**
   * @description Destinos que no caben en la barra inferior.
   */
  protected readonly overflowItems = computed(() => {
    const items = this.visibleNavItems();
    return items.length <= 5 ? [] : items.slice(4);
  });

  /**
   * @description Indica si la ruta actual pertenece a las secciones de Más.
   */
  protected readonly moreActive = computed(() =>
    this.overflowItems().some((item) => this.currentUrl().includes(`/${item.route}`)),
  );

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.currentUrl.set(event.urlAfterRedirects);
        this.moreOpen.set(false);
        this.schedulePillSync();
      });

    effect(() => {
      if (this.pageOverlayOpen()) {
        this.moreOpen.set(false);
      }
    });

    effect((onCleanup) => {
      if (!this.moreOpen()) {
        return;
      }

      this.pageOverlay.acquireScrollLock();
      onCleanup(() => this.pageOverlay.releaseScrollLock());
    });

    afterRenderEffect(() => {
      this.currentUrl();
      this.visibleNavItems();
      this.moreActive();
      this.pageOverlayOpen();
      this.syncPills();
    });
  }

  /**
   * @function ngOnInit
   * @description Filtra el menú al inicializar el componente.
   */
  ngOnInit(): void {
    this.filterMenuByPermissions();
    this.schedulePillSync();
  }

  /**
   * @function toggleMore
   * @description Abre o cierra el listado de secciones que no caben en la barra inferior.
   */
  protected toggleMore(): void {
    this.moreOpen.update((open) => !open);
  }

  /**
   * @function closeMore
   * @description Cierra el listado de secciones adicionales.
   */
  protected closeMore(): void {
    if (this.sheetCloseTimer !== null) {
      clearTimeout(this.sheetCloseTimer);
      this.sheetCloseTimer = null;
    }
    this.sheetOffset.set(0);
    this.sheetDragging.set(false);
    this.moreOpen.set(false);
  }

  /**
   * @function onSheetPointerDown
   * @description Empieza a arrastrar la hoja desde el clip gris.
   * @param event Evento del puntero sobre el clip.
   */
  protected onSheetPointerDown(event: PointerEvent): void {
    if (event.button !== 0) {
      return;
    }

    this.sheetDragging.set(true);
    this.sheetStartY = event.clientY;
    this.sheetLastY = event.clientY;
    this.sheetLastTime = event.timeStamp;
    this.sheetVelocity = 0;
    try {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    } catch {
      // Si el puntero no admite captura, el arrastre continúa con los eventos del documento.
    }
  }

  /**
   * @function onSheetPointerMove
   * @description Desplaza la hoja hacia abajo siguiendo el clip.
   * @param event Evento del puntero durante el arrastre.
   */
  @HostListener('document:pointermove', ['$event'])
  protected onSheetPointerMove(event: PointerEvent): void {
    if (!this.sheetDragging()) {
      return;
    }

    const elapsed = event.timeStamp - this.sheetLastTime;
    if (elapsed > 16) {
      this.sheetVelocity = (event.clientY - this.sheetLastY) / elapsed;
    }
    this.sheetLastY = event.clientY;
    this.sheetLastTime = event.timeStamp;
    this.sheetOffset.set(Math.max(0, event.clientY - this.sheetStartY));
  }

  /**
   * @function onSheetPointerUp
   * @description Suelta el clip: cierra la hoja o la devuelve a su sitio.
   */
  @HostListener('document:pointerup')
  @HostListener('document:pointercancel')
  protected onSheetPointerUp(): void {
    if (!this.sheetDragging()) {
      return;
    }

    const pulledDown = this.sheetOffset() > 90;
    const flickedDown = this.sheetOffset() > 36 && this.sheetVelocity > 1.2;
    const shouldClose = pulledDown || flickedDown;
    this.sheetDragging.set(false);

    if (!shouldClose) {
      this.sheetOffset.set(0);
      return;
    }

    this.sheetOffset.set(280);
    this.sheetCloseTimer = setTimeout(() => this.closeMore(), 180);
  }

  /**
   * @function onEscape
   * @description Cierra el listado de secciones adicionales con la tecla Escape.
   */
  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeMore();
  }

  /**
   * @function onResize
   * @description Reubica la cápsula de selección cuando cambia el ancho de la ventana.
   */
  @HostListener('window:resize')
  protected onResize(): void {
    this.syncPills();
  }

  /**
   * @function schedulePillSync
   * @description Reintenta ubicar la cápsula cuando el layout o la ruta activa aún no están listos.
   */
  private schedulePillSync(): void {
    requestAnimationFrame(() => {
      this.syncPills(8);
    });
  }

  /**
   * @function syncPills
   * @description Actualiza la cápsula de escritorio y la de la barra inferior.
   * @param retries Intentos restantes si el ítem activo todavía no está medible.
   */
  private syncPills(retries = 0): void {
    const navReady = this.movePill(
      this.navTrack()?.nativeElement,
      this.navPill()?.nativeElement,
      '.navbar_link.is-active',
    );
    const tabReady = this.movePill(
      this.tabTrack()?.nativeElement,
      this.tabPill()?.nativeElement,
      '.tabbar_item.is-active',
    );

    if ((!navReady || !tabReady) && retries > 0) {
      requestAnimationFrame(() => this.syncPills(retries - 1));
    }
  }

  /**
   * @function movePill
   * @description Desplaza la cápsula hasta la opción activa del contenedor indicado.
   * @param track Contenedor de las opciones.
   * @param pill Cápsula que marca la selección.
   * @param activeSelector Selector de la opción activa dentro del contenedor.
   * @returns true cuando la cápsula quedó posicionada o el contenedor no aplica.
   */
  private movePill(
    track: HTMLElement | undefined,
    pill: HTMLElement | undefined,
    activeSelector: string,
  ): boolean {
    if (!track || !pill) {
      return true;
    }

    const trackVisible = track.offsetWidth > 0 && getComputedStyle(track).display !== 'none';
    if (!trackVisible) {
      return true;
    }

    const active = track.querySelector<HTMLElement>(activeSelector);
    if (!active || active.offsetWidth === 0) {
      return false;
    }

    const firstMove = pill.dataset['ready'] !== 'true';

    pill.style.width = `${active.offsetWidth}px`;
    pill.style.height = `${active.offsetHeight}px`;
    pill.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
    pill.classList.add('is-ready');

    if (firstMove) {
      pill.dataset['ready'] = 'true';
      requestAnimationFrame(() => pill.classList.add('is-animate'));
    }

    return true;
  }

  /**
   * @function filterMenuByPermissions
   * @description Muestra solo las secciones que el menú autoriza, identificadas por código o por nombre de ruta.
   */
  private filterMenuByPermissions(): void {
    const allowedRoutes = this.authService.getUserRoutesFromStorage();

    if (allowedRoutes.length === 0) {
      this.visibleNavItems.set(this.allNavItems);
      return;
    }

    this.visibleNavItems.set(
      this.allNavItems.filter((item) =>
        allowedRoutes.some((allowed) => menuGrantsRoute(allowed, item.route)),
      ),
    );
  }
}
