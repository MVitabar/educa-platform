# 📚 Educa Platform - Backend

Backend API para la plataforma educativa, desarrollado con Node.js, Express, TypeScript y MongoDB. Proporciona endpoints RESTful para la gestión de usuarios, cursos, lecciones, inscripciones y seguimiento de progreso.

## 🚀 Características Principales

- **Autenticación JWT** con roles de usuario (estudiante, instructor, administrador)
- **Gestión completa de cursos** con categorías, secciones y lecciones
- **Sistema de inscripciones** a cursos con seguimiento de progreso
- **Dashboard** para estudiantes e instructores
- **Sistema de valoraciones** para cursos
- **API RESTful** documentada con Swagger/OpenAPI
- **Validación de datos** con express-validator
- **Manejo de errores** centralizado
- **Seguridad** con rate limiting, sanitización de datos y protección contra XSS
- **Pruebas unitarias y de integración**
- **Variables de entorno** para configuración flexible

## 📋 Requisitos Previos

- Node.js (v18+)
- pnpm (v8+)
- MongoDB (local o Atlas)
- Git

## 🛠️ Instalación

1. Clonar el repositorio:
   ```bash
   git clone https://github.com/MVitabar/educa-platform.git
   cd educa-platform/backend
   ```

2. Instalar dependencias:
   ```bash
   pnpm install
   ```

3. Configurar variables de entorno:
   ```bash
   cp .env.example .env
   ```
   Editar el archivo `.env` con tus configuraciones.

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/educa-platform

# JWT
JWT_SECRET=tu_jwt_secret
JWT_EXPIRES_IN=90d
JWT_COOKIE_EXPIRES=90

# Email (opcional para recuperación de contraseña)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USERNAME=tu-email@gmail.com
EMAIL_PASSWORD=tu-password
EMAIL_FROM=Educa Platform <noreply@educa.com>

# Frontend URL (para CORS)
CLIENT_URL=http://localhost:3000
```

## 🚦 Ejecución

### Desarrollo

```bash
pnpm dev
```

### Producción

```bash
pnpm build
pnpm start
```

## 📚 Documentación de la API

La documentación interactiva de la API está disponible en:
- **Swagger UI**: `http://localhost:5000/api-docs`
- **Esquema OpenAPI**: `http://localhost:5000/api-docs.json`

### 🔐 Autenticación

La mayoría de los endpoints requieren autenticación mediante JWT. Incluye el token en el header de la solicitud:

```http
Authorization: Bearer tu_token_jwt
```

### 🛣️ Endpoints Principales

### Autenticación
- `POST /api/v1/auth/register` - Registrar nuevo usuario
- `POST /api/v1/auth/login` - Iniciar sesión
- `GET /api/v1/auth/me` - Obtener perfil del usuario actual
- `POST /api/v1/auth/forgot-password` - Solicitar restablecimiento de contraseña
- `PATCH /api/v1/auth/reset-password/:token` - Restablecer contraseña
- `POST /api/v1/auth/logout` - Cerrar sesión

### Usuarios
- `GET /api/v1/users` - Listar usuarios (admin)
- `POST /api/v1/users` - Crear usuario (admin)
- `GET /api/v1/users/:id` - Obtener usuario por ID
- `PATCH /api/v1/users/:id` - Actualizar usuario (propietario/admin)
- `DELETE /api/v1/users/:id` - Eliminar usuario (admin)

### Cursos
- `GET /api/v1/courses` - Listar cursos con filtros
- `POST /api/v1/courses` - Crear curso (instructor/admin)
- `GET /api/v1/courses/:id` - Obtener curso por ID
- `PATCH /api/v1/courses/:id` - Actualizar curso (propietario/admin)
- `DELETE /api/v1/courses/:id` - Eliminar curso (propietario/admin)
- `GET /api/v1/courses/category/:categoryId` - Obtener cursos por categoría

### Secciones
- `GET /api/v1/courses/:courseId/sections` - Listar secciones de un curso
- `POST /api/v1/courses/:courseId/sections` - Crear sección (instructor propietario)
- `PATCH /api/v1/sections/:id` - Actualizar sección (instructor propietario)
- `DELETE /api/v1/sections/:id` - Eliminar sección (instructor propietario)
- `PATCH /api/v1/sections/:id/reorder` - Reordenar secciones

### Lecciones
- `GET /api/v1/sections/:sectionId/lessons` - Listar lecciones de una sección
- `POST /api/v1/sections/:sectionId/lessons` - Crear lección (instructor propietario)
- `GET /api/v1/lessons/:id` - Obtener lección por ID
- `PATCH /api/v1/lessons/:id` - Actualizar lección (instructor propietario)
- `DELETE /api/v1/lessons/:id` - Eliminar lección (instructor propietario)

### Recursos
- `POST /api/v1/lessons/:lessonId/resources` - Añadir recurso a lección
- `GET /api/v1/lessons/:lessonId/resources` - Obtener recursos de lección
- `DELETE /api/v1/resources/:id` - Eliminar recurso (instructor propietario)

### Inscripciones
- `POST /api/v1/enrollments` - Inscribirse a un curso (estudiante)
- `GET /api/v1/enrollments/me` - Mis inscripciones (estudiante)
- `GET /api/v1/courses/:courseId/enrollments` - Ver inscripciones (instructor propietario/admin)
- `PATCH /api/v1/enrollments/:enrollmentId/status` - Actualizar estado de inscripción (instructor/admin)

### Progreso
- `POST /api/v1/lessons/:id/complete` - Marcar lección como completada
- `GET /api/v1/courses/:id/progress` - Obtener progreso del curso
- `GET /api/v1/progress/me` - Obtener mi progreso general

### Valoraciones
- `POST /api/v1/courses/:courseId/reviews` - Crear reseña (estudiante inscrito)
- `GET /api/v1/courses/:courseId/reviews` - Ver reseñas de un curso
- `PUT /api/v1/reviews/:id` - Actualizar reseña (propietario)
- `DELETE /api/v1/reviews/:id` - Eliminar reseña (propietario/admin)

### Categorías
- `GET /api/v1/categories` - Listar categorías
- `GET /api/v1/categories/:id` - Obtener categoría por ID
- `POST /api/v1/categories` - Crear categoría (admin)
- `PATCH /api/v1/categories/:id` - Actualizar categoría (admin)
- `DELETE /api/v1/categories/:id` - Eliminar categoría (admin)

### Dashboard
#### Para Estudiantes
- `GET /api/v1/dashboard/students/me` - Perfil del estudiante
- `GET /api/v1/dashboard/students/me/dashboard-stats` - Estadísticas del dashboard
- `GET /api/v1/dashboard/students/me/courses` - Cursos del estudiante
- `GET /api/v1/dashboard/students/me/recent-lessons` - Lecciones recientes

#### Para Instructores
- `GET /api/v1/dashboard/instructors/me` - Perfil del instructor
- `GET /api/v1/dashboard/instructors/me/dashboard-stats` - Estadísticas del dashboard
- `GET /api/v1/dashboard/instructors/me/courses` - Cursos del instructor
- `GET /api/v1/dashboard/instructors/me/students` - Estudiantes del instructor
- `GET /api/v1/dashboard/instructors/me/revenue` - Ingresos del instructor

### 📦 Modelos de Datos

### Usuario (User)
```typescript
{
  _id: string;
  name: string;
  email: string;
  password: string;
  role: 'student' | 'instructor' | 'admin';
  avatar?: string;
  bio?: string;
  isActive: boolean;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

### Curso (Course)
```typescript
{
  _id: string;
  title: string;
  slug: string;
  description: string;
  instructor: User | string;
  price: number;
  duration: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string | Category;
  image: string;
  isPublished: boolean;
  rating: {
    average: number;
    count: number;
  };
  studentsEnrolled: number;
  sections: string[] | Section[];
  requirements: string[];
  learningOutcomes: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Sección (Section)
```typescript
{
  _id: string;
  title: string;
  description?: string;
  course: string | Course;
  order: number;
  lessons: string[] | Lesson[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Lección (Lesson)
```typescript
{
  _id: string;
  title: string;
  description?: string;
  section: string | Section;
  course: string | Course;
  content: string;
  videoUrl?: string;
  duration: number; // in minutes
  order: number;
  isFreePreview: boolean;
  isPublished: boolean;
  resources: string[] | Resource[];
  createdAt: Date;
  updatedAt: Date;
}
```

### Inscripción (Enrollment)
```typescript
{
  _id: string;
  student: string | User;
  course: string | Course;
  status: 'active' | 'completed' | 'dropped';
  completedLessons: string[] | Lesson[];
  progress: number; // 0-100
  enrolledAt: Date;
  completedAt?: Date;
  lastAccessed?: Date;
}
```

### Progreso (Progress)
```typescript
{
  _id: string;
  student: string | User;
  course: string | Course;
  lesson: string | Lesson;
  isCompleted: boolean;
  completedAt?: Date;
  timeSpent: number; // in seconds
  lastAccessed: Date;
}
```

### Valoración (Review)
```typescript
{
  _id: string;
  student: string | User;
  course: string | Course;
  rating: number; // 1-5
  comment?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### Categoría (Category)
```typescript
{
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/         # Configuraciones de la aplicación
│   │   ├── index.ts    # Configuración principal
│   │   └── swagger.ts  # Configuración de Swagger/OpenAPI
│   │
│   ├── controllers/    # Controladores de la API
│   │   ├── auth.controller.ts        # Autenticación y autorización
│   │   ├── categories.controller.ts  # Gestión de categorías
│   │   ├── courses.controller.ts     # Gestión de cursos
│   │   ├── dashboard.controller.ts   # Dashboard para usuarios
│   │   ├── enrollments.controller.ts # Inscripciones a cursos
│   │   ├── lessons.controller.ts     # Gestión de lecciones
│   │   ├── progress.controller.ts    # Seguimiento de progreso
│   │   ├── resources.controller.ts   # Recursos de lecciones
│   │   ├── reviews.controller.ts     # Valoraciones de cursos
│   │   ├── sections.controller.ts    # Secciones de cursos
│   │   └── users.controller.ts       # Gestión de usuarios
│   │
│   ├── middlewares/    # Middlewares personalizados
│   │   ├── auth.middleware.ts  # Autenticación y autorización
│   │   └── error.middleware.ts # Manejo de errores
│   │
│   ├── models/         # Modelos de Mongoose
│   │   ├── category.model.ts    # Modelo de categorías
│   │   ├── course.model.ts      # Modelo de cursos
│   │   ├── enrollment.model.ts  # Modelo de inscripciones
│   │   ├── lesson.model.ts      # Modelo de lecciones
│   │   ├── progress.model.ts    # Modelo de progreso
│   │   ├── review.model.ts      # Modelo de valoraciones
│   │   ├── section.model.ts     # Modelo de secciones
│   │   └── user.model.ts        # Modelo de usuarios
│   │
│   ├── routes/         # Rutas de la API
│   │   ├── auth.routes.ts        # Rutas de autenticación
│   │   ├── categories.routes.ts  # Rutas de categorías
│   │   ├── courses.routes.ts     # Rutas de cursos
│   │   ├── dashboard.routes.ts   # Rutas del dashboard
│   │   ├── enrollments.routes.ts # Rutas de inscripciones
│   │   ├── index.ts             # Exportación de rutas
│   │   ├── lessons.routes.ts     # Rutas de lecciones
│   │   ├── progress.routes.ts    # Rutas de progreso
│   │   ├── resources.routes.ts   # Rutas de recursos
│   │   ├── reviews.routes.ts     # Rutas de valoraciones
│   │   ├── sections.routes.ts    # Rutas de secciones
│   │   └── users.routes.ts       # Rutas de usuarios
│   │
│   ├── services/      # Lógica de negocio
│   │   └── index.ts  # Exportación de servicios
│   │
│   ├── types/         # Tipos TypeScript
│   │   └── ...       # Definiciones de tipos
│   │
│   ├── utils/         # Utilidades
│   │   ├── apiError.ts     # Clase de error personalizada
│   │   ├── apiResponse.ts  # Formato de respuesta estandarizado
│   │   ├── asyncHandler.ts # Manejador de funciones asíncronas
│   │   └── upload.ts       # Utilidades para carga de archivos
│   │
│   └── validations/   # Esquemas de validación
│       └── index.ts   # Exportación de validaciones
│
├── tests/             # Pruebas unitarias y de integración
├── .env.example       # Ejemplo de variables de entorno
├── package.json       # Dependencias y scripts
└── tsconfig.json      # Configuración de TypeScript
│   ├── utils/          # Utilidades
│   └── index.ts        # Punto de entrada
├── tests/             # Pruebas
├── .env.example       # Ejemplo de variables de entorno
└── package.json
```

## 🧪 Pruebas

El proyecto incluye pruebas unitarias y de integración para garantizar la calidad del código.

### Ejecutar pruebas

```bash
# Todas las pruebas
pnpm test

# Pruebas en modo watch
pnpm test:watch

# Generar cobertura de código
pnpm test:coverage

# Pruebas de integración
pnpm test:integration
```

### Estructura de pruebas

```
tests/
├── unit/           # Pruebas unitarias
│   ├── controllers/
│   ├── models/
│   └── services/
└── integration/    # Pruebas de integración
    ├── auth/
    ├── courses/
    └── users/
```

## 🔧 Comandos Útiles

- `pnpm dev`: Inicia el servidor en modo desarrollo
- `pnpm build`: Compila el código TypeScript
- `pnpm start`: Inicia el servidor en producción
- `pnpm lint`: Ejecuta el linter
- `pnpm format`: Formatea el código

## 🛠️ Dependencias Principales

### Runtime
- **Node.js** - Entorno de ejecución
- **Express** - Framework web
- **TypeScript** - Tipado estático
- **Mongoose** - ODM para MongoDB

### Seguridad
- **jsonwebtoken** - Autenticación JWT
- **bcryptjs** - Hash de contraseñas
- **helmet** - Seguridad HTTP
- **express-rate-limit** - Limitación de peticiones
- **hpp** - Protección contra ataques HTTP Parameter Pollution
- **xss-clean** - Prevención de XSS

### Validación
- **express-validator** - Validación de datos
- **joi** - Validación de esquemas

### Documentación
- **swagger-jsdoc** - Generación de documentación OpenAPI
- **swagger-ui-express** - Interfaz de documentación interactiva

### Desarrollo
- **ts-node-dev** - Recarga en caliente
- **nodemon** - Reinicio automático en desarrollo
- **typescript** - Soporte para TypeScript
- **ts-node** - Ejecución de TypeScript

### Calidad de Código
- **ESLint** - Linter de JavaScript/TypeScript
- **Prettier** - Formateo de código
- **Husky** - Git hooks
- **lint-staged** - Ejecución de linters en archivos preparados

### Pruebas
- **Jest** - Framework de pruebas
- **supertest** - Pruebas HTTP
- **mongodb-memory-server** - Base de datos en memoria para pruebas

## 🚀 Despliegue

### Vercel

1. Instala Vercel CLI:
   ```bash
   pnpm add -g vercel
   ```

2. Inicia sesión:
   ```bash
   vercel login
   ```

3. Configura las variables de entorno en Vercel

4. Despliega:
   ```bash
   vercel --prod
   ```

### Docker

```bash
docker build -t educa-platform-backend .
docker run -p 5000:5000 educa-platform-backend
```

## 🤝 Contribución

1. Haz un fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Haz push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

Desarrollado con ❤️ por MVitabar
