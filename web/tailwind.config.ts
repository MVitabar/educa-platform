import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Colores personalizados basados en tu paleta
        custom: {
          1: 'var(--color-custom-1, #622824)',
          2: 'var(--color-custom-2, #2f0618)',
          3: 'var(--color-custom-3, #412a9c)',
          4: 'var(--color-custom-4, #1b66ff)',
          5: 'var(--color-custom-5, #00cef5)',
        },
        // Paleta de colores principal
        primary: {
          DEFAULT: 'var(--color-primary-500, #6366f1)',
          50: 'var(--color-primary-50, #f0f5ff)',
          100: 'var(--color-primary-100, #e0eaff)',
          200: 'var(--color-primary-200, #c7d7fe)',
          300: 'var(--color-primary-300, #a5b4fc)',
          400: 'var(--color-primary-400, #818cf8)',
          500: 'var(--color-primary-500, #6366f1)',
          600: 'var(--color-primary-600, #4f46e5)',
          700: 'var(--color-primary-700, #4338ca)',
          800: 'var(--color-primary-800, #3730a3)',
          900: 'var(--color-primary-900, #312e81)',
        },
        // Colores secundarios
        secondary: {
          DEFAULT: 'var(--color-secondary-500, #0ea5e9)',
          50: 'var(--color-secondary-50, #f0f9ff)',
          100: 'var(--color-secondary-100, #e0f2fe)',
          200: 'var(--color-secondary-200, #bae6fd)',
          300: 'var(--color-secondary-300, #7dd3fc)',
          400: 'var(--color-secondary-400, #38bdf8)',
          500: 'var(--color-secondary-500, #0ea5e9)',
          600: 'var(--color-secondary-600, #0284c7)',
          700: 'var(--color-secondary-700, #0369a1)',
          800: 'var(--color-secondary-800, #075985)',
          900: 'var(--color-secondary-900, #0c4a6e)',
        },
        // Colores de acento
        accent: {
          DEFAULT: 'var(--color-accent-500, #8b5cf6)',
          50: 'var(--color-accent-50, #f5f3ff)',
          100: 'var(--color-accent-100, #ede9fe)',
          200: 'var(--color-accent-200, #ddd6fe)',
          300: 'var(--color-accent-300, #c4b5fd)',
          400: 'var(--color-accent-400, #a78bfa)',
          500: 'var(--color-accent-500, #8b5cf6)',
          600: 'var(--color-accent-600, #7c3aed)',
          700: 'var(--color-accent-700, #6d28d9)',
          800: 'var(--color-accent-800, #5b21b6)',
          900: 'var(--color-accent-900, #4c1d95)',
        },
        // Colores oscuros
        dark: {
          DEFAULT: 'var(--color-dark-900, #0f172a)',
          50: 'var(--color-dark-50, #f8fafc)',
          100: 'var(--color-dark-100, #f1f5f9)',
          200: 'var(--color-dark-200, #e2e8f0)',
          300: 'var(--color-dark-300, #cbd5e1)',
          400: 'var(--color-dark-400, #94a3b8)',
          500: 'var(--color-dark-500, #64748b)',
          600: 'var(--color-dark-600, #475569)',
          700: 'var(--color-dark-700, #334155)',
          800: 'var(--color-dark-800, #1e293b)',
          900: 'var(--color-dark-900, #0f172a)',
        },
        // Colores de error
        error: {
          DEFAULT: 'var(--color-error-500, #ef4444)',
          50: 'var(--color-error-50, #fef2f2)',
          100: 'var(--color-error-100, #fee2e2)',
          200: 'var(--color-error-200, #fecaca)',
          300: 'var(--color-error-300, #fca5a5)',
          400: 'var(--color-error-400, #f87171)',
          500: 'var(--color-error-500, #ef4444)',
          600: 'var(--color-error-600, #dc2626)',
          700: 'var(--color-error-700, #b91c1c)',
          800: 'var(--color-error-800, #991b1b)',
          900: 'var(--color-error-900, #7f1d1d)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      // Configuración del modo oscuro
      darkMode: { darkMode: 'class' },
    },
  },
  plugins: [
    typography,
    forms,
  ],
};

export default config;
