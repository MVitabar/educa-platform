import { Router } from 'express';
import * as enrollmentController from '../controllers/enrollments.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication to all routes
router.use(protect);

// Student routes
router.post(
  '/courses/:courseId/enroll',
  restrictTo('student'),
  enrollmentController.createEnrollment
);

router.get(
  '/me/enrollments',
  restrictTo('student'),
  enrollmentController.getMyEnrollments
);

// Instructor routes
router.get(
  '/courses/:courseId/students',
  restrictTo('instructor'),
  enrollmentController.getEnrollmentsByCourse
);

router.patch(
  '/enrollments/:id',
  restrictTo('instructor'),
  enrollmentController.updateEnrollment
);

export default router;