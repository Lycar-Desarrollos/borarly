import { NextRequest, NextResponse } from 'next/server';

const FALLBACK_IMAGE_URL = 'https://placehold.co/600x400.png?text=Sin+Imagen';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.redirect(FALLBACK_IMAGE_URL);
  }

  try {
    let cleanUrl = imageUrl;

    // 1. Limpiar transformaciones reductoras de Cloudflare CDN y solicitar 1200px a 95% de calidad
    if (cleanUrl.includes('/cdn-cgi/image/')) {
      cleanUrl = cleanUrl.replace(/\/cdn-cgi\/image\/[^/]+\//, '/cdn-cgi/image/format=auto,width=1200,quality=95/');
    }

    // 2. Si viene con sufijo de resolución baja (S400, S300, S200), intentar primero la versión Ultra-HD S1000
    if (/S[0-9]{3,4}\.(PNG|JPG|JPEG|webp|png|jpg|jpeg)/i.test(cleanUrl)) {
      const highResUrl = cleanUrl.replace(/S[0-9]{3,4}\.(PNG|JPG|JPEG|webp|png|jpg|jpeg)/i, 'S1000.$1');
      try {
        const highResRes = await fetch(highResUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          },
          next: { revalidate: 86400 }
        });

        if (highResRes.ok) {
          const contentType = highResRes.headers.get('content-type') || 'image/png';
          const buffer = await highResRes.arrayBuffer();
          return new Response(buffer, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          });
        }
      } catch {
        // Fallback a cleanUrl normal
      }
    }

    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
      next: { revalidate: 86400 }
    });

    if (!res.ok) {
      return NextResponse.redirect(FALLBACK_IMAGE_URL);
    }

    const contentType = res.headers.get('content-type') || 'image/png';
    const buffer = await res.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.warn(`ImageProxy error for ${imageUrl}:`, error);
    return NextResponse.redirect(FALLBACK_IMAGE_URL);
  }
}
