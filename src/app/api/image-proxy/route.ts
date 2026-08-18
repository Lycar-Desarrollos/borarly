import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const FALLBACK_IMAGE_URL = 'https://placehold.co/600x400.png?text=Sin+Imagen';

// In-memory cache for ultra-fast repeated loads and preventing Syscom rate limits
interface CachedImage {
  buffer: ArrayBuffer;
  contentType: string;
  expires: number;
}

const memoryCache = new Map<string, CachedImage>();
const MAX_CACHE_SIZE = 1000;
const CACHE_TTL_MS = 1000 * 60 * 60 * 24; // 24 hours in memory
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB: evita que el proxy sirva descargas gigantes

// Hosts internos / rangos privados que nunca deben alcanzarse a traves del proxy (SSRF).
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'localhost.localdomain',
  'metadata',
  'metadata.google.internal',
  '[::1]',
  '::1',
]);

function isBlockedHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, '');

  if (BLOCKED_HOSTNAMES.has(host) || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) {
    return true;
  }

  // IPv6 loopback / link-local / unique-local
  if (host === '::1' || host.startsWith('fe80:') || host.startsWith('fc') || host.startsWith('fd')) {
    return true;
  }

  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipv4) {
    const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
    if (a === 0 || a === 10 || a === 127) return true;                 // this-host, privada, loopback
    if (a === 169 && b === 254) return true;                          // link-local (metadata cloud)
    if (a === 172 && b >= 16 && b <= 31) return true;                 // privada
    if (a === 192 && b === 168) return true;                          // privada
    if (a === 100 && b >= 64 && b <= 127) return true;                // CGNAT
    if (a >= 224) return true;                                        // multicast / reservada
  }

  return false;
}

/**
 * Solo se aceptan URLs http(s) publicas en puertos estandar. Sin esta validacion el
 * endpoint podria usarse para alcanzar servicios internos desde el servidor (SSRF).
 */
function parseSafeImageUrl(rawUrl: string): URL | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
  if (parsed.port && parsed.port !== '80' && parsed.port !== '443') return null;
  if (isBlockedHost(parsed.hostname)) return null;

  return parsed;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.redirect(FALLBACK_IMAGE_URL);
  }

  try {
    const safeUrl = parseSafeImageUrl(imageUrl.trim());
    if (!safeUrl) {
      return NextResponse.redirect(FALLBACK_IMAGE_URL);
    }
    const cleanUrl = safeUrl.toString();

    // 1. Check in-memory cache (instant 0ms response)
    const cached = memoryCache.get(cleanUrl);
    if (cached && Date.now() < cached.expires) {
      return new Response(cached.buffer, {
        status: 200,
        headers: {
          'Content-Type': cached.contentType,
          'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
          'Netlify-CDN-Cache-Control': 'no-store',
          'CDN-Cache-Control': 'no-store',
          'X-Cache': 'HIT',
        },
      });
    }

    // 2. Fetch directly from source with browser headers and timeout
    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': 'https://www.syscom.mx/',
      },
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(5000),
    });

    // La respuesta final tras redirecciones tambien debe ser un destino publico.
    const finalUrl = parseSafeImageUrl(res.url || cleanUrl);
    if (!finalUrl) {
      return NextResponse.redirect(FALLBACK_IMAGE_URL);
    }

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.startsWith('image/')) {
      return NextResponse.redirect(FALLBACK_IMAGE_URL);
    }

    const declaredLength = Number(res.headers.get('content-length') || 0);
    if (declaredLength > MAX_IMAGE_BYTES) {
      return NextResponse.redirect(FALLBACK_IMAGE_URL);
    }

    const buffer = await res.arrayBuffer();
    if (buffer.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.redirect(FALLBACK_IMAGE_URL);
    }

    // 3. Store in memory cache (LRU eviction if limit reached)
    if (memoryCache.size >= MAX_CACHE_SIZE) {
      const firstKey = memoryCache.keys().next().value;
      if (firstKey) memoryCache.delete(firstKey);
    }
    memoryCache.set(cleanUrl, {
      buffer,
      contentType,
      expires: Date.now() + CACHE_TTL_MS,
    });

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=86400',
        'Netlify-CDN-Cache-Control': 'no-store',
        'CDN-Cache-Control': 'no-store',
        'X-Cache': 'MISS',
      },
    });
  } catch (error) {
    console.warn(`ImageProxy error for ${imageUrl}:`, error);
    return NextResponse.redirect(FALLBACK_IMAGE_URL);
  }
}
