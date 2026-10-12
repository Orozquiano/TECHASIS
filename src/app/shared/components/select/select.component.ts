import {
  afterEveryRender,
  afterRenderEffect,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  forwardRef,
  HostListener,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/**
 * @interface SelectOption
 * @description Opción visible de una lista desplegable.
 */
export interface SelectOption {
  /**
   * @description Valor que se guarda en el formulario.
   */
  value: string;

  /**
   * @description Texto que ve la persona.
   */
  label: string;
}

/**
 * @class SelectComponent
 * @description Lista desplegable del formulario. El texto de ayuda solo se muestra con el control cerrado.
 */
@Component({
  selector: 'app-select',
  templateUrl: './select.component.html',
  styleUrl: './select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
})
export class SelectComponent implements ControlValueAccessor {
  private static readonly opened = new Set<SelectComponent>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menu = viewChild<ElementRef<HTMLElement>>('menu');
  private menuHome: HTMLElement | null = null;
  private floatingMenu: HTMLElement | null = null;

  /**
   * @description Identificador asociado a la etiqueta del campo.
   */
  readonly inputId = input.required<string>();

  /**
   * @description Texto visible mientras no hay una opción elegida.
   */
  readonly placeholder = input('— Selecciona —');

  /**
   * @description Opciones que se pueden elegir.
   */
  readonly options = input<SelectOption[]>([]);

  /**
   * @description Indica si la lista está abierta.
   */
  protected readonly open = signal(false);

  /**
   * @description Indica si el control está deshabilitado.
   */
  protected readonly disabled = signal(false);

  /**
   * @description Valor actual del formulario.
   */
  private readonly value = signal('');

  /**
   * @description Texto de la opción elegida.
   */
  protected readonly selectedLabel = computed(
    () => this.options().find((option) => option.value === this.value())?.label ?? '',
  );

  /**
   * @description Opciones reales, sin la entrada vacía de ayuda.
   */
  protected readonly choices = computed(() => this.options().filter((option) => option.value !== ''));

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    const reposition = (event: Event) => {
      const menu = this.menu()?.nativeElement;
      if (menu && event.target instanceof Node && menu.contains(event.target)) {
        return;
      }

      this.placeMenu();
    };

    const closeIfOutside = (event: MouseEvent) => {
      if (!this.open()) {
        return;
      }

      const target = event.target as Node;
      const menu = this.floatingMenu ?? this.menu()?.nativeElement ?? null;
      if (this.host.nativeElement.contains(target) || menu?.contains(target)) {
        return;
      }

      this.closeMenu();
    };

    document.addEventListener('scroll', reposition, true);
    document.addEventListener('click', closeIfOutside, true);
    window.addEventListener('resize', reposition);
    this.destroyRef.onDestroy(() => {
      SelectComponent.opened.delete(this);
      this.floatingMenu?.remove();
      this.floatingMenu = null;
      document.removeEventListener('scroll', reposition, true);
      document.removeEventListener('click', closeIfOutside, true);
      window.removeEventListener('resize', reposition);
    });

    afterRenderEffect(() => {
      if (!this.open()) {
        return;
      }

      this.placeMenu();
    });

    afterEveryRender(() => {
      if (!this.open()) {
        return;
      }

      const trigger = this.trigger()?.nativeElement;
      if (trigger?.isConnected) {
        return;
      }

      this.discardMenu();
    });
  }

  /**
   * @function writeValue
   * @description Recibe el valor que guarda el formulario.
   * @param value Valor actual. Puede llegar vacío.
   */
  writeValue(value: unknown): void {
    this.value.set(value == null ? '' : String(value));
  }

  /**
   * @function registerOnChange
   * @description Registra el aviso de cambio hacia el formulario.
   * @param fn Función que recibe el nuevo valor.
   */
  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  /**
   * @function registerOnTouched
   * @description Registra el aviso de que la persona interactuó con el control.
   * @param fn Función de aviso.
   */
  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  /**
   * @function setDisabledState
   * @description Activa o desactiva el control desde el formulario.
   * @param isDisabled Indica si el control debe quedar inactivo.
   */
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    if (isDisabled) {
      this.closeMenu();
    }
  }

  /**
   * @function toggle
   * @description Abre o cierra la lista.
   */
  protected toggle(): void {
    if (this.disabled()) {
      return;
    }

    if (this.open()) {
      this.closeMenu();
    } else {
      this.openMenu();
    }

    this.onTouched();
  }

  /**
   * @function choose
   * @description Guarda la opción elegida y cierra la lista.
   * @param value Valor de la opción.
   */
  protected choose(value: string): void {
    this.value.set(value);
    this.onChange(value);
    this.closeMenu();
  }

  /**
   * @function isSelected
   * @description Indica si una opción coincide con el valor actual.
   * @param value Valor de la opción.
   * @returns Verdadero cuando esa opción está elegida.
   */
  protected isSelected(value: string): boolean {
    return this.value() === value;
  }

  /**
   * @function onEscape
   * @description Cierra la lista con la tecla Escape.
   */
  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.closeMenu();
  }

  /**
   * @function openMenu
   * @description Abre esta lista y cierra cualquier otra que siga visible.
   */
  private openMenu(): void {
    for (const other of SelectComponent.opened) {
      if (other !== this) {
        other.closeMenu();
      }
    }

    SelectComponent.opened.add(this);
    this.open.set(true);
  }

  /**
   * @function closeMenu
   * @description Devuelve la lista al control y la cierra.
   */
  private closeMenu(): void {
    SelectComponent.opened.delete(this);
    this.restoreMenu();
    this.floatingMenu = null;
    this.open.set(false);
  }

  /**
   * @function discardMenu
   * @description Quita la lista del documento cuando el control ya no está en pantalla.
   */
  private discardMenu(): void {
    SelectComponent.opened.delete(this);
    this.floatingMenu?.remove();
    this.floatingMenu = null;
    this.open.set(false);
  }

  /**
   * @function restoreMenu
   * @description Regresa la lista a su lugar antes de que Angular la retire.
   */
  private restoreMenu(): void {
    const menu = this.menu()?.nativeElement;
    if (!menu || !this.menuHome || menu.parentElement === this.menuHome) {
      return;
    }

    this.menuHome.appendChild(menu);
  }

  /**
   * @function placeMenu
   * @description Saca la lista del popup y la alinea debajo del control.
   */
  private placeMenu(): void {
    const trigger = this.trigger()?.nativeElement;
    const menu = this.menu()?.nativeElement;
    if (!this.open() || !trigger || !menu) {
      return;
    }

    if (!this.menuHome) {
      this.menuHome = menu.parentElement;
    }

    if (menu.parentElement !== document.body) {
      document.body.appendChild(menu);
    }

    this.floatingMenu = menu;

    const rect = trigger.getBoundingClientRect();
    const menuHeight = menu.offsetHeight || 280;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUp = spaceBelow < menuHeight + 12 && rect.top > spaceBelow;
    let left = rect.left;

    if (left + rect.width > window.innerWidth - 12) {
      left = Math.max(12, window.innerWidth - 12 - rect.width);
    }

    menu.style.left = `${left}px`;
    menu.style.width = `${rect.width}px`;

    if (openUp) {
      menu.style.top = 'auto';
      menu.style.bottom = `${window.innerHeight - rect.top + 6}px`;
      return;
    }

    menu.style.bottom = 'auto';
    menu.style.top = `${rect.bottom + 6}px`;
  }
}
