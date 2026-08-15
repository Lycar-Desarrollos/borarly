/**
 * @fileOverview API Route: Generador de archivo XLSX para carga masiva en Mercado Libre México
 * 
 * GET /api/ml-export
 * - Obtiene TODAS las categorías dinámicamente de Syscom (ya no hardcodeadas)
 * - Obtiene productos con stock en Mérida
 * - Los transforma al formato requerido por ML para carga masiva
 * - Devuelve un archivo XLSX listo para descargar y subir a ML
 */

import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getProductosSyscomMerida, obtenerTipoCambioSyscom, getCategoriasSyscomL1, getMLCategoryName } from '@/services/syscom';
import { getVatRate, getProfitMargin } from '@/services/settingsService';
import type { Product } from '@/lib/types';

/** Trunca el título a max 60 caracteres (límite de ML) */
function truncateTitle(title: string, max = 60): string {
  if (title.length <= max) return title;
  return title.substring(0, max - 3).trim() + '...';
}

/** Convierte un producto al formato de fila para ML */
function productToMLRow(product: Product, categoriaNombre: string) {
  const images = (product.imageUrls || []).filter(u => u && !u.includes('placehold'));
  const description = product.description?.trim() 
    ? product.description.substring(0, 3000)
    : `${product.name}. Marca: ${product.brand || 'Syscom'}. Modelo: ${product.line || product.id}. Producto nuevo con garantía de fábrica. Distribuidor autorizado en México.`;

  return {
    'SKU (Tu código)':               product.line || product.id,
    'Título':                         truncateTitle(product.name),
    'Categoría sugerida':             getMLCategoryName(categoriaNombre),
    'Condición':                      'new',
    'Tipo de publicación':            'free',          // Clásica gratuita
    'Precio':                         product.price.toFixed(2),
    'Moneda':                         'MXN',
    'Unidades disponibles':           product.stock || 0,
    'Marca':                          product.brand || 'Sin marca',
    'Modelo':                         product.line || '',
    'Código SAT':                     product.sat_code || '',
    'Descripción':                    description,
    'Foto 1':                         images[0] || '',
    'Foto 2':                         images[1] || '',
    'Foto 3':                         images[2] || '',
    'Foto 4':                         images[3] || '',
    'Foto 5':                         images[4] || '',
    'Foto 6':                         images[5] || '',
    'URL producto (Borarly.com)':   `https://borarly.com/products/${product.id}`,
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    // 1. Obtener categorías dinámicamente de Syscom
    const categorias = await getCategoriasSyscomL1();
    
    if (categorias.length === 0) {
      return NextResponse.json({ error: 'No se pudieron obtener categorías de Syscom.' }, { status: 500 });
    }

    // 2. Obtener tasas una sola vez
    const [exchangeRate, vatRate, margin] = await Promise.all([
      obtenerTipoCambioSyscom(),
      getVatRate(),
      getProfitMargin(),
    ]);

    // 3. Fetch de todas las categorías con stock en Mérida
    const BATCH_SIZE = 4;
    const requests = categorias.flatMap(cat =>
      [1, 2, 3].map(pagina => ({ categoriaId: cat.id, categoriaNombre: cat.nombre, pagina }))
    );

    const allProducts: { categoriaNombre: string; product: Product }[] = [];
    const seen = new Set<string>();

    for (let i = 0; i < requests.length; i += BATCH_SIZE) {
      const batch = requests.slice(i, i + BATCH_SIZE);
      const results = await Promise.all(
        batch.map(({ categoriaId, categoriaNombre, pagina }) =>
          getProductosSyscomMerida(
            categoriaId, undefined, undefined, undefined,
            'merida',   // ← SOLO MÉRIDA
            undefined, undefined,
            true,       // ← SOLO CON STOCK
            undefined, undefined, pagina,
            exchangeRate, vatRate, margin
          ).then(products => ({ categoriaNombre, products }))
           .catch(() => ({ categoriaNombre, products: [] as Product[] }))
        )
      );
      for (const { categoriaNombre, products } of results) {
        for (const p of products) {
          if (seen.has(p.id) || (p.stock ?? 0) <= 0) continue;
          seen.add(p.id);
          allProducts.push({ categoriaNombre, product: p });
        }
      }
    }

    if (allProducts.length === 0) {
      return NextResponse.json({ error: 'No se encontraron productos con stock en Mérida.' }, { status: 404 });
    }

    // 4. Generar filas para el XLSX
    const rows = allProducts.map(({ categoriaNombre, product }) =>
      productToMLRow(product, categoriaNombre)
    );

    // 5. Crear el libro de Excel
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);

    // Anchos de columna para legibilidad
    ws['!cols'] = [
      { wch: 20 }, // SKU
      { wch: 62 }, // Título
      { wch: 35 }, // Categoría
      { wch: 12 }, // Condición
      { wch: 20 }, // Tipo pub
      { wch: 12 }, // Precio
      { wch: 8  }, // Moneda
      { wch: 10 }, // Stock
      { wch: 20 }, // Marca
      { wch: 20 }, // Modelo
      { wch: 15 }, // SAT
      { wch: 80 }, // Descripción
      { wch: 60 }, // Fotos...
      { wch: 60 },
      { wch: 60 },
      { wch: 60 },
      { wch: 60 },
      { wch: 60 },
      { wch: 50 }, // URL
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Productos ML');

    // Hoja de instrucciones
    const instrucciones = [
      ['INSTRUCCIONES PARA CARGAR EN MERCADO LIBRE MÉXICO'],
      [''],
      ['1. Ve a mercadolibre.com.mx → Tu cuenta → Publicaciones → Carga masiva'],
      ['2. Descarga la plantilla de ML y copia tus datos a esa plantilla'],
      ['3. El campo "Categoría" debes seleccionarlo en el portal de ML'],
      ['4. Las fotos deben ser URLs públicas (las de Syscom funcionan directamente)'],
      ['5. El tipo "free" = Publicación Clásica gratuita'],
      [''],
      [`Generado: ${new Date().toLocaleString('es-MX')}`],
      [`Total de productos: ${rows.length}`],
      [`Categorías incluidas: ${categorias.map(c => c.nombre).join(', ')}`],
    ];
    const wsInfo = XLSX.utils.aoa_to_sheet(instrucciones);
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Instrucciones');

    // Convertir a buffer
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const fecha = new Date().toISOString().split('T')[0];

    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="Borarly_ML_${fecha}_${rows.length}productos.xlsx"`,
        'X-Product-Count': String(rows.length),
        'X-Categories-Count': String(categorias.length),
      },
    });

  } catch (error) {
    console.error('Error generando ML export:', error);
    return NextResponse.json({ error: 'Error generando el archivo.' }, { status: 500 });
  }
}
