# Plataforma Educativa - Estructura del Proyecto

## Estructura de Carpetas

```
educa-platform/
│
├── mobile/                    # Aplicación móvil React Native
│   ├── android/              # Configuración específica de Android
│   ├── ios/                  # Configuración específica de iOS
│   └── src/                  # Código fuente de la aplicación
│       ├── api/              # Llamadas a la API y configuración
│       ├── assets/           # Recursos estáticos
│       │   ├── fonts/        # Fuentes personalizadas
│       │   ├── icons/        # Iconos de la aplicación
│       │   └── images/       # Imágenes y gráficos
│       ├── components/       # Componentes reutilizables
│       │   ├── common/       # Componentes comunes (botones, inputs, etc.)
│       │   ├── course/       # Componentes específicos de cursos
│       │   └── ui/           # Componentes de interfaz de usuario
│       ├── config/           # Configuración de la aplicación
│       ├── constants/        # Constantes y configuraciones
│       ├── context/          # Contextos de React
│       ├── hooks/            # Custom hooks
│       ├── models/           # Interfaces y tipos de TypeScript
│       ├── navigation/       # Configuración de navegación
│       ├── screens/          # Pantallas de la aplicación
│       │   ├── auth/        # Pantallas de autenticación
│       │   ├── course/      # Pantallas relacionadas con cursos
│       │   ├── profile/     # Perfil de usuario
│       │   └── dashboard/   # Dashboard de instructor/estudiante
│       ├── services/         # Servicios (API, autenticación, etc.)
│       ├── store/            # Estado global (Redux/Context)
│       ├── theme/            # Estilos y temas
│       └── utils/            # Utilidades y helpers
│
├── backend/                  # API del servidor
│   └── src/
│       ├── config/          # Configuraciones (DB, servidor, etc.)
│       ├── controllers/     # Controladores de la API
│       ├── middlewares/     # Middlewares de Express
│       ├── models/          # Modelos de MongoDB
│       ├── routes/          # Rutas de la API
│       ├── services/        # Lógica de negocio
│       └── utils/           # Utilidades
│
└── shared/                  # Código compartido
    ├── types/              # Tipos compartidos entre frontend/backend
    └── utils/              # Utilidades compartidas
```

## Estructura de la Base de Datos (MongoDB)

### Colecciones principales:
- `users` - Usuarios (estudiantes e instructores)
- `courses` - Cursos
- `lessons` - Lecciones de los cursos
- `enrollments` - Inscripciones a cursos
- `progress` - Progreso de los estudiantes
- `payments` - Transacciones de pago
- `assessments` - Evaluaciones y respuestas

## Instalación y Configuración

### Backend
1. Instalar dependencias: `cd backend && npm install`
2. Configurar variables de entorno en `.env`
3. Iniciar servidor: `npm run dev`

### Aplicación Móvil
1. Instalar dependencias: `cd mobile && npm install`
2. Configurar variables de entorno
3. Iniciar Metro: `npx react-native start`
4. Ejecutar en dispositivo/emulador: `npx react-native run-android/ios`

## Convenciones de Código
- Usar TypeScript en todo el proyecto
- Seguir el patrón de diseño de carpetas por características
- Nombrar componentes en PascalCase
- Usar hooks personalizados para la lógica reutilizable
- Documentar componentes y funciones importantes
