import { getSession } from 'next-auth/react';
import { Lesson, LessonFormValues } from '@/types/lesson';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Get all lessons for a section
 * @param sectionId - ID of the section
 * @returns Promise with array of lessons
 */
export const getLessonsBySection = async (sectionId: string): Promise<Lesson[]> => {
  const session = await getSession();
  const response = await fetch(`${API_URL}/sections/${sectionId}/lessons`, {
    headers: {
      'Authorization': `Bearer ${session?.user?.token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al obtener las lecciones');
  }
  
  const result: ApiResponse<Lesson[]> = await response.json();
  return result.data || [];
};

/**
 * Get a lesson by ID
 * @param lessonId - ID of the lesson to retrieve
 * @returns Promise with the requested lesson
 */
export const getLessonById = async (lessonId: string): Promise<Lesson> => {
  const session = await getSession();
  const response = await fetch(`${API_URL}/lessons/${lessonId}`, {
    headers: {
      'Authorization': `Bearer ${session?.user?.token}`,
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al obtener la lección');
  }
  
  const result: ApiResponse<Lesson> = await response.json();
  if (!result.data) {
    throw new Error('No se encontró la lección solicitada');
  }
  return result.data;
};

/**
 * Create a new lesson
 * @param sectionId - ID of the section to add the lesson to
 * @param data - Lesson data
 * @returns Promise with created lesson
 */
export const createLesson = async (sectionId: string, data: LessonFormValues): Promise<Lesson> => {
  const session = await getSession();
  const response = await fetch(`${API_URL}/sections/${sectionId}/lessons`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.user?.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al crear la lección');
  }
  
  const result: ApiResponse<Lesson> = await response.json();
  if (!result.data) {
    throw new Error('No se pudo crear la lección');
  }
  return result.data;
};

/**
 * Update a lesson
 * @param lessonId - ID of the lesson to update
 * @param data - Updated lesson data
 * @returns Promise with updated lesson
 */
export const updateLesson = async (
  lessonId: string, 
  data: Partial<LessonFormValues>
): Promise<Lesson> => {
  const session = await getSession();
  const response = await fetch(`${API_URL}/lessons/${lessonId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${session?.user?.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al actualizar la lección');
  }
  
  const result: ApiResponse<Lesson> = await response.json();
  if (!result.data) {
    throw new Error('No se pudo actualizar la lección');
  }
  return result.data;
};

/**
 * Delete a lesson
 * @param lessonId - ID of the lesson to delete
 * @returns Promise that resolves when lesson is deleted
 */
export const deleteLesson = async (lessonId: string): Promise<void> => {
  const session = await getSession();
  const response = await fetch(`${API_URL}/lessons/${lessonId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session?.user?.token}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Error al eliminar la lección');
  }
};
