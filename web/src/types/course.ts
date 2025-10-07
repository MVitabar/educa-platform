// Niveles de curso
export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

// Interfaz para la imagen de Cloudinary
export interface CloudinaryImage {
  url: string;
  public_id: string;
  format: string;
  resource_type: 'image' | 'video' | 'raw';
  width?: number;
  height?: number;
  bytes: number;
}

// Interfaz base del curso
type CourseId = {
  id: string;
  _id?: never;
} | {
  _id: string;
  id?: never;
} | {
  id: string;
  _id: string;
};

export type CourseBase = CourseId & {
  title: string;
  description: string;
  category: string;
  price: number;
  level: CourseLevel;
  image: string | CloudinaryImage;
  requirements: string[];
  learningOutcomes: string[];
  isPublished: boolean;
  isFree: boolean;
  isFeatured?: boolean;
  tags: string[];
  slug: string;
  createdAt: string | { $date: string };
  updatedAt: string | { $date: string };
  __v?: number;
};

// Función helper para obtener el ID de un curso
export function getCourseId(course: CourseBase): string {
  if ('id' in course && course.id) return course.id;
  if ('_id' in course && course._id) return course._id;
  throw new Error('Course must have either id or _id');
}

// Interfaz para la respuesta de la API
export interface CourseResponse extends Omit<CourseBase, 'instructor' | 'rating'> {
  // Incluimos tanto id como _id para compatibilidad
  id?: string;
  _id?: string;
  instructor: {
    _id: string;
    name?: string;
    avatar?: string;
  };
  rating?: {
    average: number;
    count: number;
  };
}

// Interfaz para la creación/actualización de cursos
export interface CourseFormData extends Omit<CourseBase, '_id' | 'createdAt' | 'updatedAt' | 'rating' | '__v'> {
  imageFile?: File; // Para nuevas imágenes
  instructor?: string; // ID del instructor
}

// Función para manejar fechas que pueden venir como string o objeto { $date: string }
export function parseDateField(date: string | { $date: string } | undefined): string | undefined {
  if (!date) return undefined;
  if (typeof date === 'string') return date;
  return date.$date;
}

// Datos de ejemplo (solo para desarrollo)
export const sampleCourses: CourseResponse[] = [
  {
    _id: '68e3e1982b639829dc3daafe',
    title: 'Curso de Desarrollo Web',
    description: 'Aprende desarrollo web desde cero con las últimas tecnologías.',
    image: 'web-development.jpg',
    instructor: {
      _id: '68e01aa0dc43dcdaf6134959',
      name: 'Juan Pérez',
      avatar: '/images/avatars/instructor1.jpg'
    },
    category: 'web',
    price: 29.99,
    level: 'beginner',
    isPublished: true,
    isFree: false,
    isFeatured: false,
    requirements: ['Conocimientos básicos de informática', 'Computadora con acceso a internet'],
    learningOutcomes: ['HTML5', 'CSS3', 'JavaScript básico', 'Responsive Design'],
    tags: ['web', 'desarrollo', 'frontend'],
    slug: 'desarrollo-web',
    rating: {
      average: 4.5,
      count: 10
    },
    createdAt: '2023-01-15T00:00:00.000Z',
    updatedAt: '2023-01-15T00:00:00.000Z',
    __v: 0
  },
  {
    _id: '68e3e1982b639829dc3dabff',
    title: 'Curso de React Avanzado',
    description: 'Domina React con patrones avanzados y mejores prácticas.',
    image: 'react-advanced.jpg',
    instructor: {
      _id: '68e01aa0dc43dcdaf6134960',
      name: 'María González',
      avatar: '/images/avatars/instructor2.jpg'
    },
    category: 'web',
    price: 49.99,
    level: 'advanced',
    isPublished: true,
    isFree: false,
    isFeatured: true,
    requirements: ['Conocimientos de JavaScript', 'Experiencia básica con React'],
    learningOutcomes: ['Patrones avanzados de React', 'Optimización de rendimiento', 'Testing'],
    tags: ['react', 'frontend', 'javascript'],
    slug: 'react-avanzado',
    rating: {
      average: 4.8,
      count: 15
    },
    createdAt: '2023-02-20T00:00:00.000Z',
    updatedAt: '2023-02-20T00:00:00.000Z',
    __v: 0
  }
];