import { Router } from 'express';
import * as sectionController from '../controllers/sections.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication to all routes
router.use(protect);

// Get all sections for a course
router.get('/courses/:courseId/sections', sectionController.getSectionsByCourse);

// Instructor-only routes
router.post(
  '/courses/:courseId/sections',
  restrictTo('instructor'),
  sectionController.createSection
);

// Section management routes (instructor only)
router
  .route('/courses/:courseId/sections/:id')
  .put(restrictTo('instructor'), sectionController.updateSection)
  .delete(restrictTo('instructor', 'admin'), sectionController.deleteSection);

export default router;
