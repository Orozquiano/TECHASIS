/**
 * @interface PersonName
 * @description Partes del nombre de una persona. Cualquiera puede llegar vacía o nula.
 */
export interface PersonName {
  /**
   * @description Primer nombre.
   */
  primerNombre: string | null;

  /**
   * @description Segundo nombre. Puede no existir.
   */
  segundoNombre: string | null;

  /**
   * @description Primer apellido.
   */
  primerApellido: string | null;

  /**
   * @description Segundo apellido. Puede no existir.
   */
  segundoApellido: string | null;
}

/**
 * @function formatPersonName
 * @description Une las partes del nombre en el orden primer nombre, segundo nombre,
 * primer apellido y segundo apellido. Omite las que llegan nulas o en blanco.
 * @param person Partes del nombre.
 * @returns Nombre visible, o cadena vacía si ninguna parte tiene texto.
 */
export function formatPersonName(person: PersonName): string {
  return [person.primerNombre, person.segundoNombre, person.primerApellido, person.segundoApellido]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .join(' ');
}
