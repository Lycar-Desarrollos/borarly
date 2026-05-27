/**
 * @fileOverview Google Merchant Center Shopping Feed (RSS 2.0 / Google Shopping XML)
 *
 * ESTRATEGIA DE CACHÉ (ISR):
 * - revalidate = 3600 → El feed se regenera MÁXIMO 1 vez por hora
 * - Google visita el feed ~1 vez al día → en la práctica, Netlify ejecuta la función
 *   solo cuando el cache expira (no en cada visita), ahorrando invocaciones serverless
 *
 * CAMPOS REQUERIDOS POR GOOGLE MERCHANT CENTER:
 * - g:id, g:title, g:description, g:link, g:image_link, g:price,
 *   g:availability, g:condition, g:brand, g:identifier_exists
 */

import { getProductosSyscomMerida, obtenerTipoCambioSyscom } from '@/services/syscom';
import { getVatRate, getProfitMargin } from '@/services/settingsService';
import type { Product } from '@/lib/types';

// ISR: Regenerar el feed máximo 1 vez por hora
// Netlify ejecutará la función ~24 veces/día en vez de miles
export const revalidate = 3600;

// Timeout por categoría para evitar tiempos de respuesta muy largos
const FETCH_TIMEOUT_MS = 25000;

// Categorías principales de Syscom a incluir en el feed
// Cada una hace 1 request a la API de Syscom
const CATEGORIAS_FEED = [
  { id: '22', nombre: 'Videovigilancia' },
  { id: '43', nombre: 'Control de Acceso' },
  { id: '24', nombre: 'Redes' },
  { id: '26', nombre: 'Radiocomunicación' },
  { id: '95', nombre: 'Cableado Estructurado' },
  { id: '10', nombre: 'Energía' },
  { id: '1',  nombre: 'Detección de Fuego' },
  { id: '11', nombre: 'Intrusión' },
  { id: '17', nombre: 'Cómputo' },
  { id: '5',  nombre: 'Telefonía' },
  { id: '91', nombre: 'Herramientas y Herrajes' },
  { id: '31', nombre: 'Audio y Video' },
];

// Mapa de categorías Syscom → taxonomía de Google Shopping (IDs de Google)
// https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
const GOOGLE_CATEGORY_MAP: Record<string, string> = {
  '22': '505306', // Videovigilancia (Surveillance Cameras)
  '43': '505304', // Control de Acceso (Access Control Systems)
  '24': '262',    // Redes (Networking)
  '26': '614',    // Radiocomunicación (Two-way Radios)
  '95': '3144',   // Cableado (Cables)
  '10': '5945',   // Energía (Power Supplies)
  '1':  '505303', // Fuego (Security & Alarms)
  '11': '499960', // Intrusión (Security Alarms)
  '17': '278',    // Cómputo (Computers)
  '5':  '267',    // Telefonía (Telephony)
  '91': '455',    // Herramientas (Tools)
  '31': '305',    // Audio/Video
};

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
function productToXmlItem(product: Product, categoriaId: string): string {
  const availability = product.stock && product.stock > 0 ? 'in_stock' : 'out_of_stock';
  const imageUrl = product.imageUrls?.[0] || '';
  if (!imageUrl || imageUrl.includes('placehold.co')) return ''; // Google rechaza placeholders

  if (!product.price || isNaN(product.price)) return ''; // Precio inválido
  const price = product.price.toFixed(2);
  const productUrl = `https://BORARLY.com/products/${product.id}`;
  
  // Google requiere min. 150 caracteres en descripción
  let description = product.description?.trim() || '';
  if (description.length < 150) {
    // Enriquecer la descripción con contexto del producto
    const brand = product.brand || 'BORARLY';
    const model = product.line || product.id;
    description = `${product.name}. Marca: ${brand}. Modelo: ${model}. ${description} Distribuido por BORARLY, tu mayorista de confianza en seguridad electrónica, videovigilancia, redes y telecomunicaciones en México. Producto nuevo con garantía de fábrica.`;
  }
  description = description.substring(0, 5000).trim();
  
  const brand = product.brand || 'BORARLY';
  const model = product.line || product.id; // Modelo de fábrica real (no ID interno)
  const googleCategory = GOOGLE_CATEGORY_MAP[categoriaId] || 'Electronics';

  // Imágenes adicionales (hasta 10)
  const additionalImages = (product.imageUrls || [])
    .slice(1, 10)
    .filter(url => url && !url.includes('placehold.co'))
    .map(url => `      <g:additional_image_link>${escapeXml(url)}</g:additional_image_link>`)
    .join('\n');

  return `
    <item>
      <g:id>${escapeXml(product.id)}</g:id>
      <g:title>${escapeXml(product.name)}</g:title>
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
      <g:google_product_category>${escapeXml(googleCategory)}</g:google_product_category>
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
        controller.signal     // FIX #2: Señal correctamente conectada
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
    // PRE-OBTENER TASAS Y MÁRGENES (1 sola vez para todo el feed)
    const [exchangeRate, vatRate, margin] = await Promise.all([
      obtenerTipoCambioSyscom(),
      getVatRate(),
      getProfitMargin()
    ]);

    // FIX #1: Batching anti-rate-limit
    // En lugar de lanzar 60 promesas simultáneas, las procesamos en lotes de 4
    // para no saturar la API de Syscom con demasiadas peticiones al mismo tiempo.
    const BATCH_SIZE = 4;
    const paginas = [1, 2, 3]; // Fetching first 3 pages per category
    const allFetchRequests = CATEGORIAS_FEED.flatMap(cat =>
      paginas.map(p => ({ categoriaId: cat.id, pagina: p }))
    );

    const resultsPorPagina: { categoriaId: string; products: Product[] }[] = [];

    for (let i = 0; i < allFetchRequests.length; i += BATCH_SIZE) {
      const batch = allFetchRequests.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map(({ categoriaId, pagina }) =>
          fetchCategoryWithTimeout(categoriaId, FETCH_TIMEOUT_MS, pagina, exchangeRate, vatRate, margin)
            .then(products => ({ categoriaId, products }))
        )
      );
      resultsPorPagina.push(...batchResults);
    }

    // Eliminar duplicados por ID (un producto puede estar en varias categorías)
    const seenIds = new Set<string>();
    const allItems: string[] = [];

    for (const { categoriaId, products } of resultsPorPagina) {
      for (const product of products) {
        if (seenIds.has(product.id)) continue;
        seenIds.add(product.id);
        const item = productToXmlItem(product, categoriaId);
        if (item) allItems.push(item);
      }
    }

    const feedDate = new Date().toUTCString();

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>BORARLY Mayorista – Catálogo de Productos</title>
    <link>https://BORARLY.com</link>
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
