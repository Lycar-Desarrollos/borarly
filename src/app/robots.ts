import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: 'Googlebot',
        allow: '/',
      },
      {
        userAgent: 'Googlebot-image',
        allow: '/',
      },
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/*', '/api/*', '/cart', '/checkout', '/profile', '/profile/*', '/search'],
      },
      {
        userAgent: ['AhrefsBot', 'Screaming Frog SEO Spider', 'SemrushBot', 'DotBot', 'PetalBot', 'MJ12bot', 'Baiduspider'],
        disallow: '/',
      },
    ],
    sitemap: 'https://borarly.com/sitemap.xml',
  };
}
