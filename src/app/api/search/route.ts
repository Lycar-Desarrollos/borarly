import { NextRequest, NextResponse } from 'next/server';
import { getProducts, getProductById } from '@/services/productService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') || '').trim();
  const categoryId = (searchParams.get('category') || '').trim();
  const marca = (searchParams.get('marca') || '').trim();
  const isAi = searchParams.get('ai') === 'true';

  if (!q && !categoryId && !marca) {
    return NextResponse.json({ results: [], total: 0 });
  }

  try {
    // 1. Si la consulta parece un SKU/ID numérico directo o modelo exacto, intentar lookup directo primero
    if (q && /^\d{5,7}$/.test(q)) {
      const exactProduct = await getProductById(q);
      if (exactProduct) {
        return NextResponse.json({
          results: [exactProduct],
          total: 1,
          isExactMatch: true
        });
      }
    }

    // 2. Búsqueda con IA si isAi está activo o es una consulta en lenguaje natural
    let products: any[] = [];
    if (isAi && q) {
      const { searchProductsAI } = await import('@/services/productService');
      const aiResponse = await searchProductsAI(q);
      products = aiResponse.productos || [];
    }

    // Si no hay productos de IA o no es modo IA, usar búsqueda estándar
    if (products.length === 0) {
      products = await getProducts(categoryId || undefined, q || undefined, 12, marca || undefined);
    }

    // 3. Ordenar por relevancia: coincidencias exactas de modelo al inicio
    const normalizedQ = q.toLowerCase();
    const sorted = [...products].sort((a, b) => {
      const aModelMatch = (a.line || '').toLowerCase().includes(normalizedQ);
      const bModelMatch = (b.line || '').toLowerCase().includes(normalizedQ);
      if (aModelMatch && !bModelMatch) return -1;
      if (!aModelMatch && bModelMatch) return 1;
      // Desempate: con existencia primero
      const aStock = (a.stock ?? 0) > 0 ? 1 : 0;
      const bStock = (b.stock ?? 0) > 0 ? 1 : 0;
      return bStock - aStock;
    });

    const debug = searchParams.get('debug') === '1';
    let diag: string | undefined;
    if (debug) {
      const { getLastSyscomDiag } = await import('@/services/syscom');
      diag = getLastSyscomDiag();
    }

    return NextResponse.json({
      results: sorted,
      total: sorted.length,
      isAi: isAi,
      ...(debug ? { diag } : {})
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ results: [], total: 0, error: 'Error en la búsqueda' }, { status: 500 });
  }
}
