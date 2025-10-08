import { Types } from 'mongoose';

/**
 * Genera un ID único para una lección basado en el ID de la sección
 * @param sectionId - ID de la sección a la que pertenece la lección
 * @returns Un ID único para la lección
 */
export const generateLessonId = (sectionId: Types.ObjectId | string): string => {
  // Si sectionId es un ObjectId, convertirlo a string
  const sectionIdStr = typeof sectionId === 'string' ? sectionId : sectionId.toString();
  
  // Generar un sufijo aleatorio de 6 caracteres
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  
  // Combinar el ID de la sección con un sufijo aleatorio
  return `lesson_${sectionIdStr}_${randomSuffix}`;
};

/**
 * Genera un ID único para una sección basado en el ID del curso
 * @param courseId - ID del curso al que pertenece la sección
 * @returns Un ID único para la sección
 */
export const generateSectionId = (courseId: Types.ObjectId | string): string => {
  // Si courseId es un ObjectId, convertirlo a string
  const courseIdStr = typeof courseId === 'string' ? courseId : courseId.toString();
  
  // Generar un sufijo aleatorio de 6 caracteres
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  
  // Combinar el ID del curso con un sufijo aleatorio
  return `section_${courseIdStr}_${randomSuffix}`;
};
