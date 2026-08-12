/**
 * @fileOverview Google Merchant Center Shopping Feed (RSS 2.0 / Google Shopping XML)
 *
 * ESTRATEGIA DE CACHÉ (ISR):
 * - revalidate = 3600 → El feed se regenera MÁXIMO 1 vez por hora
 * - Sincronizado automáticamente con el CSV masivo de Syscom (42,520 productos)
 */

import { getProductosSyscomMerida, obtenerTipoCambioSyscom, getCategoriasSyscomL1, getGoogleCategoryByName } from '@/services/syscom';
import { getVatRate, getProfitMargin } from '@/services/settingsService';
import { downloadAndParseSyscomCsv } from '@/services/syscomCsvSync';
import type { Product } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
  description = description
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-zA-Z]+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
    
  if (description.length < 150) {
    const brand = product.brand || 'Borarly';
    const model = product.line || product.id;
    description = `${product.name}. Marca: ${brand}. Modelo: ${model}. ${description} Distribuido por Borarly, tu mayorista de confianza en seguridad electrónica, videovigilancia, redes y telecomunicaciones en México. Producto nuevo con garantía de fábrica.`;
  }
  description = description.substring(0, 5000).trim();
  
  const brand = product.brand || 'Borarly';
  const model = product.line || product.id;

  const additionalImages = (product.imageUrls || [])
    .slice(1, 10)
    .filter(url => url && !url.includes('placehold.co'))
    .map(url => `      <g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`)
    .join('\n');

  // Truncar título a 150 caracteres
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
    const seenIds = new Set<string>();
    const allItems: string[] = [];

    // Intento 1: Obtener catálogo desde el CSV masivo de Syscom (42,520 productos)
    const { products: csvProducts, status: csvStatus } = await downloadAndParseSyscomCsv();

    if (csvProducts.length > 0) {
      console.log(`Feed: Generando feed con ${csvProducts.length} productos del CSV masivo de Syscom`);
      for (const product of csvProducts) {
        if (seenIds.has(product.id)) continue;
        seenIds.add(product.id);
        const googleCategoryId = getGoogleCategoryByName(product.category || '');
        const item = productToXmlItem(product, googleCategoryId);
        if (item) allItems.push(item);
      }
    } else {
      // Fallback a API REST por categorías si el CSV responde "Intente más tarde"
      console.log(`Feed: Fallback a API REST. Razón CSV: ${csvStatus.message}`);
      const categorias = await getCategoriasSyscomL1();
      const [exchangeRate, vatRate, margin] = await Promise.all([
        obtenerTipoCambioSyscom(),
        getVatRate(),
        getProfitMargin()
      ]);

      const BATCH_SIZE = 4;
      const paginas = [1, 2, 3];
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

      for (const { categoriaNombre, products } of resultsPorPagina) {
        const googleCategoryId = getGoogleCategoryByName(categoriaNombre);
        for (const product of products) {
          if (seenIds.has(product.id)) continue;
          seenIds.add(product.id);
          const item = productToXmlItem(product, googleCategoryId);
          if (item) allItems.push(item);
        }
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
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        'X-Feed-Items': String(allItems.length),
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
