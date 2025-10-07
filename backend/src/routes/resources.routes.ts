import { Router } from 'express';
import * as resourceController from '../controllers/resources.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Public routes - get resources for a lesson
router.get(
  '/courses/:courseId/sections/:sectionId/lessons/:lessonId/resources',
  resourceController.getLessonResources
);

// Protected routes
router.use(protect);

// Get a single resource by ID
router.get(
  '/courses/:courseId/sections/:sectionId/lessons/:lessonId/resources/:id',
  resourceController.getResource
);

// Instructor routes
router.post(
  '/courses/:courseId/sections/:sectionId/lessons/:lessonId/resources',
  restrictTo('instructor'),
  resourceController.uploadResource
);

// Resource management routes (instructor only)
router
  .route('/courses/:courseId/sections/:sectionId/lessons/:lessonId/resources/:id')
  .put(restrictTo('instructor'), resourceController.updateResource)
  .delete(restrictTo('instructor', 'admin'), resourceController.deleteResource);

export default router;
