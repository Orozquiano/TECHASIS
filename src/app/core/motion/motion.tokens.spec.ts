import {
  MOTION_ENTER_MS,
  MOTION_PAGE_ENTER_MS,
  MOTION_PAGE_EXIT_MS,
  MOTION_RISE_KEYFRAMES,
  MOTION_STAGGER_MS,
  prefersReducedMotion,
} from './motion.tokens';

describe('motion.tokens', () => {
  it('expone tiempos coherentes con el sistema de animación moderna', () => {
    expect(MOTION_PAGE_EXIT_MS).toBeLessThan(MOTION_PAGE_ENTER_MS);
    expect(MOTION_STAGGER_MS).toBeGreaterThan(0);
    expect(MOTION_ENTER_MS).toBeGreaterThan(MOTION_PAGE_ENTER_MS - 50);
  });

  it('define keyframes de entrada con fade y escala', () => {
    expect(MOTION_RISE_KEYFRAMES.length).toBe(2);
    expect(MOTION_RISE_KEYFRAMES[0]?.['opacity']).toBe(0);
    expect(MOTION_RISE_KEYFRAMES[1]?.['opacity']).toBe(1);
  });

  it('prefersReducedMotion no lanza error en el entorno de prueba', () => {
    expect(() => prefersReducedMotion()).not.toThrow();
  });
});
