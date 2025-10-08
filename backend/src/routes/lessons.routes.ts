import { Router } from 'express';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import lessonsController from '../controllers/lessons.controller';

// Create a new router with mergeParams to handle parameters from parent routes
const router = Router({ mergeParams: true });

// Apply authentication to all routes
router.use(protect);

// Get all lessons in a section
router.get('/', lessonsController.getLessonsBySection);

// Create a new lesson in a section (instructor only)
router.post(
  '/',
  restrictTo('instructor'),
  lessonsController.createLesson
);

// Reorder lessons (instructor only)
router.patch(
  '/reorder',
  restrictTo('instructor'),
  lessonsController.reorderLessons
);

// Get a specific lesson
router.get('/:id', lessonsController.getLesson);

// Get all lessons in a course
router.get('/course/:courseId', lessonsController.getLessonsByCourse);

// Update or delete a lesson (instructor only)
router
  .route('/:id')
  .put(restrictTo('instructor'), lessonsController.updateLesson)
  .delete(restrictTo('instructor'), lessonsController.deleteLesson);

export default router;
