import { Component, inject, signal } from '@angular/core';
import type { ConciliationDraft, ConciliationMatch } from '../../../../core/models';
import { OperationCatalogService } from '../../../../core/operations/operation-catalog.service';
import {
  conciliationResultCsv,
  matchAuthorizations,
  parseConciliationFile,
} from '../../../../core/operations/operation.logic';
import { PageHelpComponent } from '../../../../shared/components/page-help/page-help.component';

/**
 * @class ConciliationsComponent
 * @description Valida un archivo de autorizaciones y facturas, muestra el cruce y solo asigna en demo.
 */
@Component({
  selector: 'app-conciliations',
  imports: [PageHelpComponent],
  templateUrl: './conciliations.component.html',
})
export class ConciliationsComponent {
  private readonly catalog = inject(OperationCatalogService);

  /**
   * @description Error de lectura o de estructura.
   */
  protected readonly errorMessage = signal<string | null>(null);

  /**
   * @description Resultado visible de la asignación.
   */
  protected readonly infoMessage = signal<string | null>(null);

  /**
   * @description Nombre del archivo elegido.
   */
  protected readonly fileName = signal('');

  /**
   * @description Borrador validado. Null antes de leer un archivo.
   */
  protected readonly draft = signal<ConciliationDraft | null>(null);

  /**
   * @description Cruce contra los servicios de la vista.
   */
  protected readonly matches = signal<ConciliationMatch[]>([]);

  /**
   * @description true cuando el usuario debe confirmar antes de asignar.
   */
  protected readonly confirming = signal(false);

  /**
   * @description Evita procesar dos veces el mismo archivo.
   */
  protected readonly busy = signal(false);

  /**
   * @description true cuando no hay endpoint para persistir la conciliación.
   */
  protected readonly contractPending = this.catalog.contractPending;

  /**
   * @function onFile
   * @description Lee un CSV o TXT y lo valida antes de cruzarlo.
   * @param event Cambio del input de archivo.
   */
  protected onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.errorMessage.set(null);
    this.infoMessage.set(null);
    this.confirming.set(false);
    this.matches.set([]);
    this.draft.set(null);

    if (!file) {
      return;
    }

    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension !== 'csv' && extension !== 'txt') {
      this.errorMessage.set('El archivo debe ser .csv o .txt.');
      input.value = '';
      return;
    }

    this.fileName.set(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      const parsed = parseConciliationFile(content);
      this.draft.set(parsed);

      if (!parsed.valido) {
        this.errorMessage.set('No se procesó el archivo porque faltan columnas obligatorias.');
        return;
      }

      this.matches.set(matchAuthorizations(parsed.filas, this.catalog.services()));
    };
    reader.onerror = () => {
      this.errorMessage.set('No se pudo leer el archivo.');
    };
    reader.readAsText(file);
  }

  /**
   * @function askApply
   * @description Pide confirmación antes de asignar facturas.
   */
  protected askApply(): void {
    if (!this.draft()?.valido || this.matches().length === 0) {
      return;
    }
    this.confirming.set(true);
  }

  /**
   * @function apply
   * @description Asigna facturas en demo o informa que el contrato no existe.
   */
  protected apply(): void {
    if (this.busy()) {
      return;
    }

    const parsed = this.draft();
    if (!parsed?.valido) {
      this.errorMessage.set('No se procesó el archivo porque faltan columnas obligatorias.');
      return;
    }

    this.busy.set(true);
    if (this.contractPending) {
      this.infoMessage.set('Contrato pendiente: ninguna factura se escribió en el backend.');
      this.confirming.set(false);
      this.busy.set(false);
      return;
    }

    const updated = this.catalog.applyDemoInvoices(this.matches());
    const missing = this.matches().filter((match) => !match.encontrada).length;
    this.infoMessage.set(
      `Simulación: ${updated} factura(s) asignadas. ${missing} autorización(es) no encontradas. ${parsed.duplicados.length} duplicada(s) y ${parsed.invalidas.length} inválida(s) quedaron fuera.`,
    );
    this.confirming.set(false);
    this.busy.set(false);
  }

  /**
   * @function download
   * @description Descarga el resultado de la vista previa sin llamar al backend.
   */
  protected download(): void {
    const parsed = this.draft();
    if (!parsed) {
      return;
    }

    const csv = conciliationResultCsv(this.matches(), parsed.duplicados, parsed.invalidas);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resultado-conciliacion.csv';
    link.click();
    URL.revokeObjectURL(url);
  }
}
