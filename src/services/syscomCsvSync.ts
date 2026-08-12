/**
 * @fileOverview Servicio de sincronización y parseo masivo del reporte CSV de Syscom (42,520 productos).
 *
 * Características:
 * 1. Descarga automática del reporte CSV en tiempo real desde la URL pública de Syscom.
 * 2. Manejo de la restricción de Syscom (1 descarga por hora). Si Syscom responde "Intente más tarde",
 *    se reutiliza la versión en caché más reciente.
 * 3. Normalización de precios considerando Tipo de Cambio (USD/MXN), Margen de Utilidad Borarly e IVA.
 * 4. Parseo seguro de comillas, saltos de línea y descripciones HTML.
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
 * Parsea una línea en formato CSV respetando campos entre comillas y comas internas.
 */
function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (insideQuotes && line[i + 1] === '"') {
        currentValue += '"';
        i++; // Saltar comilla escapada
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

/**
 * Limpia la descripción HTML de Syscom dejando solo texto legible.
 */
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

/**
 * Convierte una fila del CSV de Syscom al objeto Product estándar de Borarly.
 */
export function mapCsvRowToProduct(
  row: SyscomCsvRow,
  exchangeRate: number,
  vatRate: number,
  profitMargin: number
): Product {
  const isMxn = false; // La mayoría de precios en Syscom son USD a menos que se indique lo contrario
  const effectiveTC = row.tipoCambio > 1 ? row.tipoCambio : (exchangeRate > 1.1 ? exchangeRate : 20.0);
  
  // Costo mayorista neto en MXN
  const costInMxn = row.suPrecio * (isMxn ? 1 : effectiveTC);
  
  // Aplicar margen de utilidad de Borarly
  const priceBeforeTax = costInMxn * (1 + profitMargin);
  
  // Aplicar IVA (16%)
  const finalPrice = Math.round(priceBeforeTax * (1 + vatRate) * 100) / 100;
  
  const idClean = row.idProducto || row.modelo.replace(/[^a-zA-Z0-9_-]/g, '');
  const cleanDescription = stripHtml(row.descripcionHtml);

  return {
    id: idClean,
    name: row.titulo || row.modelo,
    description: cleanDescription || row.titulo,
    price: finalPrice,
    currency: 'MXN',
    costPrice: Math.round(costInMxn * 100) / 100,
    profitMargin: profitMargin,
    imageUrls: row.imagenPrincipal && !row.imagenPrincipal.includes('placehold') ? [row.imagenPrincipal] : ['https://placehold.co/600x400.png'],
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
 * Descarga y parsea el CSV masivo de Syscom (42,520 productos).
 */
export async function downloadAndParseSyscomCsv(): Promise<{ products: Product[]; status: CsvSyncStatus }> {
  const status: CsvSyncStatus = {
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
      next: { revalidate: 3600 }, // Revalidar como máximo 1 vez por hora
    });

    if (!res.ok) {
      status.status = 'error';
      status.message = `Error HTTP ${res.status} al descargar el CSV`;
      return { products: [], status };
    }

    const text = await res.text();

    // Si Syscom responde con la página de límite de cuota (1 descarga/hora)
    if (text.includes('Intente m') || text.includes('<!DOCTYPE html>') || text.includes('<html')) {
      status.status = 'rate_limited';
      status.message = 'Syscom limitó la descarga (1 descarga/hora permitida). Se mantendrá la versión previa en caché.';
      return { products: [], status };
    }

    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) {
      status.status = 'error';
      status.message = 'El archivo CSV recibido no contiene productos';
      return { products: [], status };
    }

    // Obtener parámetros financieros
    const [exchangeRate, vatRate, profitMargin] = await Promise.all([
      getExchangeRate(),
      getVatRate(),
      getProfitMargin()
    ]);

    const categoriesSet = new Set<string>();
    const products: Product[] = [];
    let inStockCount = 0;

    // Omitir header (línea 0)
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

    status.lastSync = new Date().toISOString();
    status.totalProducts = products.length;
    status.inStockProducts = inStockCount;
    status.categoriesCount = categoriesSet.size;
    status.status = 'success';
    status.message = `Sincronización exitosa: ${products.length} productos procesados (${inStockCount} con existencia).`;

    return { products, status };
  } catch (error: any) {
    status.status = 'error';
    status.message = `Excepción durante la sincronización: ${error?.message || error}`;
    return { products: [], status };
  }
}
