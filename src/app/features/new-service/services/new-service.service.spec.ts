import { HttpErrorResponse } from '@angular/common/http';
import { HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FormBuilder, Validators } from '@angular/forms';
import { ContractPendingError, messageFromHttpError } from '../../../core/http/api-error';
import { envelope, httpProviders, realHttpEnvironment } from '../../../core/http/http-test.helpers';
import { requiresManualValue } from '../../../core/operations/operation.logic';
import { NewServiceService } from './new-service.service';

describe('NewServiceService', () => {
  let http: HttpTestingController;
  let service: NewServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: httpProviders(realHttpEnvironment) });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(NewServiceService);
  });

  afterEach(() => http.verify());

  it('muestra el 409 de tarifas sin reemplazarlo por catálogos vacíos', () => {
    let text = '';
    let status = 0;
    service.getServiceInitData().subscribe({
      error: (error: unknown) => {
        status = error instanceof HttpErrorResponse ? error.status : 0;
        text = messageFromHttpError(error, 'No se pudieron cargar los parámetros iniciales del servicio.');
      },
    });

    http.expectOne('/api/servicio/parametros-administracion').flush(
      envelope(null, {
        success: false,
        showsMessage: true,
        message: 'Las tarifas base no están configuradas o se encuentran inactivas. Comunícate con el administrador.',
        errorCode: '409',
      }),
      { status: 409, statusText: 'Conflict' },
    );

    expect(status).toBe(409);
    expect(text).toContain('Las tarifas base no están configuradas');
  });

  it('no envía el guardado porque el contrato está pendiente', () => {
    let pending = false;
    service.saveService().subscribe({
      error: (error: unknown) => {
        pending = error instanceof ContractPendingError;
      },
    });
    http.expectNone(() => true);
    expect(pending).toBe(true);
  });
});

describe('validadores OTRO', () => {
  const fb = new FormBuilder();

  /**
   * @function applyManual
   * @description Reproduce la regla condicional del formulario de nuevo servicio.
   * @param selected Valor del catálogo.
   * @returns Control manual ya validado.
   */
  function applyManual(selected: string) {
    const form = fb.group({
      catalogo: [selected],
      manual: [''],
    });
    const manual = form.controls.manual;
    if (requiresManualValue(selected)) {
      manual.setValidators([Validators.required]);
    } else {
      manual.clearValidators();
    }
    manual.updateValueAndValidity();
    return manual;
  }

  it('exige el campo manual solo cuando el catálogo es OTRO', () => {
    expect(applyManual('OTRO').invalid).toBe(true);
    expect(applyManual('OTRO (Pegar número)').invalid).toBe(true);
    expect(applyManual('3001112233').valid).toBe(true);
  });
});
