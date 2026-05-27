
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'shop.pchconnect.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.pchmayoreo.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/**',
      },
      // ADVERTENCIA: El siguiente patrón permite cualquier hostname bajo HTTPS.
      // Esto puede tener implicaciones de seguridad y rendimiento.
      // Asegúrate de comprender los riesgos antes de usarlo en producción.
      // Se recomienda enfáticamente usar hostnames específicos y de confianza siempre que sea posible.
      {
        protocol: 'https',
        hostname: '**', // Permite cualquier hostname
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
