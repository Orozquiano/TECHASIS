import { Injectable, inject, signal } from '@angular/core';
import { APP_ENVIRONMENT } from '../config/app-environment';
import type { ConciliationMatch, CustodyRecord, ServiceRecord } from '../models/operation.model';
import { DEMO_CUSTODIES, DEMO_SERVICES } from './demo-operations';

/**
 * @class OperationCatalogService
 * @description Mantiene la vista operativa en memoria.
 * En demo usa datos simulados. Fuera de demo no llama endpoints que no existen.
 */
@Injectable({ providedIn: 'root' })
export class OperationCatalogService {
  private readonly env = inject(APP_ENVIRONMENT);
  private nextId = 200;

  /**
   * @description true cuando el ambiente real no tiene contrato para estas operaciones.
   */
  readonly contractPending = !this.env.useMockApi;

  /**
   * @description Servicios visibles para las pantallas operativas.
   */
  readonly services = signal<ServiceRecord[]>(
    this.env.useMockApi ? DEMO_SERVICES.map((item) => ({ ...item, evidencias: [...item.evidencias] })) : [],
  );

  /**
   * @description Custodias visibles para la pantalla de wachen.
   */
  readonly custodias = signal<CustodyRecord[]>(
    this.env.useMockApi
      ? DEMO_CUSTODIES.map((item) => ({
          ...item,
          historialReingresos: item.historialReingresos.map((stay) => ({ ...stay })),
        }))
      : [],
  );

  /**
   * @function addDemoService
   * @description Agrega un servicio solo en modo demo.
   * @param draft Datos básicos capturados en el formulario.
   * @returns Servicio creado o null cuando el contrato sigue pendiente.
   */
  addDemoService(draft: Omit<ServiceRecord, 'id' | 'registro'>): ServiceRecord | null {
    if (this.contractPending) {
      return null;
    }

    this.nextId += 1;
    const created: ServiceRecord = {
      ...draft,
      id: this.nextId,
      registro: `SR-${this.nextId}`,
    };
    this.services.update((items) => [created, ...items]);
    return created;
  }

  /**
   * @function updateDemoService
   * @description Actualiza un servicio solo en modo demo.
   * @param id Identificador local del servicio.
   * @param patch Campos que cambian.
   * @returns true cuando la vista demo quedó actualizada.
   */
  updateDemoService(id: number, patch: Partial<ServiceRecord>): boolean {
    if (this.contractPending) {
      return false;
    }

    let updated = false;
    this.services.update((items) =>
      items.map((item) => {
        if (item.id !== id) {
          return item;
        }

        updated = true;
        return { ...item, ...patch, id: item.id, registro: item.registro };
      }),
    );
    return updated;
  }

  /**
   * @function applyDemoInvoices
   * @description Asigna números de factura en la vista demo, solo a autorizaciones encontradas.
   * No cambia filas que no cruzaron. Fuera de demo no hace ninguna petición.
   * @param matches Cruces ya confirmados por el usuario.
   * @returns Cantidad de servicios actualizados.
   */
  applyDemoInvoices(matches: ConciliationMatch[]): number {
    if (this.contractPending) {
      return 0;
    }

    const found = matches.filter((match) => match.encontrada);
    let updated = 0;

    this.services.update((items) =>
      items.map((item) => {
        const match = found.find((candidate) => candidate.autorizacion === item.autorizacion);
        if (!match) {
          return item;
        }

        updated += 1;
        return { ...item, numFactura: match.factura };
      }),
    );

    return updated;
  }

  /**
   * @function addDemoCustody
   * @description Registra una custodia solo en modo demo.
   * @param draft Datos estructurados de la custodia, con valor numérico.
   * @returns Custodia creada o null cuando el contrato sigue pendiente.
   */
  addDemoCustody(draft: Omit<CustodyRecord, 'id'>): CustodyRecord | null {
    if (this.contractPending) {
      return null;
    }

    this.nextId += 1;
    const created: CustodyRecord = { ...draft, id: this.nextId };
    this.custodias.update((items) => [created, ...items]);
    return created;
  }
}
