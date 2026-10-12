import {
  afterRenderEffect,
  Component,
  computed,
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
 * @class TimeFieldComponent
 * @description Campo de hora con selector propio, en lugar del control del sistema.
 */
@Component({
  selector: 'app-time-field',
  templateUrl: './time-field.component.html',
  styleUrl: './time-field.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimeFieldComponent),
      multi: true,
    },
  ],
})
export class TimeFieldComponent implements ControlValueAccessor {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menu = viewChild<ElementRef<HTMLElement>>('menu');

  /**
   * @description Identificador asociado a la etiqueta del campo.
   */
  readonly inputId = input.required<string>();

  /**
   * @description Texto visible mientras no hay una hora elegida.
   */
  readonly placeholder = input('--:--');

  /**
   * @description Horas del día, de 00 a 23.
   */
  protected readonly hours = Array.from({ length: 24 }, (_, hour) => this.pad(hour));

  /**
   * @description Indica si el selector está abierto.
   */
  protected readonly open = signal(false);

  /**
   * @description Abre el selector hacia arriba cuando abajo no cabe.
   */
  protected readonly dropUp = signal(false);

  /**
   * @description Indica si el control está deshabilitado.
   */
  protected readonly disabled = signal(false);

  /**
   * @description Hora elegida, en formato hh:mm.
   */
  private readonly value = signal('');

  /**
   * @description Hora visible en el campo.
   */
  protected readonly label = computed(() => this.value());

  /**
   * @description Hora y minutos ya guardados.
   */
  protected readonly parts = computed(() => this.parse(this.value()));

  /**
   * @description Minutos en intervalos de cinco, más el minuto guardado si no coincide.
   */
  protected readonly minutes = computed(() => {
    const steps = Array.from({ length: 12 }, (_, index) => this.pad(index * 5));
    const current = this.parts().minute;
    if (current && !steps.includes(current)) {
      steps.push(current);
      steps.sort();
    }

    return steps;
  });

  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor() {
    afterRenderEffect(() => {
      if (!this.open()) {
        this.dropUp.set(false);
        return;
      }

      const trigger = this.trigger()?.nativeElement;
      const menu = this.menu()?.nativeElement;
      if (!trigger || !menu) {
        return;
      }

      const rect = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      this.dropUp.set(spaceBelow < menu.offsetHeight + 12 && rect.top > spaceBelow);
      menu.querySelectorAll('.is-selected').forEach((selected) => {
        const column = selected.parentElement;
        if (!(selected instanceof HTMLElement) || !column) {
          return;
        }

        column.scrollTop = selected.offsetTop - column.clientHeight / 2 + selected.offsetHeight / 2;
      });
    });
  }

  /**
   * @function writeValue
   * @description Recibe la hora guardada en el formulario.
   * @param value Hora en formato hh:mm, o vacío.
   */
  writeValue(value: unknown): void {
    const parsed = this.parse(value == null ? '' : String(value));
    this.value.set(parsed.hour && parsed.minute ? `${parsed.hour}:${parsed.minute}` : '');
  }

  /**
   * @function registerOnChange
   * @description Registra el aviso de cambio hacia el formulario.
   * @param fn Función que recibe la hora elegida.
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
      this.open.set(false);
    }
  }

  /**
   * @function toggle
   * @description Abre o cierra el selector de hora.
   */
  protected toggle(): void {
    if (this.disabled()) {
      return;
    }

    this.open.update((open) => !open);
    this.onTouched();
  }

  /**
   * @function pickHour
   * @description Guarda la hora y mantiene el selector abierto para elegir los minutos.
   * @param hour Hora en dos dígitos.
   */
  protected pickHour(hour: string): void {
    this.commit(hour, this.parts().minute || '00');
  }

  /**
   * @function pickMinute
   * @description Guarda los minutos y cierra el selector.
   * @param minute Minutos en dos dígitos.
   */
  protected pickMinute(minute: string): void {
    this.commit(this.parts().hour || this.pad(new Date().getHours()), minute);
    this.open.set(false);
  }

  /**
   * @function chooseNow
   * @description Selecciona la hora actual.
   */
  protected chooseNow(): void {
    const now = new Date();
    this.commit(this.pad(now.getHours()), this.pad(now.getMinutes()));
    this.open.set(false);
  }

  /**
   * @function onDocumentClick
   * @description Cierra el selector al pulsar fuera de él.
   * @param event Evento de puntero en el documento.
   */
  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    if (!this.open() || this.host.nativeElement.contains(event.target as Node)) {
      return;
    }

    this.open.set(false);
  }

  /**
   * @function onEscape
   * @description Cierra el selector con la tecla Escape.
   */
  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.open.set(false);
  }

  /**
   * @function commit
   * @description Guarda una hora completa en el formulario.
   * @param hour Hora en dos dígitos.
   * @param minute Minutos en dos dígitos.
   */
  private commit(hour: string, minute: string): void {
    const next = `${hour}:${minute}`;
    this.value.set(next);
    this.onChange(next);
  }

  /**
   * @function parse
   * @description Interpreta una hora del formulario.
   * @param value Texto en formato hh:mm.
   * @returns Hora y minutos, o cadenas vacías si el texto no es válido.
   */
  private parse(value: string): { hour: string; minute: string } {
    const match = /^(\d{2}):(\d{2})/.exec(value);
    if (!match) {
      return { hour: '', minute: '' };
    }

    const hour = Number(match[1]);
    const minute = Number(match[2]);
    if (hour > 23 || minute > 59) {
      return { hour: '', minute: '' };
    }

    return { hour: match[1], minute: match[2] };
  }

  /**
   * @function pad
   * @description Escribe un número con dos dígitos.
   * @param value Número que se va a mostrar.
   * @returns Texto de dos dígitos.
   */
  private pad(value: number): string {
    return String(value).padStart(2, '0');
  }
}
