/**
 * @description Curva principal de salida (sensación moderna tipo dashboard).
 */
export const MOTION_EASE_OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';

/**
 * @description Curva de deceleración material para entradas de cromo.
 */
export const MOTION_EASE_DECEL = 'cubic-bezier(0.4, 0, 0.2, 1)';

/**
 * @description Duración de salida de página en milisegundos.
 */
export const MOTION_PAGE_EXIT_MS = 220;

/**
 * @description Duración de entrada de página en milisegundos.
 */
export const MOTION_PAGE_ENTER_MS = 340;

/**
 * @description Duración de entrada de bloques/tarjetas en milisegundos.
 */
export const MOTION_ENTER_MS = 450;

/**
 * @description Separación entre elementos en un stagger.
 */
export const MOTION_STAGGER_MS = 80;

/**
 * @description Keyframes de entrada: fade + escala + subida suave.
 */
export const MOTION_RISE_KEYFRAMES: Keyframe[] = [
  { opacity: 0, transform: 'translate3d(0, 18px, 0) scale(0.96)' },
  { opacity: 1, transform: 'translate3d(0, 0, 0) scale(1)' },
];

/**
 * @function prefersReducedMotion
 * @description Indica si el usuario pidió reducir movimiento.
 * @returns true cuando aplica prefers-reduced-motion.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
