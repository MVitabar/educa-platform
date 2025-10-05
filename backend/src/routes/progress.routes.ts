import { Router } from 'express';
import * as progressController from '../controllers/progress.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication to all routes
router.use(protect);

// Student progress tracking
router.post(
  '/lessons/complete',
  restrictTo('student'),
  progressController.completeLesson
);

router.get(
  '/courses/:id/progress',
  progressController.getCourseProgress
);

router.get(
  '/me/progress',
  restrictTo('student'),
  progressController.getCourseProgress
);

export default router;