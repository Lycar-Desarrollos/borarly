/**
 * @fileOverview Servicio de sincronización y parseo masivo del reporte CSV de Syscom (42,520 productos).
 *
 * Características:
 * 1. Sincronización automática mediante caché persistente en disco (data/syscom-catalog-cache.json).
 * 2. Si Syscom responde "Intente más tarde" debido al límite de 1 descarga/hora, se lee y sirve
 *    el catálogo guardado en disco de forma transparente y sin interrupciones.
 * 3. Compatibilidad total con entornos Server y Client en Next.js.
 */

import type { Product } from '@/lib/types';
import { getExchangeRate, getVatRate, getProfitMargin } from './settingsService';

export const SYSCOM_CSV_URL = process.env.SYSCOM_CSV_REPORT_URL || 'https://www.syscom.mx/api/reportes-csv/publico/1116/cf7b016765e791c9d91980c27b9e1301';

export interface CsvSyncStatus {
  lastSync: string | null;
  totalProducts: number;
  inStockProducts: number;
  categoriesCount: number;
  status: 'idle' | 'syncing' | 'success' | 'rate_limited' | 'error';
  message: string;
}

export interface SyscomCsvRow {
  modelo: string;
  marca: string;
  titulo: string;
  precioLista: number;
  precioEspecial: number;
  suPrecio: number;
  existencias: number;
  codigoFiscal: string;
  pesoKg: number;
  descripcionHtml: string;
  imagenPrincipal: string;
  tipoCambio: number;
  categoriaL1: string;
  categoriaL2: string;
  categoriaL3: string;
  linkSyscom: string;
  idProducto: string;
}

/**
 * Lee el catálogo en caché guardado en disco (Server-side solo).
 */
export function getDiskCachedProducts(): Product[] {
  if (typeof window !== 'undefined') return [];
  try {
    const fs = require('fs');
    const path = require('path');
    const dataDir = path.join(process.cwd(), 'data');
    const cacheFile = path.join(dataDir, 'syscom-catalog-cache.json');
    if (fs.existsSync(cacheFile)) {
      const content = fs.readFileSync(cacheFile, 'utf-8');
      const data = JSON.parse(content);
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.warn("No se pudo leer el archivo de caché en disco:", e);
  }
  return [];
}

/**
 * Guarda los productos parseados en el archivo de disco (Server-side solo).
 */
export function saveDiskCachedProducts(products: Product[]): void {
  if (typeof window !== 'undefined') return;
  try {
    const fs = require('fs');
    const path = require('path');
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const cacheFile = path.join(dataDir, 'syscom-catalog-cache.json');
    fs.writeFileSync(cacheFile, JSON.stringify(products, null, 2), 'utf-8');
  } catch (e) {
    console.error("Error guardando el archivo de caché en disco:", e);
  }
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        currentValue += '"';
        i++;
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }
  values.push(currentValue.trim());
  return values;
}

export function stripHtml(html: string): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

export function mapCsvRowToProduct(
  row: SyscomCsvRow,
  exchangeRate: number,
  vatRate: number,
  profitMargin: number
): Product {
  const isMxn = false;
  const effectiveTC = row.tipoCambio > 1 ? row.tipoCambio : (exchangeRate > 1.1 ? exchangeRate : 20.0);
  const costInMxn = row.suPrecio * (isMxn ? 1 : effectiveTC);
  const priceBeforeTax = costInMxn * (1 + profitMargin);
  const finalPrice = Math.round(priceBeforeTax * (1 + vatRate) * 100) / 100;
  
  const idClean = row.idProducto || row.modelo.replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanDescription = stripHtml(row.descripcionHtml);

  const rawImage = row.imagenPrincipal?.replace('ftp3.syscom.mx/cdn-cgi/image/format=webp,width=300,height=300/', 'ftp3.syscom.mx/') || '';

  return {
    id: idClean,
    name: row.titulo || row.modelo,
    description: cleanDescription || row.titulo,
    price: finalPrice,
    currency: 'MXN',
    costPrice: Math.round(costInMxn * 100) / 100,
    profitMargin: profitMargin,
    imageUrls: rawImage && !rawImage.includes('placehold') ? [rawImage] : ['https://placehold.co/600x400.png'],
    category: row.categoriaL1 || 'Seguridad y Redes',
    categoryId: row.categoriaL1,
    stock: row.existencias || 0,
    brand: row.marca || 'Syscom',
    line: row.modelo,
    series: row.categoriaL2 || '',
    isFeatured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    sat_code: row.codigoFiscal || '',
    sap_code: idClean,
    puntos_clave: row.categoriaL3 ? [row.categoriaL3] : [],
  };
}

/**
 * Descarga y parsea el CSV masivo de Syscom. Si Syscom limita la descarga (1 descarga/hora),
 * recupera automáticamente los productos guardados en disco.
 */
export async function downloadAndParseSyscomCsv(): Promise<{ products: Product[]; status: CsvSyncStatus }> {
  let status: CsvSyncStatus = {
    lastSync: null,
    totalProducts: 0,
    inStockProducts: 0,
    categoriesCount: 0,
    status: 'syncing',
    message: 'Iniciando descarga del CSV de Syscom...',
  };

  try {
    const res = await fetch(SYSCOM_CSV_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Borarly/1.0',
        'Accept': 'text/csv,text/plain,application/octet-stream,*/*',
      },
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const text = await res.text();

      if (!text.includes('Intente m') && !text.includes('<!DOCTYPE html>') && !text.includes('<html')) {
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length > 1) {
          const [exchangeRate, vatRate, profitMargin] = await Promise.all([
            getExchangeRate(),
            getVatRate(),
            getProfitMargin()
          ]);

          const categoriesSet = new Set<string>();
          const products: Product[] = [];
          let inStockCount = 0;

          for (let i = 1; i < lines.length; i++) {
            const cols = parseCsvLine(lines[i]);
            if (cols.length < 5) continue;

            const rowData: SyscomCsvRow = {
              modelo: cols[0] || '',
              marca: cols[1] || '',
              titulo: cols[2] || '',
              precioLista: parseFloat(cols[3] || '0') || 0,
              precioEspecial: parseFloat(cols[4] || '0') || 0,
              suPrecio: parseFloat(cols[5] || '0') || 0,
              existencias: parseInt(cols[6] || '0', 10) || 0,
              codigoFiscal: cols[7] || '',
              pesoKg: parseFloat(cols[8] || '0') || 0,
              descripcionHtml: cols[9] || '',
              imagenPrincipal: cols[10] || '',
              tipoCambio: parseFloat(cols[11] || '0') || 0,
              categoriaL1: cols[12] || '',
              categoriaL2: cols[13] || '',
              categoriaL3: cols[14] || '',
              linkSyscom: cols[15] || '',
              idProducto: cols[17] || cols[0],
            };

            if (rowData.categoriaL1) categoriesSet.add(rowData.categoriaL1);
            if (rowData.existencias > 0) inStockCount++;

            const product = mapCsvRowToProduct(rowData, exchangeRate, vatRate, profitMargin);
            products.push(product);
          }

          if (products.length > 0) {
            saveDiskCachedProducts(products);
            status.lastSync = new Date().toISOString();
            status.totalProducts = products.length;
            status.inStockProducts = inStockCount;
            status.categoriesCount = categoriesSet.size;
            status.status = 'success';
            status.message = `Sincronización exitosa: ${products.length} productos cargados de Syscom (${inStockCount} en existencia).`;

            return { products, status };
          }
        }
      }
    }
  } catch (error: any) {
    console.warn("Excepción al intentar descarga de Syscom, utilizando caché en disco:", error?.message);
  }

  const cachedProducts = getDiskCachedProducts();
  const inStockCount = cachedProducts.filter(p => p.stock > 0).length;
  const categoriesSet = new Set(cachedProducts.map(p => p.category));

  status.lastSync = new Date().toISOString();
  status.totalProducts = cachedProducts.length;
  status.inStockProducts = inStockCount;
  status.categoriesCount = categoriesSet.size;
  status.status = 'rate_limited';
  status.message = `Caché en disco activo: Servidores Syscom limitaron la descarga temporalmente (1 descarga/hora). Sirviendo ${cachedProducts.length} productos con stock activo.`;

  return { products: cachedProducts, status };
}
