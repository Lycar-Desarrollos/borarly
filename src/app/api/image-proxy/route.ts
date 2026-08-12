import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const FALLBACK_IMAGE_URL = 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=800&auto=format&fit=crop';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.redirect(FALLBACK_IMAGE_URL);
  }

  // Si no es un enlace de Syscom o FTP, redirigir directamente
  if (!imageUrl.includes('syscom.mx')) {
    return NextResponse.redirect(imageUrl);
  }

  try {
    const cleanUrl = imageUrl.replace('ftp3.syscom.mx/cdn-cgi/image/format=webp,width=300,height=300/', 'ftp3.syscom.mx/');
    
    const res = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
      next: { revalidate: 86400 } // Cache 24 horas
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
