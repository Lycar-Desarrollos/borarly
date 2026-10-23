import { MetadataRoute } from 'next'
import { getCategories, getProducts } from '@/services/productService'

/**
 * Sitemap: páginas estables, categorías y una muestra de productos (los mismos que
 * se pre-generan en /products/[id]) para que Google descubra cada ficha directamente,
 * además del Google Merchant Center Feed (/feed.xml).
 * Se regenera 1 vez al día para no saturar la API de Syscom.
 */
export const revalidate = 86400; // Regenerar 1 vez al día

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let categoryUrls: MetadataRoute.Sitemap = [];
  let productUrls: MetadataRoute.Sitemap = [];

  try {
    const products = await getProducts(undefined, undefined, 144);
    productUrls = products.map((p) => ({
      url: `https://borarly.com/products/${encodeURIComponent(p.id)}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Sitemap: error obteniendo productos', error);
  }

  try {
    const categories = await getCategories();
    categoryUrls = categories
      .filter(cat => cat.isVisible !== false)
      .map((cat) => ({
        url: `https://borarly.com/?category=${cat.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: cat.level === 1 ? 0.9 : 0.7,
      }));
  } catch (error) {
    console.error('Sitemap: error obteniendo categorías', error);
  }

  return [
    {
      url: 'https://borarly.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    // Quiénes Somos (crítico para Misrepresentation)
    {
      url: 'https://borarly.com/nosotros',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    // Políticas (requeridas por Google Merchant Center)
    {
      url: 'https://borarly.com/politicas/envios',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://borarly.com/politicas/devoluciones',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: 'https://borarly.com/politicas/privacidad',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: 'https://borarly.com/politicas/terminos',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // Servicios
    {
      url: 'https://borarly.com/services/web',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://borarly.com/services/chatbots',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://borarly.com/services/financial',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://borarly.com/services/support',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://borarly.com/services/value-projects',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Feed de Google Merchant Center
    {
      url: 'https://borarly.com/feed.xml',
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.5,
    },
    ...categoryUrls,
    ...productUrls,
  ];
}
