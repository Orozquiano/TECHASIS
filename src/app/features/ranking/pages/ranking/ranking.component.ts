import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { OperationCatalogService } from '../../../../core/operations/operation-catalog.service';
import { buildRanking, formatCop } from '../../../../core/operations/operation.logic';
import { PageHelpComponent } from '../../../../shared/components/page-help/page-help.component';

/**
 * @class RankingComponent
 * @description Ordena técnicos por el dinero registrado en servicios finalizados.
 */
@Component({
  selector: 'app-ranking',
  imports: [PageHelpComponent],
  templateUrl: './ranking.component.html',
})
export class RankingComponent implements OnInit {
  private readonly catalog = inject(OperationCatalogService);

  /**
   * @description Indica la carga inicial.
   */
  protected readonly loading = signal(true);

  /**
   * @description Error visible.
   */
  protected readonly errorMessage = signal<string | null>(null);

  /**
   * @description Fecha inicial del periodo.
   */
  protected readonly desde = signal('');

  /**
   * @description Fecha final del periodo.
   */
  protected readonly hasta = signal('');

  /**
   * @description Filtro opcional de aseguradora.
   */
  protected readonly aseguradora = signal('');

  /**
   * @description Filtro opcional de tipo de servicio.
   */
  protected readonly tipo = signal('');

  /**
   * @description Filtro opcional de estado.
   */
  protected readonly estado = signal('');

  /**
   * @description true cuando no hay endpoint de ranking.
   */
  protected readonly contractPending = this.catalog.contractPending;

  /**
   * @description Aseguradoras disponibles en la vista.
   */
  protected readonly insurers = computed(() => [...new Set(this.catalog.services().map((item) => item.aseguradora))]);

  /**
   * @description Tipos de servicio disponibles en la vista.
   */
  protected readonly types = computed(() => [...new Set(this.catalog.services().map((item) => item.tipoServicio))]);

  /**
   * @description Ranking del periodo, de mayor dinero registrado a menor.
   */
  protected readonly rows = computed(() => {
    const source = this.catalog.services().filter((item) => {
      if (this.aseguradora() && item.aseguradora !== this.aseguradora()) {
        return false;
      }
      if (this.tipo() && item.tipoServicio !== this.tipo()) {
        return false;
      }
      if (this.estado() && item.estado !== this.estado()) {
        return false;
      }
      return true;
    });
    return buildRanking(source, this.desde() || undefined, this.hasta() || undefined);
  });

  /**
   * @function ngOnInit
   * @description Cierra la carga inicial.
   */
  ngOnInit(): void {
    this.loading.set(false);
  }

  /**
   * @function retry
   * @description Limpia el error de la vista.
   */
  protected retry(): void {
    this.errorMessage.set(null);
    this.loading.set(false);
  }

  /**
   * @function money
   * @description Formatea un valor registrado.
   * @param value Monto.
   * @returns Texto en pesos.
   */
  protected money(value: number): string {
    return formatCop(value);
  }

  /**
   * @function onDate
   * @description Actualiza un límite del periodo.
   * @param field Límite que cambia.
   * @param event Evento del campo.
   */
  protected onDate(field: 'desde' | 'hasta', event: Event): void {
    this[field].set((event.target as HTMLInputElement).value);
  }

  /**
   * @function onSelect
   * @description Actualiza un filtro de lista.
   * @param field Filtro que cambia.
   * @param event Evento del selector.
   */
  protected onSelect(field: 'aseguradora' | 'tipo' | 'estado', event: Event): void {
    this[field].set((event.target as HTMLSelectElement).value);
  }
}
