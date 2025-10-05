export interface Course {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  instructor: string;
  price: number;
  rating: number;
  students: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  slug: string;
  category: string[];
  isEnrolled?: boolean;
}

export const sampleCourses: Course[] = [
  {
    id: '1',
    title: 'Introducción a la Programación',
    description: 'Aprende los fundamentos de la programación desde cero con ejemplos prácticos.',
    imageUrl: '/images/courses/programming.jpg',
    instructor: 'Juan Pérez',
    price: 29.99,
    rating: 4.7,
    students: 1245,
    level: 'Beginner',
    duration: '8 horas',
    slug: 'introduccion-a-la-programacion',
    category: ['Programación', 'Principiantes']
  },
  {
    id: '2',
    title: 'Diseño Web Moderno',
    description: 'Crea sitios web atractivos y responsivos con las últimas tecnologías web.',
    imageUrl: '/images/courses/web-design.jpg',
    instructor: 'Ana García',
    price: 39.99,
    rating: 4.8,
    students: 987,
    level: 'Intermediate',
    duration: '12 horas',
    slug: 'diseno-web-moderno',
    category: ['Diseño', 'Desarrollo Web']
  },
  // Add more sample courses as needed
];
