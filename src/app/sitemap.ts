import { MetadataRoute } from 'next'
import { getCategories } from '@/services/productService'

/**
 * Sitemap optimizado: solo incluye URLs estables de categorías y páginas.
 * Los productos individuales se descubren via Google Merchant Center Feed (/feed.xml).
 * Esto evita llamadas masivas a la API de Syscom durante el build/revalidate,
 * reduciendo el consumo de funciones serverless en Netlify.
 */
export const revalidate = 86400; // Regenerar 1 vez al día

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let categoryUrls: MetadataRoute.Sitemap = [];

  try {
    const categories = await getCategories();
    categoryUrls = categories
      .filter(cat => cat.isVisible !== false)
      .map((cat) => ({
        url: `https://BORARLY.com/?category=${cat.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: cat.level === 1 ? 0.9 : 0.7,
      }));
  } catch (error) {
    console.error('Sitemap: error obteniendo categorías', error);
  }

  return [
    {
      url: 'https://BORARLY.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://BORARLY.com/services/web',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://BORARLY.com/feed.xml',
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.5,
    },
    ...categoryUrls,
  ];
}
