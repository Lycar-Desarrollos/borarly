
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    // El proyecto compila sin errores de tipos (`npm run typecheck`), asi que ya no
    // se silencian: un error de tipos debe detener el deploy en lugar de llegar a produccion.
    ignoreBuildErrors: false,
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
      // Dominios de imagenes del catalogo Syscom (portadas, fichas y logos de marca).
      {
        protocol: 'https',
        hostname: '**.syscom.mx',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ftp3.syscom.mx',
        port: '',
        pathname: '/**',
      },
      // NOTA: se evita `hostname: '**'` a proposito. Cualquier imagen de un origen no
      // listado debe pasar por /api/image-proxy, que valida el destino antes de descargarlo.
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
