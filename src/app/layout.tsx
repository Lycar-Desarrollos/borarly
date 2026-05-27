
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import './globals.css';
import { Providers } from './providers';
import { Toaster } from '@/components/ui/toaster';
import { Organization, WebSite, WithContext } from 'schema-dts';
import { JsonLd } from 'react-schemaorg';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://BORARLY.com'),
  title: {
    template: '%s | BORARLY Mayorista',
    default: 'BORARLY | Mayorista Tecnológico en Seguridad y Redes',
  },
  description: 'Distribuidor mayorista líder en equipo de seguridad electrónica, videovigilancia, redes, y cómputo. Encuentra las mejores marcas al mejor precio garantizado con BORARLY.',
  keywords: ['seguridad electrónica', 'mayorista de ciberseguridad', 'equipo de redes', 'Syscom', 'videovigilancia', 'computo', 'BORARLY', 'telecomunicaciones'],
  openGraph: {
    title: 'BORARLY | Mayorista Tecnológico',
    description: 'Distribuidor mayorista líder en equipo de seguridad electrónica, videovigilancia, redes, y cómputo.',
    url: 'https://BORARLY.com',
    siteName: 'BORARLY Mayorista',
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BORARLY | Mayorista Tecnológico',
    description: 'Distribuidor mayorista en seguridad electrónica y redes.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/icon-192.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationSchema: WithContext<Organization> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BORARLY Mayorista',
    url: 'https://BORARLY.com',
    description: 'Distribuidor mayorista líder en seguridad electrónica y redes.',
    logo: {
      '@type': 'ImageObject',
      url: 'https://BORARLY.com/icon-512.png',
      width: 512,
      height: 512,
    } as any,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'sales',
      areaServed: 'MX',
      availableLanguage: 'Spanish',
    } as any,
  };

  const websiteSchema: WithContext<WebSite> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BORARLY Mayorista',
    url: 'https://BORARLY.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://BORARLY.com/?search={search_term_string}',
      'query-input': 'required name=search_term_string'
    } as any
  };

  return (
    <html lang="es" suppressHydrationWarning>
      <head>
          <JsonLd item={organizationSchema as any} />
          <JsonLd item={websiteSchema as any} />
      </head>
      <body className={`${GeistSans.variable} font-sans antialiased flex flex-col min-h-screen`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
