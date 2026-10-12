import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import {
  THEME_DATA_ATTRIBUTE,
  THEME_MEDIA_QUERY,
  THEME_STORAGE_KEY,
} from './theme.constants';
import type { ResolvedTheme, ThemeMode, ThemePreference } from './theme.models';

/**
 * @class ThemeService
 * @description Gestiona el tema claro/oscuro de Techasis, la preferencia manual
 * del usuario y la sincronización con prefers-color-scheme del sistema.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  /**
   * @description Identificador de plataforma para evitar acceso a APIs del navegador fuera del cliente.
   */
  private readonly platformId = inject(PLATFORM_ID);

  /**
   * @description Documento HTML donde se aplica el atributo de tema.
   */
  private readonly document = inject(DOCUMENT);

  /**
   * @description Referencia de destrucción para liberar listeners al finalizar el servicio.
   */
  private readonly destroyRef = inject(DestroyRef);

  /**
   * @description Indica si el servicio ya fue inicializado.
   */
  private initialized = false;

  /**
   * @description MediaQueryList activa para prefers-color-scheme.
   */
  private mediaQuery: MediaQueryList | null = null;

  /**
   * @description Listener de cambios del sistema operativo.
   */
  private mediaListener: ((event: MediaQueryListEvent) => void) | null = null;

  /**
   * @description Modo conceptual actual (automático, claro u oscuro).
   */
  private readonly modeState = signal<ThemeMode>('auto');

  /**
   * @description Tema efectivo aplicado al documento.
   */
  private readonly resolvedState = signal<ResolvedTheme>('light');

  /**
   * @description Modo de preferencia expuesto de forma reactiva.
   */
  readonly mode = this.modeState.asReadonly();

  /**
   * @description Tema efectivo expuesto de forma reactiva.
   */
  readonly resolvedTheme = this.resolvedState.asReadonly();

  /**
   * @function initialize
   * @description Inicializa el tema desde almacenamiento o sistema y registra el listener OS.
   */
  initialize(): void {
    if (this.initialized || !isPlatformBrowser(this.platformId)) {
      return;
    }

    this.initialized = true;
    this.mediaQuery = window.matchMedia(THEME_MEDIA_QUERY);

    const stored = this.readStoredPreference();
    if (stored) {
      this.modeState.set(stored);
      this.applyTheme(stored);
    } else {
      this.modeState.set('auto');
      this.applyTheme(this.resolveSystemTheme());
    }

    this.mediaListener = (event: MediaQueryListEvent) => {
      this.onSystemPreferenceChange(event.matches);
    };
    this.mediaQuery.addEventListener('change', this.mediaListener);

    this.destroyRef.onDestroy(() => this.teardown());
  }

  /**
   * @function isDark
   * @description Indica si el tema efectivo actual es oscuro.
   * @returns true cuando el tema aplicado es dark.
   */
  isDark(): boolean {
    return this.resolvedState() === 'dark';
  }

  /**
   * @function isManual
   * @description Indica si existe una preferencia manual activa.
   * @returns true cuando el modo no es automático.
   */
  isManual(): boolean {
    return this.modeState() !== 'auto';
  }

  /**
   * @function setTheme
   * @description Aplica y persiste una preferencia manual de tema.
   * @param preference Tema manual seleccionado por el usuario.
   */
  setTheme(preference: ThemePreference): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.writeStoredPreference(preference);
    this.modeState.set(preference);
    this.applyTheme(preference);
  }

  /**
   * @function toggleDarkMode
   * @description Alterna entre claro y oscuro según el estado del interruptor.
   * @param enabled true para oscuro, false para claro.
   */
  toggleDarkMode(enabled: boolean): void {
    this.setTheme(enabled ? 'dark' : 'light');
  }

  /**
   * @function useSystemTheme
   * @description Elimina la preferencia manual y vuelve al modo automático.
   */
  useSystemTheme(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.clearStoredPreference();
    this.modeState.set('auto');
    this.applyTheme(this.resolveSystemTheme());
  }

  /**
   * @function onSystemPreferenceChange
   * @description Reacciona a un cambio real de prefers-color-scheme.
   * @param prefersDark true cuando el sistema solicita tema oscuro.
   */
  private onSystemPreferenceChange(prefersDark: boolean): void {
    if (this.modeState() !== 'auto') {
      this.clearStoredPreference();
      this.modeState.set('auto');
    }

    this.applyTheme(prefersDark ? 'dark' : 'light');
  }

  /**
   * @function applyTheme
   * @description Escribe el tema efectivo en el documento raíz.
   * @param theme Tema a aplicar.
   */
  private applyTheme(theme: ResolvedTheme): void {
    const root = this.document.documentElement;
    root.setAttribute(THEME_DATA_ATTRIBUTE, theme);
    root.style.colorScheme = theme;
    this.resolvedState.set(theme);
  }

  /**
   * @function resolveSystemTheme
   * @description Obtiene el tema configurado en el sistema operativo.
   * @returns Tema derivado de prefers-color-scheme.
   */
  private resolveSystemTheme(): ResolvedTheme {
    if (!this.mediaQuery) {
      return 'light';
    }

    return this.mediaQuery.matches ? 'dark' : 'light';
  }

  /**
   * @function readStoredPreference
   * @description Lee y valida la preferencia manual desde localStorage.
   * @returns Preferencia válida o null cuando corresponde modo automático.
   */
  private readStoredPreference(): ThemePreference | null {
    try {
      const raw = localStorage.getItem(THEME_STORAGE_KEY);
      if (raw === 'light' || raw === 'dark') {
        return raw;
      }

      if (raw !== null) {
        localStorage.removeItem(THEME_STORAGE_KEY);
      }
    } catch {
      // Almacenamiento no disponible: modo automático.
    }

    return null;
  }

  /**
   * @function writeStoredPreference
   * @description Persiste la preferencia manual del usuario.
   * @param preference Tema manual a guardar.
   */
  private writeStoredPreference(preference: ThemePreference): void {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, preference);
    } catch {
      // Persistencia opcional; el tema en memoria sigue aplicándose.
    }
  }

  /**
   * @function clearStoredPreference
   * @description Elimina la preferencia manual del almacenamiento local.
   */
  private clearStoredPreference(): void {
    try {
      localStorage.removeItem(THEME_STORAGE_KEY);
    } catch {
      // Sin acción si el almacenamiento no está disponible.
    }
  }

  /**
   * @function teardown
   * @description Libera el listener de prefers-color-scheme.
   */
  private teardown(): void {
    if (this.mediaQuery && this.mediaListener) {
      this.mediaQuery.removeEventListener('change', this.mediaListener);
    }

    this.mediaListener = null;
    this.mediaQuery = null;
    this.initialized = false;
  }
}
