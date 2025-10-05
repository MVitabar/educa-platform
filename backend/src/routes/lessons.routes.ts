import express, { Router } from 'express';
import * as lessonController from '../controllers/lessons.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication to all routes
router.use(protect);

// Get all lessons in a section
router.get('/sections/:sectionId/lessons', lessonController.getLessons);

// Create a new lesson in a section (instructor only)
router.post(
  '/sections/:sectionId/lessons',
  restrictTo('instructor'),
  lessonController.createLesson
);

// Get a specific lesson
router.get('/lessons/:id', lessonController.getLesson);

// Update or delete a lesson (instructor only)
router
  .route('/lessons/:id')
  .put(restrictTo('instructor'), lessonController.updateLesson)
  .delete(restrictTo('instructor'), lessonController.deleteLesson);

export default router;
