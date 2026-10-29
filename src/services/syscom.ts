// src/services/syscom.ts

import type { Product, Category } from '@/lib/types';
import { getExchangeRate, getVatRate, getProfitMargin } from './settingsService';

const API_URL = (process.env.SYSCOM_API_URL || 'https://developers.syscom.mx/api/v1').trim().replace(/^['"]|['"]$/g, '');

const SYSCOM_HEADERS: Record<string, string> =
  typeof window === 'undefined'
    ? {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      }
    : {
        'Accept': 'application/json',
      };

// Token OAuth oficial de Syscom de respaldo (vigencia de 1 año: exp 1823784077)
const FALLBACK_SYSCOM_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZXMiOltdLCJzdWIiOiIiLCJhdWQiOiJZSERWcExoNWszWGdReWZTMFd0RFZEY1hrcGpmMVFHVCIsImp0aSI6IjliZDBlZTQzMjQ5MTk2YWY0MTYyYjk0MmZhOTc0ZjA1NWI2NDA0MzIwMGI2OGFkODc4Nzc3ZTZjZDQ0NjI0ZGU0YWZlNjdlYTg2MDMyZDNkIiwiaWF0IjoxNzkyMjQ4MDc3LCJuYmYiOjE3OTIyNDgwNzcsImV4cCI6MTgyMzc4NDA3N30.C5gFkHj1hjbMuAChsMDvEeG1e7RD6IyYqNx6Kw1eE_z8Lm3pKGlCtz7iHmr6_37c_IP_7pbKQIPXPOpMZFJCzgAhucIkpg2EajOI02DMqOlTg8Co84kZ96rMVfSTLjPQI1pEAhRTen0BUjZKWjl005kS7JVMjqCfU24IHedBeYkTtoT2b9tVusWJZdVi7T8mMcJFSvMgqOoZmHvtTa0GtA7YAoWmuhV_3LetCXtbgbKNLhqi1tp3qsUvKGsqn7gYZ9JBnOj11U00am82YAluFe_MeyC3X2Z3j-8JEHO0N4w1bALD8ti6aIZOC7d23bl3UZXmwR6OhYGUven_gT4wsV58GSS7KkcK_BRJ2bhSVtO-PWtlRqlTvPDW0TDlpty4tvmAx8gbRZGCRL8umxzjxGE-HVvOjaxDwjsQuSsd5cr_XABL0FhfURObyZ-hSyreUDKEP6uiGB1cqKZ7FZ4CDQygRVxaYNKqpK0cGfREzTYTsEmveWL_WUZLjviY5jCJ7u92OaLZHw6fxsVZXhm4vnyjPhIG6Kv2eM7bSfMUwVzXDc3NUjj7vU8Thv-vLVLlEI1MU8232YAx74HAyOjYJXXtA8Fv-P8rzvnw7k9kSwhQS_6ABTTzLfuAdf_q1i638DKHgpycyo-xQAiwkEaWS6Te0kC4-NN-exHvtx9gECQ';

const FALLBACK_L1_RAW: { id: string; nombre: string }[] = [
  { id: '22', nombre: 'Videovigilancia' },
  { id: '26', nombre: 'Redes e IT' },
  { id: '37', nombre: 'Control de Acceso' },
  { id: '25', nombre: 'Radiocomunicación' },
  { id: '30', nombre: 'Energía y Climatización' },
  { id: '32', nombre: 'Automatización e Intrusión' },
  { id: '38', nombre: 'Detección de Fuego' },
  { id: '65811', nombre: 'Cableado Estructurado' },
  { id: '66523', nombre: 'Audio y Video Profesional' },
  { id: '27', nombre: 'GPS, Telemática y Equipamiento Vehicular' },
  { id: '42', nombre: 'Herramientas, Ferretería y Material Eléctrico' },
  { id: '66630', nombre: 'Industria / BMS / Robots' },
  { id: '67040', nombre: 'Retail y Punto de Venta' },
];

let lastSyscomDiag = 'init';
export function getLastSyscomDiag(): string {
  return lastSyscomDiag;
}

let cachedToken: string | null = FALLBACK_SYSCOM_TOKEN;
let tokenExpiracion: number = 1823784077 * 1000;

let cachedExchangeRate: number | null = null;
let exchangeRateExpiracion: number = 0;

let cachedCategoriesL1: Category[] | null = null;
let categoriesL1Expiracion: number = 0;

let cachedCategoriesAll: Category[] | null = null;
let categoriesAllExpiracion: number = 0;

/**
 * Obtiene el token de Siscom y lo guarda en caché local hasta que expire
 */
async function obtenerTokenSyscom(): Promise<string | null> {
  // Si el token aún es válido (damos 5 minutos de margen), lo reutilizamos
  if (cachedToken && Date.now() < tokenExpiracion - 300000) {
    return cachedToken;
  }

  const clientId = (process.env.SYSCOM_CLIENT_ID || 'YHDVpLh5k3XgQyfS0WtDVDcXkpjf1QGT').trim().replace(/^['"]|['"]$/g, '');
  const clientSecret = (process.env.SYSCOM_CLIENT_SECRET || 'zEErjr0KRR5d5eT1UIT9YiyovTu8lV49Do1KuSCn').trim().replace(/^['"]|['"]$/g, '');
  const tokenUrl = (process.env.SYSCOM_TOKEN_URL || 'https://developers.syscom.mx/oauth/token').trim().replace(/^['"]|['"]$/g, '');

  if (!clientId || !clientSecret) {
      console.warn("Faltan las credenciales de SYSCOM en las variables de entorno");
      return FALLBACK_SYSCOM_TOKEN;
  }

  try {
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('grant_type', 'client_credentials');

    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        ...SYSCOM_HEADERS,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
      cache: 'no-store',
    });

    if (!res.ok) {
        const errText = await res.text();
        lastSyscomDiag = `token_http_${res.status}:${errText.substring(0, 80)}`;
        console.error("Error al autenticar con Syscom:", errText);
        return FALLBACK_SYSCOM_TOKEN;
    }

    const data = await res.json();
    cachedToken = data.access_token || FALLBACK_SYSCOM_TOKEN;
    tokenExpiracion = Date.now() + (data.expires_in * 1000 || 3600000); 
    
    return cachedToken;
  } catch (error: any) {
    lastSyscomDiag = `token_err:${error?.message || String(error)}`;
    console.error("Fallo de red al pedir token Syscom:", error);
    return FALLBACK_SYSCOM_TOKEN;
  }
}

/**
 * Procesa la respuesta de Syscom de forma segura para evitar errores de JSON
 */
async function safeJson(res: Response) {
    const text = await res.text();
    try {
        return JSON.parse(text);
    } catch (e) {
        console.error(`Error parseando JSON de Syscom en ${res.url}. Texto recibido: "${text.substring(0, 100)}..."`);
        return null;
    }
}

/**
 * Convierte el formato crudo de Syscom a nuestro formato local `Product`
 */
function mapearProductoSyscom(p: any, exchangeRate: number, vatRate: number = 0.16, profitMargin: number = 0.25): Product {
    // Si img_portada no viene, buscamos en el array de imágenes si existe
    let miImagen = p.img_portada;
    if (!miImagen && p.imagenes && p.imagenes.length > 0) {
         miImagen = p.imagenes[0].imagen || p.imagenes[0].url || miImagen;
    }
    // Asegurarnos de que no sea un string vacío o 'null'
    if (!miImagen || miImagen === "null" || miImagen === "") {
         miImagen = "https://placehold.co/600x400.png";
    }

    // Calcular Precio Final exacto de Syscom. 
    // EL USUARIO SOLICITÓ: Que el precio PRINCIPAL (el grande) sea el descontado ($573.16 en su ejemplo).
    // Antes pidió el de lista, pero el nuevo diseño pide el final como destacado.
    const rawPrice = parseFloat(p.precios?.precio_descuento || p.precios?.precio_especial || p.precios?.precio_lista || "0");
    
    // REGLA SOLICITADA: Siempre asumir USD a menos que diga explícitamente MXN
    // La API suele omitir el campo o enviarlo vacío para USD.
    const monedaRaw = String(p.precios?.moneda || '').toUpperCase();
    const isMxn = monedaRaw === 'MXN';
    
    // Si no es MXN, multiplicamos por TC. Si TC falla (es 0 o 1), usamos el fallback 17.5
    const effectiveTC = isMxn ? 1 : (exchangeRate > 1.1 ? exchangeRate : 17.5);
    const baseMxn = rawPrice * effectiveTC;
    // 1. Costo Base en MXN (después de tipo de cambio)
    const costInMxn = baseMxn;
    
    // 2. Aplicar Margen de Utilidad (garantizar respaldo de 25% = 0.25 si es 0 o no disponible)
    const effectiveMargin = typeof profitMargin === 'number' && profitMargin > 0 ? profitMargin : 0.25;
    const priceBeforeTax = costInMxn * (1 + effectiveMargin);
    
    // 3. Aplicar IVA (garantizar respaldo de 16% = 0.16)
    const effectiveVat = typeof vatRate === 'number' && vatRate > 0 ? vatRate : 0.16;
    const finalPrice = priceBeforeTax * (1 + effectiveVat);

    return {
        id: String(p.producto_id), 
        name: p.titulo || 'Producto sin título',
        description: p.descripcion || '',
        price: parseFloat(finalPrice.toFixed(2)),
        currency: 'MXN',
        costPrice: parseFloat(costInMxn.toFixed(2)),
        profitMargin: effectiveMargin,
        imageUrls: Array.isArray(p.imagenes) && p.imagenes.length > 0 
            ? p.imagenes.map((img: any) => img.imagen || img.url || miImagen) 
            : [miImagen],
        category: p.categorias?.[0]?.nombre || '',
        categoryId: p.categorias?.[0]?.id ? String(p.categorias?.[0]?.id) : undefined,
        stock: parseInt(p.existencia?.nuevo || '0'),
        brand: p.marca || '',
        line: p.modelo || '',
        series: '',
        isFeatured: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sat_code: p.sat_key || '',
        sap_code: p.producto_id || '',
        // Detalles extras para View Enriquecida
        puntos_clave: Array.isArray(p.puntos_clave) ? p.puntos_clave : [],
        marca_logo: p.marca_logo || '',
        precio_lista: parseFloat((parseFloat(p.precios?.precio_lista || "0") * effectiveTC * (1 + profitMargin) * (1 + vatRate)).toFixed(2)),
        precio_especial: parseFloat((parseFloat(p.precios?.precio_especial || "0") * effectiveTC * (1 + profitMargin) * (1 + vatRate)).toFixed(2)),
        precio_descuento: parseFloat(finalPrice.toFixed(2)),
        categorias_adicionales: Array.isArray(p.categorias) ? p.categorias : [],
        caracteristicas: Array.isArray(p.caracteristicas) 
            ? p.caracteristicas 
            : (typeof p.caracteristicas === 'string' ? [p.caracteristicas] : []),
        recursos: Array.isArray(p.recursos) ? p.recursos : [],
        iconos: Array.isArray(p.iconos) ? p.iconos : [],
        peso: p.peso ? String(p.peso) : '',
        dimensiones: p.dimensiones ? String(p.dimensiones) : '',
        unidad_de_medida: p.unidad_de_medida || p.unidades_de_medida || ''
    };
}

/**
 * Obtiene el Catálogo Nacional de Syscom (Anteriormente solo Mérida)
 * Trae todo el inventario disponible de Syscom en la republica.
 */
export async function getProductosSyscomMerida(
    categoria?: string, 
    busqueda?: string, 
    marca?: string, 
    orden?: string,
    sucursal?: string,
    nuevo?: boolean,
    cajaAbierta?: boolean,
    enExistencia?: boolean,
    oferta?: boolean,
    outlet?: boolean,
    pagina?: number,
    // Optimizaciones para el feed (evitar redundancia)
    providedExchangeRate?: number,
    providedVatRate?: number,
    providedMargin?: number,
    signal?: AbortSignal     // FIX #2: AbortSignal para cancelar la petición en timeout
): Promise<Product[]> {
    const token = await obtenerTokenSyscom();
    if (!token) return [];

    try {
        const url = new URL(`${API_URL}/productos`);
        // Quitamos la restricción de &sucursal=merida para traer inventario a nivel NACIONAL
        url.searchParams.append('stock', 'true');

        // Syscom exige que haya al menos 1 filtro MANDATORIO (marca, categoria o busqueda)
        let hasMandatoryFilter = false;

        if (categoria && categoria !== 'all') {
            url.searchParams.set('categoria', categoria);
            hasMandatoryFilter = true;
        } 
        
        if (busqueda && busqueda.trim() !== '') {
            url.searchParams.set('busqueda', busqueda.trim());
            hasMandatoryFilter = true;
        }

        if (marca && marca.trim() !== '') {
            url.searchParams.set('marca', marca.trim());
            hasMandatoryFilter = true;
        }
        
        // Syscom API ONLY accepts 'precio' as a valid orden value (confirmed via API testing).
        // All other sorts (A-Z, Z-A, precio desc) are applied client-side after the fetch.
        if (orden === 'precio') {
            url.searchParams.set('orden', 'precio');
        }

        if (sucursal && sucursal !== 'sucursales') {
            url.searchParams.set('sucursal', sucursal);
        }

        if (nuevo) {
            url.searchParams.set('nuevo', 'true');
        }

        if (cajaAbierta) {
            url.searchParams.set('caja_abierta', 'true');
        }

        if (enExistencia) {
            url.searchParams.set('stock', 'true');
        }

        if (oferta) {
            url.searchParams.set('en_oferta', 'true');
        }

        if (outlet) {
            url.searchParams.set('outlet', 'true');
        }

        if (pagina) {
            url.searchParams.set('pagina', String(pagina));
        }

        // SIEMPRE debe haber al menos un filtro mandatorio para evitar el Error 422 de Syscom
        if (!hasMandatoryFilter) {
            // Si no hay categoría, búsqueda ni marca, forzamos categorías generales 
            // (Videovigilancia, Redes, etc.) para que la API responda
            url.searchParams.set('categoria', '22'); // 22 es la categoría base de Videovigilancia
        }

        const res = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                ...SYSCOM_HEADERS,
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-store',
            signal: signal      // FIX #2: Conectar la señal al fetch real
        });

        if (!res.ok) {
            const errText = await res.text();
            lastSyscomDiag = `prod_http_${res.status}:${errText.substring(0, 100)}`;
            console.error("Error de Syscom Catálogo:", errText);
            return [];
        }

        const data = await safeJson(res);
        if (!data) {
            lastSyscomDiag = `prod_null_json_${res.status}`;
            return [];
        }
        const productosCrudos = data.productos || [];
        lastSyscomDiag = `ok_count_${productosCrudos.length}`;

        // Solo necesitamos el tipo de cambio oficial para mostrar el precio base en MXN en el catálogo
        // Optimizamos: Si ya nos pasaron los valores, no los volvemos a pedir a la BD
        const exchangeRate = providedExchangeRate ?? await obtenerTipoCambioSyscom();
        const vatRate = providedVatRate ?? await getVatRate();
        const margin = providedMargin ?? await getProfitMargin();
 
        let productos = productosCrudos.map((p: any) => mapearProductoSyscom(p, exchangeRate, vatRate, margin));

        // Client-side sorts for values not supported by Syscom API
        if (orden === 'titulo_asc') {
            productos.sort((a: any, b: any) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
        } else if (orden === 'titulo_desc') {
            productos.sort((a: any, b: any) => b.name.localeCompare(a.name, 'es', { sensitivity: 'base' }));
        } else if (orden === 'precio_desc') {
            productos.sort((a: any, b: any) => b.price - a.price);
        }
        // Note: 'precio' (asc) is handled by Syscom API directly above

        return productos;

    } catch (error: any) {
        lastSyscomDiag = `prod_err:${error?.message || String(error)}`;
        console.error("Fallo obteniendo productos de Mérida:", error);
        return [];
    }
}

/**
 * Búsqueda Semántica con IA Oficial de Syscom (/api/v1/productos/busqueda-ia)
 * Busca por intención en lenguaje natural (ej. "cámara domo para exterior con visión nocturna que resista lluvia").
 */
export async function busquedaIASyscom(
    consulta: string,
    pagina = 1,
    signal?: AbortSignal
): Promise<{ productos: Product[]; total: number; query: string }> {
    const token = await obtenerTokenSyscom();
    if (!token || !consulta || consulta.trim() === '') {
        return { productos: [], total: 0, query: consulta };
    }

    try {
        const url = new URL(`${API_URL}/productos/busqueda-ia`);
        url.searchParams.set('busqueda', consulta.trim());
        url.searchParams.set('pagina', String(pagina));
        url.searchParams.set('informacion_pro', 'true');

        const res = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                ...SYSCOM_HEADERS,
                'Authorization': `Bearer ${token}`
            },
            next: { revalidate: 60 },
            signal: signal
        });

        if (!res.ok) {
            console.warn("Syscom Busqueda IA status:", res.status, "haciendo fallback...");
            const fallbackProds = await getProductosSyscomMerida(undefined, consulta, undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, pagina);
            return { productos: fallbackProds, total: fallbackProds.length, query: consulta };
        }

        const data = await safeJson(res);
        if (!data) return { productos: [], total: 0, query: consulta };

        const productosCrudos = data.productos || [];
        const [exchangeRate, vatRate, margin] = await Promise.all([
            obtenerTipoCambioSyscom(),
            getVatRate(),
            getProfitMargin()
        ]);

        const productos = productosCrudos.map((p: any) => mapearProductoSyscom(p, exchangeRate, vatRate, margin));
        return {
            productos,
            total: data.cantidad || productos.length,
            query: consulta
        };
    } catch (error) {
        console.error("Error en Syscom Búsqueda IA:", error);
        return { productos: [], total: 0, query: consulta };
    }
}

/**
 * Obtiene el tipo de cambio del día oficial de Syscom para conversiones USD -> MXN
 */
export async function obtenerTipoCambioSyscom(): Promise<number> {
    if (cachedExchangeRate && Date.now() < exchangeRateExpiracion) {
        return cachedExchangeRate;
    }

    const token = await obtenerTokenSyscom();
    if (!token) return cachedExchangeRate || 19.5; // Fallback comercial realista para Syscom
    try {
        const res = await fetch(`${API_URL}/tipocambio`, {
            headers: {
                ...SYSCOM_HEADERS,
                'Authorization': `Bearer ${token}`
            },
            next: { revalidate: 1800 } 
        });
        if (!res.ok) return cachedExchangeRate || 17.5;
        const data = await safeJson(res);
        if (!data) return cachedExchangeRate || 17.5;
        // PRIORIDAD: Usamos el tipo de cambio oficial (normal/especial) que usa la App de Syscom,
        // no el de 'vuelto' que suele ser más caro (venta).
        const rate = parseFloat(data.normal || data.especial || data.vuelto) || 17.5;
        cachedExchangeRate = rate;
        exchangeRateExpiracion = Date.now() + 1800000; // 30 min cache
        return rate;
    } catch {
        return cachedExchangeRate || 17.5;
    }
}

const productByIdCache = new Map<string, { product: Product; expiresAt: number }>();

/**
 * Obtiene 1 solo producto detallado de Syscom usando su modelo o ID
 */
export async function getProductoSyscomById(idOModelo: string): Promise<Product | null> {
    const cacheKey = String(idOModelo).trim();
    const cached = productByIdCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
        return cached.product;
    }

    const token = await obtenerTokenSyscom();
    if (!token) return null;

    try {
        const res = await fetch(`${API_URL}/productos/${idOModelo}`, {
            method: 'GET',
            headers: {
                ...SYSCOM_HEADERS,
                'Authorization': `Bearer ${token}`
            },
            next: { revalidate: 60 } 
        });

        if (!res.ok) return null;

        const p = await safeJson(res);
        if (!p) return null;

        // Extraer la descripción rica con imágenes, tablas y videos oficiales
        const richHtml = await fetchRichHtmlDescription(p.link, p.link_privado);
        if (richHtml) {
            p.descripcion = richHtml;
        }
        
        const [exchangeRate, vatRate, margin] = await Promise.all([
            obtenerTipoCambioSyscom(),
            getVatRate(),
            getProfitMargin()
        ]);
        const mapped = mapearProductoSyscom(p, exchangeRate, vatRate, margin);
        if (productByIdCache.size > 100) {
            const firstKey = productByIdCache.keys().next().value;
            if (firstKey) productByIdCache.delete(firstKey);
        }
        productByIdCache.set(cacheKey, { product: mapped, expiresAt: Date.now() + 60000 });
        return mapped;

    } catch (error) {
        console.error(`Fallo obteniendo producto individual ${idOModelo}:`, error);
        return null;
    }
}

/**
 * Extrae la descripción HTML completa de la ficha oficial de Syscom (con imágenes, banners, tablas y videos)
 */
async function fetchRichHtmlDescription(link?: string, linkPrivado?: string): Promise<string | null> {
    if (typeof window !== 'undefined') return null;
    try {
        const targetUrl = link ? `https://www.syscom.mx${link.startsWith('/') ? link : '/' + link}` : linkPrivado;
        if (!targetUrl) return null;

        const res = await fetch(targetUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            next: { revalidate: 86400 }
        });
        if (!res.ok) return null;
        const html = await res.text();
        const startMarker = '<div class="descripcion-erp';
        const startIndex = html.indexOf(startMarker);
        if (startIndex === -1) return null;

        const contentStart = html.indexOf('>', startIndex) + 1;
        const sub = html.substring(contentStart);
        const match = sub.match(/([\s\S]*?)(<\/div>\s*<\/div>\s*<\/div>)/);
        let extracted = match ? match[1].trim() : sub.substring(0, 50000).trim();

        // Enrutar imágenes a través de nuestro image-proxy en máxima calidad (S1000 / 1200px)
        extracted = extracted.replace(/src=['"](https?:\/\/ftp3\.syscom\.mx[^'"]+)['"]/gi, (match, url) => {
            let upgraded = url;
            if (upgraded.includes('/cdn-cgi/image/')) {
                upgraded = upgraded.replace(/\/cdn-cgi\/image\/[^/]+\//, '/cdn-cgi/image/format=auto,width=1200,quality=95/');
            }
            upgraded = upgraded.replace(/S[0-9]{3,4}\.(PNG|JPG|JPEG|webp|png|jpg|jpeg)/, 'S1000.$1');
            return `src="/api/image-proxy?url=${encodeURIComponent(upgraded)}"`;
        });

        // Limpiar srcset para evitar que el navegador solicite versiones pequeñas de baja resolución
        extracted = extracted.replace(/srcset=['"][^'"]+['"]/gi, '');

        return extracted;
    } catch {
        return null;
    }
}

/**
 * Obtiene los accesorios compatibles de un producto desde la API de Syscom
 */
export async function getAccesoriosSyscom(productoId: string): Promise<Product[]> {
    const token = await obtenerTokenSyscom();
    if (!token) return [];

    try {
        const res = await fetch(`${API_URL}/productos/${productoId}/accesorios`, {
            method: 'GET',
            headers: {
                ...SYSCOM_HEADERS,
                'Authorization': `Bearer ${token}`
            },
            next: { revalidate: 3600 }
        });
        if (!res.ok) return [];
        const raw = await safeJson(res);
        if (!Array.isArray(raw)) return [];

        const [exchangeRate, vatRate, margin] = await Promise.all([
            obtenerTipoCambioSyscom(),
            getVatRate(),
            getProfitMargin()
        ]);
        return raw.map(p => mapearProductoSyscom(p, exchangeRate, vatRate, margin));
    } catch {
        return [];
    }
}

/**
 * Obtiene los productos relacionados de un producto desde la API de Syscom
 */
export async function getRelacionadosSyscom(productoId: string): Promise<Product[]> {
    const token = await obtenerTokenSyscom();
    if (!token) return [];

    try {
        const res = await fetch(`${API_URL}/productos/${productoId}/relacionados`, {
            method: 'GET',
            headers: {
                ...SYSCOM_HEADERS,
                'Authorization': `Bearer ${token}`
            },
            next: { revalidate: 3600 }
        });
        if (!res.ok) return [];
        const raw = await safeJson(res);
        if (!Array.isArray(raw)) return [];

        const [exchangeRate, vatRate, margin] = await Promise.all([
            obtenerTipoCambioSyscom(),
            getVatRate(),
            getProfitMargin()
        ]);
        return raw.map(p => mapearProductoSyscom(p, exchangeRate, vatRate, margin));
    } catch {
        return [];
    }
}

function buildFallbackL1Categories(): Category[] {
    const FALLBACK_IMG = 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop';
    return FALLBACK_L1_RAW.map(c => ({
        id: String(c.id),
        name: c.nombre,
        description: '',
        isFeatured: true,
        featuredImageUrl: getCategoryImageByName(c.nombre) || FALLBACK_IMG,
        parentId: null,
        level: 1 as const,
    }));
}

/**
 * Obtiene las categorías nativas de Syscom
 */
export async function getCategoriasSyscom(includeSubcategories = true): Promise<Category[]> {
    if (!includeSubcategories && cachedCategoriesL1 && Date.now() < categoriesL1Expiracion) {
        return cachedCategoriesL1;
    }
    if (includeSubcategories && cachedCategoriesAll && Date.now() < categoriesAllExpiracion) {
        return cachedCategoriesAll;
    }

    const token = await obtenerTokenSyscom();
    if (!token) return cachedCategoriesAll || cachedCategoriesL1 || buildFallbackL1Categories();

    try {
        const res = await fetch(`${API_URL}/categorias`, {
            method: 'GET',
            headers: {
                ...SYSCOM_HEADERS,
                'Authorization': `Bearer ${token}`
            },
            cache: 'no-store'
        });

        const level1 = res.ok ? await safeJson(res) : null;
        const categoriasCrudas = Array.isArray(level1) && level1.length > 0 ? level1 : FALLBACK_L1_RAW;
        
        const results: Category[] = [];

        // Map for Premium Category Images (dynamic, based on category name instead of ID)
        const FALLBACK_IMG = 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop';

        // Mapeamos nivel 1 - FILTRAMOS MARKETING AQUÍ TAMBIÉN
        for (const c of categoriasCrudas) {
            if (String(c.id) === '65747') continue; // Saltamos Marketing

            results.push({
                id: String(c.id),
                name: c.nombre || 'Categoría',
                description: '',
                isFeatured: true, // Las principales las marcamos como destacadas por defecto
                featuredImageUrl: getCategoryImageByName(c.nombre || '') || FALLBACK_IMG,
                parentId: null,
                level: 1 as const
            });
        }

        cachedCategoriesL1 = [...results];
        categoriesL1Expiracion = Date.now() + 3600000; // 1 hora

        if (!includeSubcategories) {
            return results;
        }

        // Por defecto traemos las subcategorías (Level 2) para todas las secciones principales
        // Filtramos 'Marketing' y cualquier otra que no sea de producto real
        const level1ToFetch = categoriasCrudas.filter(c => String(c.id) !== '65747');
        
        const subCatPromises = level1ToFetch.map(async (parent) => {
            try {
                const subRes = await fetch(`${API_URL}/categorias/${parent.id}`, {
                    headers: {
                        ...SYSCOM_HEADERS,
                        'Authorization': `Bearer ${token}`
                    },
                    cache: 'no-store'
                });
                if (!subRes.ok) return [];
                const data = await safeJson(subRes);
                if (!data) return [];
                
                // La API de Syscom devuelve las subcategorías en la propiedad 'subcategorias'
                const subs = Array.isArray(data) ? data : (data.subcategorias || []);
                
                return subs.map((s: any) => ({
                    id: String(s.id),
                    name: s.nombre || 'Subcategoría',
                    description: '',
                    isFeatured: false,
                    featuredImageUrl: '',
                    parentId: String(parent.id),
                    level: 2 as const
                }));
            } catch {
                return [];
            }
        });

        const subResults = await Promise.all(subCatPromises);
        subResults.flat().forEach(s => results.push(s));

        cachedCategoriesAll = results;
        categoriesAllExpiracion = Date.now() + 3600000; // 1 hora

        return results;

    } catch (error) {
        console.error("Fallo obteniendo categorias de Syscom:", error);
        return cachedCategoriesAll || cachedCategoriesL1 || buildFallbackL1Categories();
    }
}

/**
 * Mapeo completo de sucursales de Syscom por Estado de México
 */
export const SUCURSALES_POR_ESTADO: Record<string, {id: string, nombre: string}[]> = {
  "Aguascalientes": [{ id: "aguascalientes", nombre: "Aguascalientes" }],
  "Baja California": [{ id: "tijuana", nombre: "Tijuana" }],
  "Baja California Sur": [{ id: "la_paz", nombre: "La Paz" }],
  "CDMX": [
    { id: "mexico_norte", nombre: "México Norte" },
    { id: "mexico_sur", nombre: "México Sur" }
  ],
  "Chihuahua": [
    { id: "chihuahua", nombre: "Chihuahua" },
    { id: "chihuahua_norte", nombre: "Chihuahua Norte" },
    { id: "juarez", nombre: "Ciudad Juárez" }
  ],
  "Coahuila": [{ id: "torreon", nombre: "Torreón" }],
  "Estado de México": [
    { id: "tepotzotlan", nombre: "Tepotzotlán" },
    { id: "toluca", nombre: "Toluca" }
  ],
  "Guanajuato": [{ id: "leon", nombre: "León" }],
  "Jalisco": [{ id: "guadalajara", nombre: "Guadalajara" }],
  "Nuevo León": [
    { id: "monterrey", nombre: "Monterrey" },
    { id: "monterrey_centro", nombre: "Monterrey Centro" }
  ],
  "Puebla": [{ id: "puebla", nombre: "Puebla" }],
  "Querétaro": [{ id: "queretaro", nombre: "Querétaro" }],
  "Quintana Roo": [{ id: "cancun", nombre: "Cancún" }],
  "San Luis Potosí": [{ id: "san_luis_potosi", nombre: "San Luis Potosí" }],
  "Sinaloa": [{ id: "culiacan", nombre: "Culiacán" }],
  "Sonora": [{ id: "hermosillo", nombre: "Hermosillo" }],
  "Tabasco": [{ id: "villahermosa", nombre: "Villahermosa" }],
  "Veracruz": [{ id: "veracruz", nombre: "Veracruz" }],
  "Yucatán": [{ id: "merida", nombre: "Mérida (Matriz)" }]
};

/**
 * Obtiene el listado de sucursales de Syscom
 */
export async function getSucursalesSyscom(): Promise<{id: string, nombre: string}[]> {
    // Retornamos la lista aplanada para compatibilidad con selectores simples o 
    // permitimos que el componente use el mapeo de estados directamente.
    const allSucursales = Object.values(SUCURSALES_POR_ESTADO).flat();
    return allSucursales;
}

/**
 * Obtiene SOLO las categorías de nivel 1 de Syscom (ligero, para feed/export).
 * Cache de 24 horas — perfecto para feeds que se regeneran cada hora.
 * Filtra Marketing (65747) automáticamente.
 */
export async function getCategoriasSyscomL1(): Promise<{ id: string; nombre: string }[]> {
    const token = await obtenerTokenSyscom();
    if (!token) return [];

    try {
        const res = await fetch(`${API_URL}/categorias`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            next: { revalidate: 86400 } // Cache 24 horas
        });

        if (!res.ok) return [];

        const data = await safeJson(res);
        if (!data || !Array.isArray(data)) return [];

        return data
            .filter((c: any) => String(c.id) !== '65747') // Filtrar Marketing
            .map((c: any) => ({ id: String(c.id), nombre: c.nombre || 'Categoría' }));
    } catch (error) {
        console.error("Fallo obteniendo categorías L1 de Syscom:", error);
        return [];
    }
}

/**
 * Mapea una categoría de Syscom a un ID de taxonomía de Google Shopping.
 * Usa keywords del nombre de la categoría para determinar la mejor coincidencia.
 * https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt
 */
export function getGoogleCategoryByName(nombre: string): string {
    const n = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    if (n.includes('video') || n.includes('camara') || n.includes('vigilancia') || n.includes('cctv')) return '505306'; // Surveillance Cameras
    if (n.includes('acceso') || n.includes('biometrico') || n.includes('cerradura')) return '505304'; // Access Control
    if (n.includes('red') || n.includes('networking') || n.includes('switch') || n.includes('router')) return '262'; // Networking
    if (n.includes('radio') || n.includes('comunicacion')) return '614'; // Two-way Radios
    if (n.includes('cable') || n.includes('fibra') || n.includes('estructurado')) return '3144'; // Cables
    if (n.includes('energia') || n.includes('solar') || n.includes('ups') || n.includes('fuente')) return '5945'; // Power Supplies
    if (n.includes('fuego') || n.includes('incendio') || n.includes('humo')) return '505303'; // Security & Alarms (Fire)
    if (n.includes('intrusion') || n.includes('alarma')) return '499960'; // Security Alarms
    if (n.includes('computo') || n.includes('computadora') || n.includes('laptop') || n.includes('servidor')) return '278'; // Computers
    if (n.includes('telefon') || n.includes('telefonia')) return '267'; // Telephony
    if (n.includes('herramienta') || n.includes('herraje')) return '455'; // Tools
    if (n.includes('audio') || n.includes('video') || n.includes('bocina') || n.includes('sonido')) return '305'; // Audio/Video
    if (n.includes('automatizacion') || n.includes('smart') || n.includes('domotica')) return '499960'; // Smart Home Security
    
    return '222'; // Electronics (fallback genérico)
}

/**
 * Mapea una categoría de Syscom a un nombre legible para Mercado Libre.
 */
export function getMLCategoryName(nombre: string): string {
    const n = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    if (n.includes('video') || n.includes('camara') || n.includes('vigilancia')) return 'Cámaras y Sistemas de Seguridad';
    if (n.includes('acceso') || n.includes('biometrico')) return 'Control de Acceso';
    if (n.includes('red') || n.includes('networking') || n.includes('switch')) return 'Redes y Conectividad';
    if (n.includes('radio') || n.includes('comunicacion')) return 'Radiocomunicación';
    if (n.includes('cable') || n.includes('fibra') || n.includes('estructurado')) return 'Cableado Estructurado';
    if (n.includes('energia') || n.includes('solar') || n.includes('ups')) return 'Fuentes de Energía y UPS';
    if (n.includes('fuego') || n.includes('incendio') || n.includes('humo')) return 'Detección de Incendio y Alarmas';
    if (n.includes('intrusion') || n.includes('alarma')) return 'Sistemas de Intrusión';
    if (n.includes('computo') || n.includes('computadora')) return 'Cómputo y Periféricos';
    if (n.includes('telefon')) return 'Telefonía y Comunicaciones';
    if (n.includes('herramienta') || n.includes('herraje')) return 'Herramientas y Herrajes';
    if (n.includes('audio') || n.includes('bocina')) return 'Audio y Video Profesional';
    
    return nombre; // Usar el nombre original como fallback
}

/**
 * Mapea el nombre de una categoría Syscom a una imagen representativa (Unsplash).
 */
export function getCategoryImageByName(nombre: string): string {
    const n = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    if (n.includes('video') || n.includes('camara') || n.includes('vigilancia')) return 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=800&auto=format&fit=crop';
    if (n.includes('acceso') || n.includes('biometrico')) return 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=800&auto=format&fit=crop';
    if (n.includes('red') || n.includes('networking') || n.includes('switch')) return 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=800&auto=format&fit=crop';
    if (n.includes('radio') || n.includes('comunicacion')) return 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=800&auto=format&fit=crop';
    if (n.includes('cable') || n.includes('fibra') || n.includes('estructurado')) return 'https://images.unsplash.com/photo-1498084393753-b411b2d25b34?q=80&w=800&auto=format&fit=crop';
    if (n.includes('energia') || n.includes('solar') || n.includes('ups')) return 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=800&auto=format&fit=crop';
    if (n.includes('fuego') || n.includes('incendio') || n.includes('humo')) return 'https://images.unsplash.com/photo-1582139329536-e7284fece509?q=80&w=800&auto=format&fit=crop';
    if (n.includes('intrusion') || n.includes('alarma')) return 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=800&auto=format&fit=crop';
    
    return 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop'; // Fallback tech
}

