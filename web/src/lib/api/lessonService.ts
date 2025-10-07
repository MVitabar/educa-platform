import apiClient from './apiClient';
import { Lesson, LessonWithProgress, CreateLessonInput, LessonFormValues } from '@/types/lesson';
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

// Obtener una lección por ID
export const getLesson = async (id: string, token?: string): Promise<Lesson> => {
  const authToken = token || await getAuthToken();
  return apiClient.get<{ data: Lesson }>(`/lessons/${id}`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
  }).then(res => res.data);
};

// Obtener lecciones por curso
export const getLessonsByCourse = async (courseId: string, token?: string): Promise<{ data: LessonWithProgress[] }> => {
  const authToken = token || await getAuthToken();
  return apiClient.get<{ data: LessonWithProgress[] }>(`/courses/${courseId}/lessons`, {
    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
  });
};

// Obtener lecciones por sección
export const getLessonsBySection = async (sectionId: string): Promise<{ data: LessonWithProgress[] }> => {
  return apiClient.get<{ data: LessonWithProgress[] }>(`/sections/${sectionId}/lessons`);
};

// Crear una nueva lección
export const createLesson = async (data: CreateLessonInput): Promise<Lesson> => {
  return apiClient.post<{ data: Lesson }>('/lessons', data).then(res => res.data);
};

// Actualizar una lección existente
export const updateLesson = async (id: string, data: LessonFormValues): Promise<Lesson> => {
  return apiClient.put<{ data: Lesson }>(`/lessons/${id}`, data).then(res => res.data);
};

// Eliminar una lección
export const deleteLesson = async (id: string): Promise<void> => {
  await apiClient.delete(`/lessons/${id}`);
};

// Marcar una lección como completada
export const markLessonAsCompleted = async (lessonId: string): Promise<void> => {
  await apiClient.post(`/lessons/${lessonId}/complete`);
};
