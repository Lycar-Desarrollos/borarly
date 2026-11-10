
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    SMTP_HOST: process.env.SMTP_HOST || 'smtp.hostinger.com',
    SMTP_PORT: process.env.SMTP_PORT || '465',
    SMTP_USER: process.env.SMTP_USER || 'ventas@borarly.com',
    SMTP_PASS: process.env.SMTP_PASS || '',
    SMTP_FROM: process.env.SMTP_FROM || 'Borarly Ventas <ventas@borarly.com>',
    SALES_NOTIFICATION_EMAIL: process.env.SALES_NOTIFICATION_EMAIL || 'ventas@borarly.com',
    NEXT_PUBLIC_OPENPAY_MERCHANT_ID: process.env.NEXT_PUBLIC_OPENPAY_MERCHANT_ID || '',
    NEXT_PUBLIC_OPENPAY_PUBLIC_KEY: process.env.NEXT_PUBLIC_OPENPAY_PUBLIC_KEY || '',
    NEXT_PUBLIC_OPENPAY_SANDBOX: process.env.NEXT_PUBLIC_OPENPAY_SANDBOX || 'true',
    OPENPAY_PRIVATE_KEY: process.env.OPENPAY_PRIVATE_KEY || '',
  },
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
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
