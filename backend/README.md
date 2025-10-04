# 📚 Educa Platform - Backend

Backend API para la plataforma educativa, desarrollado con Node.js, Express, TypeScript y MongoDB. Proporciona endpoints RESTful para la gestión de usuarios, cursos, lecciones, inscripciones y seguimiento de progreso.

## 🚀 Características Principales

- **Autenticación JWT** con roles de usuario (estudiante, instructor, administrador)
- **Gestión completa de cursos** con categorías y lecciones
- **Sistema de inscripciones** a cursos
- **Seguimiento de progreso** de estudiantes
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

#### Autenticación
- `POST /api/v1/auth/register` - Registrar nuevo usuario
- `POST /api/v1/auth/login` - Iniciar sesión
- `GET /api/v1/auth/me` - Obtener perfil del usuario actual
- `POST /api/v1/auth/forgot-password` - Solicitar restablecimiento de contraseña
- `PATCH /api/v1/auth/reset-password/:token` - Restablecer contraseña

#### Usuarios
- `GET /api/v1/users` - Obtener todos los usuarios (admin)
- `GET /api/v1/users/:id` - Obtener usuario por ID
- `PATCH /api/v1/users/:id` - Actualizar usuario
- `DELETE /api/v1/users/:id` - Eliminar usuario (admin)

#### Cursos
- `GET /api/v1/courses` - Listar todos los cursos con filtros
- `POST /api/v1/courses` - Crear nuevo curso (instructor/admin)
- `GET /api/v1/courses/:id` - Obtener curso por ID
- `PATCH /api/v1/courses/:id` - Actualizar curso (propietario/admin)
- `DELETE /api/v1/courses/:id` - Eliminar curso (propietario/admin)

#### Lecciones
- `GET /api/v1/lessons/course/:courseId` - Obtener lecciones de un curso
- `POST /api/v1/lessons` - Crear nueva lección (instructor/admin)
- `PATCH /api/v1/lessons/:id` - Actualizar lección (propietario/admin)
- `DELETE /api/v1/lessons/:id` - Eliminar lección (propietario/admin)

#### Inscripciones
- `POST /api/v1/enrollments` - Inscribirse a un curso
- `GET /api/v1/enrollments/me` - Mis inscripciones
- `GET /api/v1/enrollments/course/:courseId` - Estudiantes inscritos (instructor/admin)

#### Progreso
- `GET /api/v1/progress/course/:courseId` - Obtener progreso del curso
- `POST /api/v1/progress/course/:courseId/track` - Registrar progreso de lección
- `POST /api/v1/progress/course/:courseId/complete` - Marcar lección como completada

#### Categorías
- `GET /api/v1/categories` - Obtener todas las categorías
- `GET /api/v1/categories/:id` - Obtener categoría por ID
- `POST /api/v1/categories` - Crear categoría (admin)
- `PATCH /api/v1/categories/:id` - Actualizar categoría (admin)
- `DELETE /api/v1/categories/:id` - Eliminar categoría (admin)

### 📦 Esquemas de Datos

#### Usuario (User)
```typescript
{
  _id: string;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  avatar?: string;
  bio?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Curso (Course)
```typescript
{
  _id: string;
  title: string;
  description: string;
  instructor: User | string;
  price: number;
  duration: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  category: string;
  image: string;
  isPublished: boolean;
  rating: {
    average: number;
    count: number;
  };
  studentsEnrolled: number;
  createdAt: Date;
  updatedAt: Date;
}
```

## 📁 Estructura del Proyecto

```
backend/
├── src/
│   ├── config/         # Configuraciones
│   ├── controllers/    # Controladores
│   ├── interfaces/     # Interfaces TypeScript
│   ├── middlewares/    # Middlewares de Express
│   ├── models/         # Modelos de MongoDB
│   ├── routes/         # Rutas de la API
│   ├── services/       # Lógica de negocio
│   ├── types/          # Tipos TypeScript
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
