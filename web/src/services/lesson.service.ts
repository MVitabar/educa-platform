import { apiRequest } from '@/lib/api';
import { Lesson, LessonFormValues as ILessonFormValues } from '@/types/lesson';

/**
 * Get all lessons for a section
 * @param sectionId - ID of the section
 * @returns Promise with array of lessons
 */
export const getLessonsBySection = async (sectionId: string): Promise<Lesson[]> => {
  const response = await apiRequest(`/sections/${sectionId}/lessons`);
  return response.data || [];
};

/**
 * Get a lesson by ID
 * @param lessonId - ID of the lesson to retrieve
 * @returns Promise with the requested lesson
 */
export const getLessonById = async (lessonId: string): Promise<Lesson> => {
  const response = await apiRequest(`/lessons/${lessonId}`);
  return response.data;
};

/**
 * Create a new lesson in a section
 * @param sectionId - ID of the section to add the lesson to
 * @param data - Lesson data
 * @returns Promise with created lesson
 */
export const createLesson = async (
  sectionId: string,
  data: Omit<ILessonFormValues, 'section'>
): Promise<Lesson> => {
  const response = await apiRequest(`/sections/${sectionId}/lessons`, {
    method: 'POST',
    body: data
  });
  return response.data;
};

/**
 * Update a lesson
 * @param lessonId - ID of the lesson to update
 * @param data - Updated lesson data
 * @returns Promise with updated lesson
 */
export const updateLesson = async (
  lessonId: string,
  data: Partial<ILessonFormValues>
): Promise<Lesson> => {
  const response = await apiRequest(`/lessons/${lessonId}`, {
    method: 'PUT',
    body: data
  });
  return response.data;
};

/**
 * Delete a lesson
 * @param lessonId - ID of the lesson to delete
 * @returns Promise that resolves when lesson is deleted
 */
export const deleteLesson = async (lessonId: string): Promise<void> => {
  await apiRequest(`/lessons/${lessonId}`, {
    method: 'DELETE'
  });
};

// Re-export types for backward compatibility
export type { LessonFormValues } from '@/types/lesson';
export type { Lesson } from '@/types/lesson';
