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

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.redirect(FALLBACK_IMAGE_URL);
  }

  try {
    let cleanUrl = imageUrl.trim();

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      return NextResponse.redirect(FALLBACK_IMAGE_URL);
    }

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
      signal: AbortSignal.timeout(5000),
    });

    const contentType = res.headers.get('content-type') || '';
    if (!res.ok || !contentType.startsWith('image/')) {
      return NextResponse.redirect(FALLBACK_IMAGE_URL);
    }

    const buffer = await res.arrayBuffer();

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
