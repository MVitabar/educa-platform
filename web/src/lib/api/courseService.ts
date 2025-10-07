import apiClient from './apiClient';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Helper function to get the auth token for server components
async function getAuthToken() {
  if (typeof window !== 'undefined') {
    // Client-side: use the storage utility
    const storage = (await import('@/lib/storage')).default;
    return storage.getToken();
  } else {
    // Server-side: get the session
    const session = await getServerSession(authOptions);
    return session?.accessToken || null;
  }
}

// Tipos para los datos de los cursos
export interface Course {
  _id: string;
  id?: string; // Para compatibilidad con código existente
  title: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  instructor: {
    _id: string;
    id?: string; // Para compatibilidad con código existente
    name: string;
    avatar?: string;
  };
  rating?: number;
  average?: number; // Puntuación promedio
  studentsCount: number;
  totalLessons: number;
  duration: number; // in minutes
  level: 'beginner' | 'intermediate' | 'advanced';
  category: {
    _id: string;
    name: string;
  };
  learningOutcomes?: string[]; // Resultados de aprendizaje
  enrolled?: boolean; // Si el usuario actual está inscrito
  lessonsCount?: number; // Número total de lecciones
  createdAt: string;
  updatedAt: string;
}

export interface CourseWithProgress extends Course {
  progress: number; // 0-100
  lastAccessed?: string; // ISO date
  completed: boolean;
}

// Obtener un curso por su slug
export const getCourseBySlug = async (slug: string, token?: string): Promise<Course> => {
  const authToken = token || await getAuthToken();
  return apiClient.get<{ data: Course }>(`/courses/slug/${slug}`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
  }).then(res => res.data);
};

// Obtener cursos populares
export const getPopularCourses = async (limit = 6): Promise<Course[]> => {
  return apiClient.get<{ data: Course[] }>(`/courses/popular?limit=${limit}`).then(res => res.data);
};

// Obtener cursos por categoría
export const getCoursesByCategory = async (categoryId: string): Promise<Course[]> => {
  return apiClient.get<{ data: Course[] }>(`/courses?category=${categoryId}`).then(res => res.data);
};

// Buscar cursos
export const searchCourses = async (query: string): Promise<Course[]> => {
  return apiClient.get<{ data: Course[] }>(`/courses/search?q=${encodeURIComponent(query)}`).then(res => res.data);
};

// Obtener cursos del instructor
export const getInstructorCourses = async (instructorId: string): Promise<CourseWithProgress[]> => {
  return apiClient.get<{ data: CourseWithProgress[] }>(`/courses/instructor/${instructorId}`).then(res => res.data);
};

// Inscribirse a un curso
export const enrollInCourse = async (courseId: string): Promise<{ success: boolean; message?: string }> => {
  return apiClient.post<{ success: boolean; message?: string }>(`/courses/${courseId}/enroll`);
};
