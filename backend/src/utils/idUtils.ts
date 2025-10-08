import { Types } from 'mongoose';

export const parseLessonId = (id: string): string => {
  // If it's already a valid ObjectId, return it as is
  if (Types.ObjectId.isValid(id)) {
    return id;
  }

  // Try to parse as composite ID format: lesson_section_<courseId>_<sectionId>_<lessonId>
  const parts = id.split('_');
  
  // Check if it follows the pattern: lesson_section_<courseId>_<sectionId>_<lessonId>
  if (parts.length >= 5 && parts[0] === 'lesson' && parts[1] === 'section') {
    // The last part should be the MongoDB ID
    const mongoId = parts[parts.length - 1];
    if (Types.ObjectId.isValid(mongoId)) {
      return mongoId;
    }
    
    // If the last part isn't a valid ID, try to find a valid ID in any part
    for (const part of parts) {
      if (Types.ObjectId.isValid(part)) {
        return part;
      }
    }
  }

  // If we get here, it's an invalid ID
  throw new Error('ID de lección inválido');
};
