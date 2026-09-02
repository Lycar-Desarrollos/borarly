// Hosts que estan declarados en `next.config.ts` y por lo tanto puede optimizar next/image
// directamente. Cualquier otro origen (URLs pegadas a mano en el panel de administracion)
// se sirve a traves de /api/image-proxy, que valida el destino antes de descargarlo.
const DIRECTLY_ALLOWED_HOSTS = [
  'placehold.co',
  'firebasestorage.googleapis.com',
  'shop.pchconnect.com',
  'www.pchmayoreo.com',
  'lh3.googleusercontent.com',
];

/**
 * Devuelve una URL segura para usar como `src` de next/image sin depender de un
 * comodin `**` en remotePatterns.
 */
export function safeImageSrc(url?: string | null, fallback = 'https://placehold.co/600x400.png?text=Sin+Imagen'): string {
  const raw = (url || '').trim();
  if (!raw) return fallback;

  // Rutas locales, data URIs y previsualizaciones locales (blob:) no necesitan tratamiento.
  if (raw.startsWith('/') || raw.startsWith('data:') || raw.startsWith('blob:')) return raw;

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return fallback;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return fallback;

  const host = parsed.hostname.toLowerCase();
  if (DIRECTLY_ALLOWED_HOSTS.includes(host) || host === 'syscom.mx' || host.endsWith('.syscom.mx')) {
    return raw;
  }

  return `/api/image-proxy?url=${encodeURIComponent(raw)}`;
}
