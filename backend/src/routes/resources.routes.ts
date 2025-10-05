import { Router } from 'express';
import * as resourceController from '../controllers/resources.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/lessons/:lessonId/resources', resourceController.getLessonResources);
router.get('/resources/:id', resourceController.getResource);

// Protected routes
router.use(protect);

// Instructor routes
router.post(
  '/lessons/:lessonId/resources',
  restrictTo('instructor'),
  resourceController.uploadResource
);

// Resource management routes (instructor only)
router
  .route('/resources/:id')
  .put(restrictTo('instructor'), resourceController.updateResource)
  .delete(restrictTo('instructor', 'admin'), resourceController.deleteResource);

export default router;
