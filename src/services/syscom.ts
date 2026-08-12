// src/services/syscom.ts

import type { Product, Category } from '@/lib/types';
import { getExchangeRate, getVatRate, getProfitMargin } from './settingsService';

const CLIENT_ID = process.env.SYSCOM_CLIENT_ID;
const CLIENT_SECRET = process.env.SYSCOM_CLIENT_SECRET;
const API_URL = process.env.SYSCOM_API_URL || 'https://developers.syscom.mx/api/v1';
const TOKEN_URL = process.env.SYSCOM_TOKEN_URL || 'https://developers.syscom.mx/oauth/token';

let cachedToken: string | null = null;
let tokenExpiracion: number = 0;

export const FALLBACK_CATEGORIES: Category[] = [
  { id: '22', name: 'Videovigilancia', description: 'Cámaras IP, DVRs, NVRs y accesorios', isFeatured: true, featuredImageUrl: 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=800&auto=format&fit=crop', parentId: null, level: 1 },
  { id: 'acceso', name: 'Control de Acceso', description: 'Biométricos, torniquetes y chapas electromagnéticas', isFeatured: true, featuredImageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=800&auto=format&fit=crop', parentId: null, level: 1 },
  { id: 'redes', name: 'Redes y Networking', description: 'Switches, routers, antenas y fibra óptica', isFeatured: true, featuredImageUrl: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=800&auto=format&fit=crop', parentId: null, level: 1 },
  { id: 'radio', name: 'Radiocomunicación', description: 'Radios portátiles, móviles y repetidoras', isFeatured: true, featuredImageUrl: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=800&auto=format&fit=crop', parentId: null, level: 1 },
  { id: 'cableado', name: 'Cableado Estructurado', description: 'Cable UTP, patch cords, racks y gabinetes', isFeatured: true, featuredImageUrl: 'https://images.unsplash.com/photo-1498084393753-b411b2d25b34?q=80&w=800&auto=format&fit=crop', parentId: null, level: 1 },
  { id: 'energia', name: 'Energía y Solar', description: 'Paneles solares, inversores, UPS y fuentes de poder', isFeatured: true, featuredImageUrl: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=800&auto=format&fit=crop', parentId: null, level: 1 },
  { id: 'intrusion', name: 'Intrusión y Alarmas', description: 'Paneles de alarma, sensores de movimiento y sirenas', isFeatured: true, featuredImageUrl: 'https://images.unsplash.com/photo-1558002038-1055907df827?q=80&w=800&auto=format&fit=crop', parentId: null, level: 1 },
  { id: 'fuego', name: 'Detección de Fuego', description: 'Detectores de humo, palancas y estrobos', isFeatured: true, featuredImageUrl: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?q=80&w=800&auto=format&fit=crop', parentId: null, level: 1 },
];

/**
 * Obtiene el token de Siscom y lo guarda en caché local hasta que expire
 */
async function obtenerTokenSyscom(): Promise<string | null> {
  if (cachedToken && Date.now() < tokenExpiracion - 300000) {
    return cachedToken;
  }

  if (!CLIENT_ID || !CLIENT_SECRET) {
      console.warn("Autenticación Syscom: Faltan credenciales SYSCOM_CLIENT_ID / SYSCOM_CLIENT_SECRET en .env.local");
      return null;
  }

  try {
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type', 'client_credentials');

    const res = await fetch(TOKEN_URL, {
      method: 'POST',
      body: params,
    });

    if (!res.ok) {
        console.warn("Autenticación Syscom REST API: Credenciales no válidas. Usando catálogo CSV de respaldo.");
        return null;
    }

    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiracion = Date.now() + (data.expires_in * 1000 || 3600000); 
    
    return cachedToken;
  } catch (error) {
    console.warn("Fallo de red al pedir token Syscom:", error);
    return null;
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
 * Obtiene el tipo de cambio oficial de Syscom
 */
export async function obtenerTipoCambioSyscom(): Promise<number> {
    const token = await obtenerTokenSyscom();
    if (!token) return await getExchangeRate();

    try {
        const res = await fetch(`${API_URL}/tipocambio`, {
            headers: { 'Authorization': `Bearer ${token}` },
            next: { revalidate: 3600 }
        });
        if (!res.ok) return await getExchangeRate();
        const data = await safeJson(res);
        const tc = parseFloat(data?.normal || data?.tipo_cambio || '0');
        return tc > 1 ? tc : await getExchangeRate();
    } catch {
        return await getExchangeRate();
    }
}

/**
 * Convierte el formato crudo de Syscom a nuestro formato local `Product`
 */
function mapearProductoSyscom(p: any, exchangeRate: number, vatRate: number, profitMargin: number = 0): Product {
    let miImagen = p.img_portada;
    if (!miImagen && p.imagenes && p.imagenes.length > 0) {
         miImagen = p.imagenes[0].imagen || p.imagenes[0].url || miImagen;
    }
    if (!miImagen || miImagen === "null" || miImagen === "") {
         miImagen = "https://placehold.co/600x400.png";
    }

    const rawPrice = parseFloat(p.precios?.precio_descuento || p.precios?.precio_especial || p.precios?.precio_lista || "0");
    const monedaRaw = String(p.precios?.moneda || '').toUpperCase();
    const isMxn = monedaRaw === 'MXN';
    
    const effectiveTC = isMxn ? 1 : (exchangeRate > 1.1 ? exchangeRate : 17.5);
    const baseMxn = rawPrice * effectiveTC;
    const costInMxn = baseMxn;
    const priceBeforeTax = costInMxn * (1 + profitMargin);
    const finalPrice = priceBeforeTax * (1 + vatRate);

    return {
        id: String(p.producto_id), 
        name: p.titulo || 'Producto sin título',
        description: p.descripcion || '',
        price: parseFloat(finalPrice.toFixed(2)),
        currency: 'MXN',
        costPrice: parseFloat(costInMxn.toFixed(2)),
        profitMargin: profitMargin,
        imageUrls: Array.isArray(p.imagenes) && p.imagenes.length > 0 
            ? p.imagenes.map((img: any) => img.imagen) 
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
        puntos_clave: Array.isArray(p.puntos_clave) ? p.puntos_clave : [],
        marca_logo: p.marca_logo || '',
        precio_lista: parseFloat((parseFloat(p.precios?.precio_lista || "0") * effectiveTC * (1 + profitMargin) * (1 + vatRate)).toFixed(2)),
        precio_especial: parseFloat((parseFloat(p.precios?.precio_especial || "0") * effectiveTC * (1 + profitMargin) * (1 + vatRate)).toFixed(2)),
        precio_descuento: parseFloat(finalPrice.toFixed(2)),
        categorias_adicionales: Array.isArray(p.categorias) ? p.categorias : []
    };
}

/**
 * Obtiene el Catálogo Nacional de Syscom (REST API o Fallback CSV)
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
    providedExchangeRate?: number,
    providedVatRate?: number,
    providedMargin?: number,
    signal?: AbortSignal
): Promise<Product[]> {
    const token = await obtenerTokenSyscom();
    
    // Si no hay token de la API REST, usamos el catálogo CSV masivo como respaldo de alta velocidad
    if (!token) {
        try {
            const { downloadAndParseSyscomCsv } = await import('./syscomCsvSync');
            const { products } = await downloadAndParseSyscomCsv();
            if (products.length > 0) {
                let filtered = products;
                if (categoria && categoria !== 'all') {
                    const catLower = categoria.toLowerCase();
                    filtered = filtered.filter(p => p.category?.toLowerCase().includes(catLower) || p.categoryId?.toLowerCase() === catLower);
                }
                if (busqueda && busqueda.trim() !== '') {
                    const q = busqueda.toLowerCase().trim();
                    filtered = filtered.filter(p => p.name.toLowerCase().includes(q) || p.line.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
                }
                if (marca && marca.trim() !== '') {
                    const m = marca.toLowerCase().trim();
                    filtered = filtered.filter(p => p.brand.toLowerCase().includes(m));
                }
                if (enExistencia) {
                    filtered = filtered.filter(p => p.stock > 0);
                }
                return filtered.slice(0, 40);
            }
        } catch (e) {
            console.warn("Fallo obteniendo productos del catálogo CSV:", e);
        }
        return [];
    }

    try {
        const url = new URL(`${API_URL}/productos`);
        url.searchParams.append('stock', 'true');

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

        if (!hasMandatoryFilter) {
            url.searchParams.set('categoria', '22');
        }

        const res = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            signal,
            next: { revalidate: 60 }
        });

        if (!res.ok) {
            console.error(`Syscom API respondió ${res.status} al buscar productos`);
            return [];
        }

        const data = await safeJson(res);
        if (!data || !Array.isArray(data.productos)) {
            return [];
        }

        const [exchangeRate, vatRate, profitMargin] = await Promise.all([
            providedExchangeRate ?? obtenerTipoCambioSyscom(),
            providedVatRate ?? getVatRate(),
            providedMargin ?? getProfitMargin()
        ]);

        return data.productos.map((p: any) => mapearProductoSyscom(p, exchangeRate, vatRate, profitMargin));

    } catch (error) {
        console.error("Fallo obteniendo productos de Syscom:", error);
        return [];
    }
}

/**
 * Obtiene un producto individual por ID o Modelo
 */
export async function getProductoSyscomById(idOModelo: string): Promise<Product | null> {
    const token = await obtenerTokenSyscom();
    
    if (!token) {
        try {
            const { downloadAndParseSyscomCsv } = await import('./syscomCsvSync');
            const { products } = await downloadAndParseSyscomCsv();
            const found = products.find(p => p.id === idOModelo || p.line?.toLowerCase() === idOModelo.toLowerCase());
            if (found) return found;
        } catch (e) {
            console.warn("Fallo buscando producto individual en CSV:", e);
        }
        return null;
    }

    try {
        const res = await fetch(`${API_URL}/productos/${idOModelo}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            },
            next: { revalidate: 3600 }
        });

        if (!res.ok) return null;

        const data = await safeJson(res);
        if (!data || !data.producto_id) return null;

        const [exchangeRate, vatRate, profitMargin] = await Promise.all([
            obtenerTipoCambioSyscom(),
            getVatRate(),
            getProfitMargin()
        ]);

        return mapearProductoSyscom(data, exchangeRate, vatRate, profitMargin);

    } catch (error) {
        console.error(`Fallo obteniendo producto individual ${idOModelo}:`, error);
        return null;
    }
}

/**
 * Obtiene las categorías nativas de Syscom
 */
export async function getCategoriasSyscom(): Promise<Category[]> {
    const token = await obtenerTokenSyscom();
    if (!token) return FALLBACK_CATEGORIES;

    try {
        const res = await fetch(`${API_URL}/categorias`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            next: { revalidate: 86400 } 
        });

        if (!res.ok) return FALLBACK_CATEGORIES;

        const level1 = await safeJson(res);
        if (!level1 || !Array.isArray(level1)) return FALLBACK_CATEGORIES;
        
        const results: Category[] = [];
        const FALLBACK_IMG = 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop';

        for (const c of level1) {
            if (String(c.id) === '65747') continue;

            results.push({
                id: String(c.id),
                name: c.nombre || 'Categoría',
                description: '',
                isFeatured: true,
                featuredImageUrl: getCategoryImageByName(c.nombre || '') || FALLBACK_IMG,
                parentId: null,
                level: 1 as const
            });
        }

        return results.length > 0 ? results : FALLBACK_CATEGORIES;

    } catch (error) {
        console.error("Fallo obteniendo categorias de Syscom:", error);
        return FALLBACK_CATEGORIES;
    }
}

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

export async function getSucursalesSyscom(): Promise<{id: string, nombre: string}[]> {
    return Object.values(SUCURSALES_POR_ESTADO).flat();
}

export async function getCategoriasSyscomL1(): Promise<{ id: string; nombre: string }[]> {
    const token = await obtenerTokenSyscom();
    if (!token) {
        return FALLBACK_CATEGORIES.map(c => ({ id: c.id, nombre: c.name }));
    }

    try {
        const res = await fetch(`${API_URL}/categorias`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` },
            next: { revalidate: 86400 }
        });

        if (!res.ok) return FALLBACK_CATEGORIES.map(c => ({ id: c.id, nombre: c.name }));

        const data = await safeJson(res);
        if (!data || !Array.isArray(data)) return FALLBACK_CATEGORIES.map(c => ({ id: c.id, nombre: c.name }));

        return data
            .filter((c: any) => String(c.id) !== '65747')
            .map((c: any) => ({ id: String(c.id), nombre: c.nombre || 'Categoría' }));
    } catch (error) {
        return FALLBACK_CATEGORIES.map(c => ({ id: c.id, nombre: c.name }));
    }
}

export function getGoogleCategoryByName(nombre: string): string {
    const n = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    if (n.includes('video') || n.includes('camara') || n.includes('vigilancia') || n.includes('cctv')) return '505306';
    if (n.includes('acceso') || n.includes('biometrico') || n.includes('cerradura')) return '505304';
    if (n.includes('red') || n.includes('networking') || n.includes('switch') || n.includes('router')) return '262';
    if (n.includes('radio') || n.includes('comunicacion')) return '614';
    if (n.includes('cable') || n.includes('fibra') || n.includes('estructurado')) return '3144';
    if (n.includes('energia') || n.includes('solar') || n.includes('ups') || n.includes('fuente')) return '5945';
    if (n.includes('fuego') || n.includes('incendio') || n.includes('humo')) return '505303';
    if (n.includes('intrusion') || n.includes('alarma')) return '499960';
    if (n.includes('computo') || n.includes('computadora') || n.includes('laptop') || n.includes('servidor')) return '278';
    if (n.includes('telefon') || n.includes('telefonia')) return '267';
    if (n.includes('herramienta') || n.includes('herraje')) return '455';
    if (n.includes('audio') || n.includes('video') || n.includes('bocina') || n.includes('sonido')) return '305';
    if (n.includes('automatizacion') || n.includes('smart') || n.includes('domotica')) return '499960';
    
    return '222';
}

export function getMLCategoryName(nombre: string): string {
    const n = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (n.includes('video') || n.includes('camara') || n.includes('vigilancia')) return 'Cámaras y Sistemas de Seguridad';
    if (n.includes('acceso') || n.includes('biometrico')) return 'Control de Acceso';
    if (n.includes('red') || n.includes('networking')) return 'Redes y Telecomunicaciones';
    if (n.includes('radio')) return 'Radiocomunicación';
    if (n.includes('energia') || n.includes('solar')) return 'Energía Solar y Respaldos';
    if (n.includes('intrusion') || n.includes('alarma')) return 'Alarmas y Sensores';
    return 'Seguridad y Tecnología';
}

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
    return 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=800&auto=format&fit=crop';
}
