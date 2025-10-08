// Re-exportar las funciones del servicio de lecciones centralizado
export {
  getLessonById as getLesson,
  getLessonsBySection,
  createLesson,
  updateLesson,
  deleteLesson,
  type Lesson,
  type LessonFormValues
} from '@/services/lesson.service';

import { apiClient } from './apiClient';
import { LessonWithProgress } from '@/types/lesson';

// Obtener lecciones por curso (esta función es específica de este servicio)
export const getLessonsByCourse = async (courseId: string, token?: string): Promise<{ data: LessonWithProgress[] }> => {
  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
  return apiClient.get<{ data: LessonWithProgress[] }>(`/courses/${courseId}/lessons`, { headers });
};

// Marcar una lección como completada (esta función es específica de este servicio)
export const markLessonAsCompleted = async (lessonId: string): Promise<void> => {
  return apiClient.post(`/lessons/${lessonId}/complete`);
};
