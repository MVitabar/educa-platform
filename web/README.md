# 🎓 Educa Platform - Frontend

Aplicación web moderna para la plataforma educativa, desarrollada con Next.js 13+, TypeScript, Tailwind CSS y React. Proporciona una interfaz intuitiva para estudiantes e instructores.

## 🚀 Características Principales

- **Autenticación** con NextAuth.js
- **Dashboard** para estudiantes e instructores
- **Gestión de cursos** con vista previa en tiempo real
- **Sistema de aprendizaje** con seguimiento de progreso
- **Diseño responsivo** con Tailwind CSS
- **Tipado estático** con TypeScript
- **Rutas dinámicas** con App Router de Next.js
- **Optimización de imágenes** con Next/Image
- **Temas claros y oscuros**

## 🛠️ Tecnologías Utilizadas

- **Framework**: Next.js 13+ (App Router)
- **Lenguaje**: TypeScript
- **Estilos**: Tailwind CSS con personalización
- **Autenticación**: NextAuth.js
- **Formularios**: React Hook Form
- **Validación**: Zod
- **Peticiones HTTP**: Axios
- **Gestión de estado**: React Context API
- **UI Components**: Shadcn/ui (basado en Radix UI)
- **Iconos**: Lucide React
- **Animaciones**: Framer Motion

## 📋 Requisitos Previos

- Node.js (v18+)
- pnpm (recomendado) o npm/yarn
- Cuenta en el backend de Educa Platform

## 🛠️ Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/MVitabar/educa-platform.git
   cd educa-platform/web
   ```

2. Instalar dependencias:
   ```bash
   pnpm install
   # o
   npm install
   ```

3. Configurar variables de entorno:
   ```bash
   cp .env.local.example .env.local
   ```
   Editar el archivo `.env.local` con tus configuraciones.

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto con las siguientes variables:

```env
# Next.js
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=tu_secreto_seguro

# Autenticación
NEXT_PUBLIC_GOOGLE_CLIENT_ID=
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET=

# Configuración de la aplicación
NEXT_PUBLIC_APP_NAME=Educa Platform
NEXT_PUBLIC_APP_DESCRIPTION=Plataforma de aprendizaje en línea
```

## 🚦 Ejecución

### Desarrollo

```bash
pnpm dev
# o
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

### Producción

1. Construir la aplicación:
   ```bash
   pnpm build
   ```

2. Iniciar el servidor de producción:
   ```bash
   pnpm start
   ```

## 📁 Estructura del Proyecto

```
web/
├── public/              # Archivos estáticos (imágenes, fuentes, etc.)
├── src/
│   ├── app/             # Rutas de la aplicación (App Router)
│   │   ├── (auth)/      # Rutas de autenticación
│   │   ├── (dashboard)/ # Rutas del dashboard
│   │   ├── api/         # Rutas de la API
│   │   ├── auth/        # Páginas de autenticación
│   │   ├── courses/     # Páginas de cursos
│   │   ├── dashboard/   # Páginas del dashboard
│   │   └── teach/       # Páginas para instructores
│   │
│   ├── components/      # Componentes reutilizables
│   │   ├── auth/        # Componentes de autenticación
│   │   ├── course/      # Componentes de cursos
│   │   ├── dashboard/   # Componentes del dashboard
│   │   ├── layout/      # Componentes de diseño
│   │   ├── ui/          # Componentes de UI personalizados
│   │   └── ...
│   │
│   ├── hooks/           # Custom Hooks
│   ├── lib/             # Utilidades y configuraciones
│   │   ├── api/         # Cliente HTTP y configuraciones de API
│   │   └── validations/ # Esquemas de validación
│   │
│   ├── providers/       # Proveedores de contexto
│   ├── services/        # Servicios de la aplicación
│   ├── types/           # Tipos TypeScript
│   └── styles/          # Estilos globales
│
├── .env.local           # Variables de entorno locales
├── next.config.js       # Configuración de Next.js
├── tailwind.config.ts   # Configuración de Tailwind CSS
└── tsconfig.json        # Configuración de TypeScript
```

## 🎨 Diseño y Estilos

El proyecto utiliza Tailwind CSS para los estilos, con una paleta de colores personalizada:

- **Colores principales**: Azules y púrpuras
- **Temas**: Soporte para tema claro y oscuro
- **Diseño**: Totalmente responsivo

### Personalización de colores

Los colores se pueden personalizar en `tailwind.config.ts`:

```typescript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary-500)',
          50: 'var(--color-primary-50)',
          // ... más tonos
        },
        secondary: {
          DEFAULT: 'var(--color-secondary-500)',
          // ... más tonos
        },
      },
    },
  },
}
```

## 📚 Documentación Adicional

- [Guía de Componentes](./docs/COMPONENTS.md)
- [Guía de Estilo](./docs/STYLE_GUIDE.md)
- [API Reference](./docs/API_REFERENCE.md)

## 🤝 Contribución

1. Haz un fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Haz push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](./LICENSE) para más detalles.

---

Desarrollado con ❤️ por el equipo de Educa Platform

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
