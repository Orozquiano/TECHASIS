/**
 * @typedef ThemePreference
 * @description Preferencia manual persistida por el usuario.
 */
export type ThemePreference = 'light' | 'dark';

/**
 * @typedef ThemeMode
 * @description Modo conceptual del tema: automático o selección manual.
 */
export type ThemeMode = 'auto' | ThemePreference;

/**
 * @typedef ResolvedTheme
 * @description Tema efectivo aplicado al documento.
 */
export type ResolvedTheme = ThemePreference;
