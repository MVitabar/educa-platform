import { Router } from 'express';
import * as lessonController from '../controllers/lessons.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication to all routes
router.use(protect);

// Get all lessons in a section
router.get('/courses/:courseId/sections/:sectionId/lessons', lessonController.getLessonsBySection);

// Create a new lesson in a section (instructor only)
router.post(
  '/courses/:courseId/sections/:sectionId/lessons',
  restrictTo('instructor'),
  lessonController.createLesson
);

// Get a specific lesson
router.get('/courses/:courseId/sections/:sectionId/lessons/:id', lessonController.getLesson);

// Update or delete a lesson (instructor only)
router
  .route('/courses/:courseId/sections/:sectionId/lessons/:id')
  .put(restrictTo('instructor'), lessonController.updateLesson)
  .delete(restrictTo('instructor'), lessonController.deleteLesson);

// Get all lessons for a course (public)
router.get('/courses/:courseId/lessons', lessonController.getLessonsByCourse);

export default router;
