/** @type {import('next').NextConfig} */
import withPWA from 'next-pwa';

const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      'images.unsplash.com',
      'source.unsplash.com',
      'via.placeholder.com',
      'loremflickr.com',
      'res.cloudinary.com',
      'img.youtube.com',
      'i.ytimg.com'
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Configuración para internacionalización
  i18n: {
    locales: ['es'],
    defaultLocale: 'es',
  },
  // Mejoras de rendimiento
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  // Headers de seguridad
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
};

// Configuración de PWA
const pwaConfig = {
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
};

// Aplicar configuración de PWA si no estamos en desarrollo
const configWithPWA = process.env.NODE_ENV === 'production' 
  ? withPWA(nextConfig, pwaConfig) 
  : nextConfig;

// Enable ES modules
export default configWithPWA;
