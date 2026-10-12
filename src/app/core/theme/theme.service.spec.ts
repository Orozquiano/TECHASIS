import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { THEME_STORAGE_KEY } from './theme.constants';
import { ThemeService } from './theme.service';

/**
 * @description MediaQueryList simulada para controlar prefers-color-scheme en pruebas.
 */
class MockMediaQueryList {
  /**
   * @description Listeners registrados sobre el cambio de media query.
   */
  private readonly listeners = new Set<(event: MediaQueryListEvent) => void>();

  /**
   * @description Indica si la consulta coincide con el tema oscuro.
   */
  matches: boolean;

  /**
   * @description Media query consultada.
   */
  readonly media = '(prefers-color-scheme: dark)';

  constructor(matches: boolean) {
    this.matches = matches;
  }

  /**
   * @function addEventListener
   * @description Registra un listener de cambio.
   * @param type Tipo de evento.
   * @param listener Callback a ejecutar.
   */
  addEventListener(type: string, listener: (event: MediaQueryListEvent) => void): void {
    if (type === 'change') {
      this.listeners.add(listener);
    }
  }

  /**
   * @function removeEventListener
   * @description Elimina un listener de cambio.
   * @param type Tipo de evento.
   * @param listener Callback a eliminar.
   */
  removeEventListener(type: string, listener: (event: MediaQueryListEvent) => void): void {
    if (type === 'change') {
      this.listeners.delete(listener);
    }
  }

  /**
   * @function dispatch
   * @description Emite un cambio de preferencia del sistema.
   * @param matches Nuevo valor de coincidencia.
   */
  dispatch(matches: boolean): void {
    this.matches = matches;
    const event = { matches, media: this.media } as MediaQueryListEvent;
    this.listeners.forEach((listener) => listener(event));
  }

  /**
   * @function listenerCount
   * @description Cantidad de listeners activos.
   * @returns Número de listeners registrados.
   */
  listenerCount(): number {
    return this.listeners.size;
  }
}

describe('ThemeService', () => {
  let mediaQuery: MockMediaQueryList;
  let originalMatchMedia: typeof window.matchMedia | undefined;

  /**
   * @function createService
   * @description Crea e inicializa el servicio dentro del contexto de inyección.
   * @param systemDark Indica si el sistema inicia en oscuro.
   * @returns Instancia lista para aserciones.
   */
  function createService(systemDark: boolean): ThemeService {
    mediaQuery = new MockMediaQueryList(systemDark);
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: () => mediaQuery,
    });

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: DOCUMENT, useValue: document },
        {
          provide: DestroyRef,
          useValue: {
            onDestroy: () => undefined,
          },
        },
      ],
    });

    const service = TestBed.inject(ThemeService);
    service.initialize();
    return service;
  }

  beforeEach(() => {
    originalMatchMedia = window.matchMedia;
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.colorScheme = '';
  });

  afterEach(() => {
    if (originalMatchMedia) {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        configurable: true,
        value: originalMatchMedia,
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete (window as unknown as { matchMedia?: unknown }).matchMedia;
    }

    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('primera visita con sistema en modo claro inicia en claro y sin preferencia guardada', () => {
    const service = createService(false);

    expect(service.mode()).toBe('auto');
    expect(service.resolvedTheme()).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('primera visita con sistema en modo oscuro inicia en oscuro y sin preferencia guardada', () => {
    const service = createService(true);

    expect(service.mode()).toBe('auto');
    expect(service.resolvedTheme()).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('activa manualmente el modo oscuro y lo persiste', () => {
    const service = createService(false);

    service.toggleDarkMode(true);

    expect(service.mode()).toBe('dark');
    expect(service.resolvedTheme()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('desactiva manualmente el modo oscuro y persiste el claro', () => {
    const service = createService(true);

    service.toggleDarkMode(false);

    expect(service.mode()).toBe('light');
    expect(service.resolvedTheme()).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
  });

  it('persiste la preferencia tras reinicializar (recarga)', () => {
    const first = createService(false);
    first.setTheme('dark');

    const second = createService(false);

    expect(second.mode()).toBe('dark');
    expect(second.resolvedTheme()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');
  });

  it('mantiene la preferencia al navegar (misma instancia de servicio)', () => {
    const service = createService(false);
    service.setTheme('dark');

    expect(service.resolvedTheme()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    service.initialize();
    expect(service.resolvedTheme()).toBe('dark');
    expect(mediaQuery.listenerCount()).toBe(1);
  });

  it('sigue al sistema de claro a oscuro sin preferencia manual', () => {
    const service = createService(false);

    mediaQuery.dispatch(true);

    expect(service.mode()).toBe('auto');
    expect(service.resolvedTheme()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('sigue al sistema de oscuro a claro sin preferencia manual', () => {
    const service = createService(true);

    mediaQuery.dispatch(false);

    expect(service.mode()).toBe('auto');
    expect(service.resolvedTheme()).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('al cambiar el sistema con preferencia manual la elimina y vuelve a automático', () => {
    const service = createService(false);
    service.setTheme('dark');

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark');

    mediaQuery.dispatch(true);

    expect(service.mode()).toBe('auto');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(service.resolvedTheme()).toBe('dark');
  });

  it('tras volver a automático sigue los siguientes cambios del sistema', () => {
    const service = createService(false);
    service.setTheme('dark');

    mediaQuery.dispatch(true);
    expect(service.mode()).toBe('auto');

    mediaQuery.dispatch(false);
    expect(service.resolvedTheme()).toBe('light');
    expect(service.mode()).toBe('auto');
  });

  it('permite un nuevo cambio manual después de regresar al modo automático', () => {
    const service = createService(false);
    service.setTheme('dark');
    mediaQuery.dispatch(true);

    service.toggleDarkMode(false);

    expect(service.mode()).toBe('light');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('light');
    expect(service.resolvedTheme()).toBe('light');
  });

  it('elimina valores inválidos de localStorage y usa modo automático', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'purple');
    const service = createService(true);

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
    expect(service.mode()).toBe('auto');
    expect(service.resolvedTheme()).toBe('dark');
  });

  it('useSystemTheme restaura el tema del sistema y limpia la preferencia', () => {
    const service = createService(true);
    service.setTheme('light');

    service.useSystemTheme();

    expect(service.mode()).toBe('auto');
    expect(service.resolvedTheme()).toBe('dark');
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBeNull();
  });

  it('no registra listeners duplicados al inicializar más de una vez', () => {
    const service = createService(false);
    service.initialize();
    service.initialize();

    expect(mediaQuery.listenerCount()).toBe(1);
  });

  it('puede ejecutarse en contexto de inyección sin errores de consola', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const service = createService(false);
    const injector = TestBed.inject(Injector);

    runInInjectionContext(injector, () => {
      service.toggleDarkMode(true);
      service.useSystemTheme();
      expect(service.isDark()).toBe(false);
    });

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
