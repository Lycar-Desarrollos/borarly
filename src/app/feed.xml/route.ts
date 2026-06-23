/**
 * @fileOverview Google Merchant Center Shopping Feed (RSS 2.0 / Google Shopping XML)
 *
 * ESTRATEGIA DE CACHÉ (ISR):
 * - revalidate = 3600 → El feed se regenera MÁXIMO 1 vez por hora
 * - Google visita el feed ~1 vez al día → en la práctica, Netlify ejecuta la función
 *   solo cuando el cache expira (no en cada visita), ahorrando invocaciones serverless
 *
 * CATEGORÍAS DINÁMICAS:
 * - Las categorías se obtienen de la API de Syscom en tiempo real (GET /categorias)
 * - Si Syscom cambia/renombra/agrega categorías, el feed se adapta automáticamente
 * - El mapeo a taxonomía de Google Shopping se hace por nombre (keywords), no por ID
 *
 * CAMPOS REQUERIDOS POR GOOGLE MERCHANT CENTER:
 * - g:id, g:title, g:description, g:link, g:image_link, g:price,
 *   g:availability, g:condition, g:brand, g:identifier_exists
 */

import { getProductosSyscomMerida, obtenerTipoCambioSyscom, getCategoriasSyscomL1, getGoogleCategoryByName } from '@/services/syscom';
import { getVatRate, getProfitMargin } from '@/services/settingsService';
import type { Product } from '@/lib/types';

// FORZAR REGENERACIÓN DINÁMICA en cada visita
// ISR (revalidate) no funciona correctamente con route handlers en Netlify.
// El cache se controla vía Cache-Control headers en la response.
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Timeout por categoría para evitar tiempos de respuesta muy largos
const FETCH_TIMEOUT_MS = 25000;

/** Escapa caracteres especiales XML */
function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Convierte un producto al formato XML de Google Shopping */
function productToXmlItem(product: Product, googleCategoryId: string): string {
  const availability = product.stock && product.stock > 0 ? 'in_stock' : 'out_of_stock';
  const imageUrl = product.imageUrls?.[0] || '';
  if (!imageUrl || imageUrl.includes('placehold.co')) return ''; // Google rechaza placeholders

  if (!product.price || isNaN(product.price)) return ''; // Precio inválido
  const price = product.price.toFixed(2);
  const productUrl = `https://borarly.com/products/${product.id}`;
  
  // Google requiere min. 150 caracteres en descripción — LIMPIAR HTML
  let description = product.description?.trim() || '';
  // Eliminar etiquetas HTML y entidades (Syscom envía HTML en descripciones)
  description = description
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-zA-Z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (description.length < 150) {
    // Enriquecer la descripción con contexto del producto
    const brand = product.brand || 'Borarly';
    const model = product.line || product.id;
    description = `${product.name}. Marca: ${brand}. Modelo: ${model}. ${description} Distribuido por Borarly, tu mayorista de confianza en seguridad electrónica, videovigilancia, redes y telecomunicaciones en México. Producto nuevo con garantía de fábrica.`;
  }
  description = description.substring(0, 5000).trim();
  
  const brand = product.brand || 'Borarly';
  const model = product.line || product.id; // Modelo de fábrica real (no ID interno)

  // Imágenes adicionales (hasta 10)
  const additionalImages = (product.imageUrls || [])
    .slice(1, 10)
    .filter(url => url && !url.includes('placehold.co'))
    .map(url => `      <g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`)
    .join('\n');

  // Truncar título a 150 caracteres (Google Merchant Center rechaza títulos largos)
  const title = product.name.length > 150 ? product.name.substring(0, 147) + '...' : product.name;

  return `
    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <g:title>${escapeXml(title)}</g:title>
      <g:description>${escapeXml(description)}</g:description>
      <g:link>${escapeXml(productUrl)}</g:link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      ${additionalImages}
      <g:price>${price} MXN</g:price>
      <g:availability>${availability}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${escapeXml(brand)}</g:brand>
      <g:mpn>${escapeXml(model)}</g:mpn>
      <g:identifier_exists>yes</g:identifier_exists>
      <g:google_product_category>${escapeXml(googleCategoryId)}</g:google_product_category>
      <g:shipping>
        <g:country>MX</g:country>
        <g:service>Estándar</g:service>
        <g:price>189 MXN</g:price>
      </g:shipping>
    </item>`;
}

/** Obtiene productos de una categoría con timeout de seguridad */
async function fetchCategoryWithTimeout(
  categoriaId: string,
  timeoutMs: number,
  pagina?: number,
  exchangeRate?: number,
  vatRate?: number,
  margin?: number
): Promise<Product[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const products = await getProductosSyscomMerida(
        categoriaId, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        undefined, 
        pagina,
        exchangeRate,
        vatRate,
        margin,
        controller.signal
    );
    clearTimeout(timeoutId);
    return products;
  } catch (e) {
    clearTimeout(timeoutId);
    console.warn(`Feed: timeout o error en categoría ${categoriaId}`, e);
    return [];
  }
}

export async function GET() {
  try {
    // 1. OBTENER CATEGORÍAS DINÁMICAMENTE DE SYSCOM (cache 24h)
    const categorias = await getCategoriasSyscomL1();
    
    if (categorias.length === 0) {
      console.error('Feed: No se pudieron obtener categorías de Syscom');
      return new Response('<?xml version="1.0"?><rss version="2.0"><channel><title>Error</title></channel></rss>', {
        status: 500,
        headers: { 'Content-Type': 'application/xml' },
      });
    }

    console.log(`Feed: Generando con ${categorias.length} categorías dinámicas de Syscom: ${categorias.map(c => `${c.id}(${c.nombre})`).join(', ')}`);

    // 2. PRE-OBTENER TASAS Y MÁRGENES (1 sola vez para todo el feed)
    const [exchangeRate, vatRate, margin] = await Promise.all([
      obtenerTipoCambioSyscom(),
      getVatRate(),
      getProfitMargin()
    ]);

    // 3. FETCH CON BATCHING ANTI-RATE-LIMIT
    // En lugar de lanzar todas las promesas simultáneas, las procesamos en lotes de 4
    const BATCH_SIZE = 4;
    const paginas = [1, 2, 3]; // Fetching first 3 pages per category
    const allFetchRequests = categorias.flatMap(cat =>
      paginas.map(p => ({ categoriaId: cat.id, categoriaNombre: cat.nombre, pagina: p }))
    );

    const resultsPorPagina: { categoriaId: string; categoriaNombre: string; products: Product[] }[] = [];

    for (let i = 0; i < allFetchRequests.length; i += BATCH_SIZE) {
      const batch = allFetchRequests.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(({ categoriaId, categoriaNombre, pagina }) =>
          fetchCategoryWithTimeout(categoriaId, FETCH_TIMEOUT_MS, pagina, exchangeRate, vatRate, margin)
            .then(products => ({ categoriaId, categoriaNombre, products }))
        )
      );
      resultsPorPagina.push(...batchResults);
    }

    // 4. DEDUPLICAR Y GENERAR XML
    const seenIds = new Set<string>();
    const allItems: string[] = [];

    for (const { categoriaNombre, products } of resultsPorPagina) {
      // Mapear por NOMBRE de categoría → taxonomía de Google (dinámico)
      const googleCategoryId = getGoogleCategoryByName(categoriaNombre);
      
      for (const product of products) {
        if (seenIds.has(product.id)) continue;
        seenIds.add(product.id);
        const item = productToXmlItem(product, googleCategoryId);
        if (item) allItems.push(item);
      }
    }

    const feedDate = new Date().toUTCString();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Borarly Mayorista – Catálogo de Productos</title>
    <link>https://borarly.com</link>
    <description>Distribuidor mayorista de seguridad electrónica, videovigilancia, redes y telecomunicaciones en México.</description>
    <language>es-mx</language>
    <lastBuildDate>${feedDate}</lastBuildDate>
    ${allItems.join('\n')}
  </channel>
</rss>`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        // Netlify CDN cache: 1 hora, stale-while-revalidate 24 horas
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'X-Feed-Items': String(allItems.length),
        'X-Feed-Categories': String(categorias.length),
      },
    });
  } catch (error) {
    console.error('Error generando feed XML:', error);
    return new Response('<?xml version="1.0"?><rss version="2.0"><channel><title>Error</title></channel></rss>', {
      status: 500,
      headers: { 'Content-Type': 'application/xml' },
    });
  }
}
