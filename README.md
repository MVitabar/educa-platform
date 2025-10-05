# 🎓 Educa Platform

Plataforma educativa integral que ofrece una experiencia de aprendizaje en línea tanto para estudiantes como para instructores. Desarrollada con tecnologías modernas para garantizar un rendimiento óptimo y una excelente experiencia de usuario.

## 🌟 Características Principales

- **Aprendizaje en línea** con seguimiento de progreso
- **Dashboard interactivo** para estudiantes e instructores
- **Gestión completa de cursos** con lecciones y recursos multimedia
- **Sistema de autenticación** seguro con múltiples proveedores
- **Interfaz responsiva** que se adapta a cualquier dispositivo
- **Temas claro y oscuro** para mayor comodidad visual

## 🏗️ Estructura del Proyecto

```
educa-platform/
│
├── backend/                  # API del servidor (Node.js + Express + MongoDB)
│   ├── src/
│   │   ├── config/          # Configuraciones (DB, servidor, etc.)
│   │   ├── controllers/     # Controladores de la API
│   │   ├── middlewares/     # Middlewares de Express
│   │   ├── models/          # Modelos de MongoDB
│   │   ├── routes/          # Rutas de la API
│   │   ├── services/        # Lógica de negocio
│   │   └── utils/           # Utilidades
│   └── README.md            # Documentación del backend
│
├── web/                     # Aplicación web (Next.js 13+)
│   ├── public/              # Archivos estáticos
│   └── src/
│       ├── app/             # Rutas de la aplicación (App Router)
│       ├── components/      # Componentes reutilizables
│       ├── hooks/           # Custom Hooks
│       ├── lib/             # Utilidades y configuraciones
│       ├── providers/       # Proveedores de contexto
│       ├── services/        # Servicios de la aplicación
│       └── types/           # Tipos TypeScript
│
├── mobile/                  # Aplicación móvil (React Native - En desarrollo)
│   ├── android/             # Configuración de Android
│   ├── ios/                 # Configuración de iOS
│   └── src/                 # Código fuente
│       ├── components/      # Componentes reutilizables
│       ├── screens/         # Pantallas de la aplicación
│       ├── services/        # Llamadas a la API
│       └── navigation/      # Configuración de navegación
│
└── shared/                  # Código compartido entre frontend y backend
    ├── types/              # Tipos compartidos
    └── utils/              # Utilidades compartidas
```

## 🛠️ Tecnologías Principales

### Backend
- **Node.js** con **TypeScript**
- **Express.js** como framework web
- **MongoDB** con **Mongoose** para la base de datos
- **JWT** para autenticación
- **Swagger/OpenAPI** para documentación

### Frontend Web
- **Next.js 13+** con App Router
- **React 18+** con Hooks
- **TypeScript** para tipado estático
- **Tailwind CSS** para estilos
- **NextAuth.js** para autenticación
- **React Hook Form** + **Zod** para formularios

### Móvil (En desarrollo)
- **React Native**
- **React Navigation**
- **Redux Toolkit** para gestión de estado

## 🚀 Empezando

### Requisitos previos

- Node.js (v18+)
- pnpm (recomendado) o npm/yarn
- MongoDB (local o Atlas)
- Git

### Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/MVitabar/educa-platform.git
   cd educa-platform
   ```

2. Configurar el backend:
   ```bash
   cd backend
   pnpm install
   cp .env.example .env
   # Editar .env con tus configuraciones
   ```

3. Configurar el frontend web:
   ```bash
   cd ../web
   pnpm install
   cp .env.local.example .env.local
   # Editar .env.local con tus configuraciones
   ```

4. Iniciar los servicios:
   ```bash
   # En una terminal (backend)
   cd backend
   pnpm dev

   # En otra terminal (frontend)
   cd ../web
   pnpm dev
   ```

5. Abrir en el navegador:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - API Docs: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
```

## 🗄️ Estructura de la Base de Datos (MongoDB)

### Colecciones principales:
- `users` - Usuarios (estudiantes, instructores y administradores)
- `courses` - Cursos con metadatos y configuración
- `sections` - Secciones que organizan las lecciones de los cursos
- `lessons` - Lecciones con contenido multimedia
- `resources` - Recursos adicionales para las lecciones
- `enrollments` - Inscripciones de estudiantes a cursos
- `progress` - Seguimiento del progreso de los estudiantes
- `reviews` - Valoraciones y reseñas de los cursos
- `categories` - Categorías para organizar los cursos

## 🧪 Entornos de Desarrollo

### Desarrollo Local
- **Backend**: `http://localhost:5000`
- **Frontend Web**: `http://localhost:3000`
- **API Docs**: `http://localhost:5000/api-docs`

### Producción
- **URL de Producción**: [https://educa-platform.vercel.app](https://educa-platform.vercel.app)
- **API de Producción**: [https://api.educa-platform.com](https://api.educa-platform.com)

## 📚 Documentación

- [Documentación de la API](./backend/README.md)
- [Guía de Estilo](./web/docs/STYLE_GUIDE.md)
- [Arquitectura del Frontend](./web/docs/ARCHITECTURE.md)
- [Guía de Contribución](./CONTRIBUTING.md)

## 🤝 Contribución

¡Las contribuciones son bienvenidas! Por favor, lee nuestra [guía de contribución](CONTRIBUTING.md) para más detalles sobre nuestro código de conducta y el proceso para enviar pull requests.

1. Haz un fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Haz push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## ✨ Agradecimientos

- A todos los contribuyentes que han ayudado a mejorar esta plataforma
- A la comunidad de código abierto por las increíbles herramientas utilizadas

---

Desarrollado con ❤️ por el equipo de Educa Platform
