import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

/**
 * @function stubMatchMedia
 * @description Provee un matchMedia mínimo para el entorno de pruebas jsdom.
 * @param matches Indica si el sistema prefiere tema oscuro.
 */
function stubMatchMedia(matches = false): void {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: () => ({
      matches,
      media: '(prefers-color-scheme: dark)',
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
    }),
  });
}

describe('App', () => {
  beforeEach(async () => {
    stubMatchMedia(false);
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
