'use server';

import { getProductosSyscomMerida } from '@/services/syscom';
import type { Product } from '@/lib/types';

/**
 * Server Action: Search Syscom products by keyword.
 * Returns up to 20 results with full pricing (exchange rate + margin + IVA),
 * the same prices shown in the public catalog.
 */
export async function searchSyscomProducts(busqueda: string): Promise<Product[]> {
  if (!busqueda || busqueda.trim().length < 2) return [];
  try {
    const results = await getProductosSyscomMerida(
      undefined,    // categoria
      busqueda.trim(), // busqueda
      undefined,    // marca
      undefined,    // orden — no sorting needed for search
      undefined,    // sucursal
      undefined,    // nuevo
      undefined,    // cajaAbierta
      undefined,    // enExistencia
      undefined,    // oferta
      undefined     // outlet
    );
    // Return first 20 results only — enough for a dropdown
    return results.slice(0, 20);
  } catch (error) {
    console.error('Error searching Syscom products:', error);
    return [];
  }
}
