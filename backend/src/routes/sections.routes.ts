import { Router } from 'express';
import { 
  createSection, 
  getSectionsByCourse, 
  updateSection, 
  deleteSection, 
  reorderSections,
  getNextLessonOrder
} from '../controllers/sections.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import lessonsRouter from './lessons.routes';

// Create a new router with mergeParams to handle parameters from parent routes
const router = Router({ mergeParams: true });

// Apply authentication to all routes
router.use(protect);

// Get all sections in a course
router.get('/', getSectionsByCourse);

// Create a new section (instructor only)
router.post(
  '/',
  restrictTo('instructor'),
  createSection
);

// Reorder sections (instructor only)
router.patch(
  '/reorder',
  restrictTo('instructor'),
  reorderSections
);

// Get next lesson order (instructor only)
router.get(
  '/:sectionId/next-lesson-order',
  restrictTo('instructor'),
  getNextLessonOrder
);

// Update or delete a section (instructor only)
router
  .route('/:sectionId')
  .put(restrictTo('instructor'), updateSection)
  .delete(restrictTo('instructor', 'admin'), deleteSection);

// Mount lessons routes under sections
router.use('/:sectionId/lessons', lessonsRouter);

export default router;
