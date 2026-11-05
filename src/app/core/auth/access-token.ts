/**
 * @function encodeBase64Url
 * @description Codifica texto en base64 url-safe para armar un JWT de demostración.
 * @param value Texto de origen.
 * @returns Segmento base64 url-safe.
 */
function encodeBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

/**
 * @function decodeBase64Url
 * @description Decodifica un segmento base64 url-safe.
 * @param value Segmento del token.
 * @returns Texto original.
 */
function decodeBase64Url(value: string): string {
  const padded = value.replaceAll('-', '+').replaceAll('_', '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/**
 * @function buildDemoAccessToken
 * @description Arma un JWT no firmado para el modo demo, con fecha de expiración.
 * @param expiresInSeconds Vigencia en segundos.
 * @param claims Datos adicionales del payload.
 * @returns Token con tres segmentos.
 */
export function buildDemoAccessToken(
  expiresInSeconds: number,
  claims: Record<string, string | number> = {},
): string {
  const header = encodeBase64Url(JSON.stringify({ alg: 'none', typ: 'JWT' }));
  const payload = encodeBase64Url(
    JSON.stringify({
      exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
      ...claims,
    }),
  );
  return `${header}.${payload}.demo`;
}

/**
 * @function readTokenExpiry
 * @description Lee la expiración de un JWT sin verificar la firma.
 * @param token Token de acceso.
 * @returns Instante de expiración en milisegundos, o null si el token no es utilizable.
 */
export function readTokenExpiry(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    return null;
  }

  try {
    const payload = JSON.parse(decodeBase64Url(parts[1])) as { exp?: unknown };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * @function isUsableAccessToken
 * @description Comprueba que el token tenga forma de JWT y no esté vencido.
 * @param token Texto guardado como token. Puede no serlo.
 * @param now Instante de referencia en milisegundos.
 * @returns true cuando el token todavía puede autorizar peticiones.
 */
export function isUsableAccessToken(token: string | null, now = Date.now()): boolean {
  if (!token) {
    return false;
  }

  const expiry = readTokenExpiry(token);
  return expiry !== null && expiry > now;
}
