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
 * @class DateFieldComponent
 * @description Campo de fecha con calendario propio, en lugar del selector del sistema.
 */
@Component({
  selector: 'app-date-field',
  templateUrl: './date-field.component.html',
  styleUrl: './date-field.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DateFieldComponent),
      multi: true,
    },
  ],
})
export class DateFieldComponent implements ControlValueAccessor {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menu = viewChild<ElementRef<HTMLElement>>('menu');

  /**
   * @description Identificador asociado a la etiqueta del campo.
   */
  readonly inputId = input.required<string>();

  /**
   * @description Texto visible mientras no hay una fecha elegida.
   */
  readonly placeholder = input('dd/mm/aaaa');

  /**
   * @description Nombres cortos de los días, empezando por lunes.
   */
  protected readonly weekdays = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

  /**
   * @description Indica si el calendario está abierto.
   */
  protected readonly open = signal(false);

  /**
   * @description Abre el calendario hacia arriba cuando abajo no cabe.
   */
  protected readonly dropUp = signal(false);

  /**
   * @description Indica si el control está deshabilitado.
   */
  protected readonly disabled = signal(false);

  /**
   * @description Fecha elegida, en formato aaaa-mm-dd.
   */
  private readonly value = signal('');

  /**
   * @description Mes que muestra el calendario.
   */
  protected readonly visibleMonth = signal(this.startOfMonth(new Date()));

  /**
   * @description Fecha elegida con el formato del campo.
   */
  protected readonly label = computed(() => {
    const date = this.parseIso(this.value());
    if (!date) {
      return '';
    }

    return new Intl.DateTimeFormat('es', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  });

  /**
   * @description Título del mes visible.
   */
  protected readonly monthTitle = computed(() => {
    const title = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' }).format(
      this.visibleMonth(),
    );
    return title.charAt(0).toUpperCase() + title.slice(1);
  });

  /**
   * @description Semanas del mes visible, de lunes a domingo.
   */
  protected readonly weeks = computed(() => {
    const first = this.visibleMonth();
    const startOffset = (first.getDay() + 6) % 7;
    const gridStart = new Date(first.getFullYear(), first.getMonth(), 1 - startOffset);
    const weeks: Date[][] = [];

    for (let week = 0; week < 6; week += 1) {
      const days: Date[] = [];
      for (let day = 0; day < 7; day += 1) {
        days.push(new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + week * 7 + day));
      }
      weeks.push(days);
    }

    return weeks;
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
    });
  }

  /**
   * @function writeValue
   * @description Recibe la fecha guardada en el formulario.
   * @param value Fecha en formato aaaa-mm-dd, o vacío.
   */
  writeValue(value: unknown): void {
    const next = value == null ? '' : String(value);
    this.value.set(next);
    const date = this.parseIso(next);
    if (date) {
      this.visibleMonth.set(this.startOfMonth(date));
    }
  }

  /**
   * @function registerOnChange
   * @description Registra el aviso de cambio hacia el formulario.
   * @param fn Función que recibe la fecha elegida.
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
   * @description Abre o cierra el calendario.
   */
  protected toggle(): void {
    if (this.disabled()) {
      return;
    }

    if (!this.open()) {
      const selected = this.parseIso(this.value());
      this.visibleMonth.set(this.startOfMonth(selected ?? new Date()));
    }

    this.open.update((open) => !open);
    this.onTouched();
  }

  /**
   * @function shiftMonth
   * @description Muestra el mes anterior o el siguiente.
   * @param amount Cantidad de meses que se desplaza. Negativo retrocede.
   */
  protected shiftMonth(amount: number): void {
    const current = this.visibleMonth();
    this.visibleMonth.set(new Date(current.getFullYear(), current.getMonth() + amount, 1));
  }

  /**
   * @function choose
   * @description Guarda el día elegido y cierra el calendario.
   * @param date Día seleccionado.
   */
  protected choose(date: Date): void {
    const next = this.toIso(date);
    this.value.set(next);
    this.onChange(next);
    this.open.set(false);
  }

  /**
   * @function chooseToday
   * @description Selecciona la fecha de hoy.
   */
  protected chooseToday(): void {
    this.choose(new Date());
  }

  /**
   * @function dayNumber
   * @description Devuelve el número de día que se muestra en la celda.
   * @param date Día de la cuadrícula.
   * @returns Número del día.
   */
  protected dayNumber(date: Date): number {
    return date.getDate();
  }

  /**
   * @function isOutside
   * @description Indica si el día pertenece a otro mes.
   * @param date Día de la cuadrícula.
   * @returns Verdadero cuando el día está fuera del mes visible.
   */
  protected isOutside(date: Date): boolean {
    return date.getMonth() !== this.visibleMonth().getMonth();
  }

  /**
   * @function isSelected
   * @description Indica si el día coincide con la fecha elegida.
   * @param date Día de la cuadrícula.
   * @returns Verdadero cuando ese día está elegido.
   */
  protected isSelected(date: Date): boolean {
    return this.toIso(date) === this.value();
  }

  /**
   * @function isToday
   * @description Indica si el día es la fecha actual.
   * @param date Día de la cuadrícula.
   * @returns Verdadero cuando el día es hoy.
   */
  protected isToday(date: Date): boolean {
    return this.toIso(date) === this.toIso(new Date());
  }

  /**
   * @function onDocumentClick
   * @description Cierra el calendario al pulsar fuera de él.
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
   * @description Cierra el calendario con la tecla Escape.
   */
  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.open.set(false);
  }

  /**
   * @function startOfMonth
   * @description Obtiene el primer día del mes de una fecha.
   * @param date Fecha de referencia.
   * @returns Primer día de ese mes.
   */
  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * @function toIso
   * @description Convierte una fecha local al formato del formulario.
   * @param date Fecha que se va a convertir.
   * @returns Fecha en formato aaaa-mm-dd.
   */
  private toIso(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  /**
   * @function parseIso
   * @description Interpreta una fecha del formulario sin cambiar de día por la zona horaria.
   * @param value Fecha en formato aaaa-mm-dd.
   * @returns Fecha local, o null si el texto no es válido.
   */
  private parseIso(value: string): Date | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      return null;
    }

    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
