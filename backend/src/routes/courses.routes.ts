import { Router } from 'express';
import * as courseController from '../controllers/courses.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourse);
router.get('/categories/:categoryId/courses', courseController.getCoursesByCategory);

// Protected routes (require authentication)
router.use(protect);

// Instructor-only routes
router.post(
  '/',
  restrictTo('instructor', 'admin'),
  courseController.createCourse
);

// Course management routes (instructor or admin)
router
  .route('/:id')
  .put(
    restrictTo('instructor', 'admin'),
    courseController.updateCourse
  )
  .delete(
    restrictTo('instructor', 'admin'),
    courseController.deleteCourse
  );

export default router;
