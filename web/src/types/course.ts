// Niveles de curso

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

// Interfaz base del curso
export interface CourseBase {
  _id?: string;
  title: string;
  description: string;
  category: string;
  price: number;
  level: CourseLevel;
  isFree: boolean;
  requirements: string[];
  learningOutcomes: string[];
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Interfaz para la creación/actualización de cursos
export interface CourseFormData extends Omit<CourseBase, '_id' | 'createdAt' | 'updatedAt'> {
  image?: File | string;
  imageUrl?: string; // Para previsualización
}

// Interfaz para la respuesta de la API
export interface CourseResponse extends Omit<CourseBase, 'image'> {
  _id: string;
  imageUrl: string;
  instructor: {
    _id: string;
    name: string;
    avatar?: string;
  };
  students?: number;
  rating?: number;
  duration?: string;
  slug?: string;
  isEnrolled?: boolean;
}

// Tipo para el formulario de curso
export type CourseFormValues = Omit<CourseFormData, 'imageUrl'> & {
  image?: File | string;
};

// Datos de ejemplo (solo para desarrollo)
export const sampleCourses: CourseResponse[] = [
  {
    _id: '1',
    title: 'Introducción a la Programación',
    description: 'Aprende los fundamentos de la programación desde cero con ejemplos prácticos.',
    imageUrl: '/images/courses/programming.jpg',
    instructor: {
      _id: 'instr1',
      name: 'Juan Pérez',
      avatar: '/images/avatars/instructor1.jpg'
    },
    price: 29.99,
    level: 'beginner',
    isFree: false,
    requirements: ['No se requiere experiencia previa', 'Computadora con acceso a internet'],
    learningOutcomes: ['Fundamentos de programación', 'Lógica de programación', 'Resolución de problemas'],
    rating: 4.7,
    students: 1245,
    duration: '8 horas',
    slug: 'introduccion-a-la-programacion',
    category: 'programacion',
    isPublished: true,
    createdAt: '2023-01-15T00:00:00.000Z',
    updatedAt: '2023-01-15T00:00:00.000Z'
  },
  {
    _id: '2',
    title: 'Diseño Web Moderno',
    description: 'Crea sitios web atractivos y responsivos con las últimas tecnologías web.',
    imageUrl: '/images/courses/web-design.jpg',
    instructor: {
      _id: 'instr2',
      name: 'Ana García',
      avatar: '/images/avatars/instructor2.jpg'
    },
    price: 39.99,
    level: 'intermediate',
    isFree: false,
    requirements: ['Conocimientos básicos de HTML y CSS', 'Computadora con editor de código'],
    learningOutcomes: ['Diseño responsivo', 'Frameworks CSS modernos', 'Buenas prácticas de diseño'],
    rating: 4.8,
    students: 987,
    duration: '12 horas',
    slug: 'diseno-web-moderno',
    category: 'diseno-web',
    isPublished: true,
    createdAt: '2023-02-20T00:00:00.000Z',
    updatedAt: '2023-02-20T00:00:00.000Z'
  },
  // Add more sample courses as needed
];
