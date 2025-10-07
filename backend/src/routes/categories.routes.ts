import { Router } from 'express';
import * as categoryController from '../controllers/categories.controller';
import * as courseController from '../controllers/courses.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategory);

// Get courses by category
router.get('/:categoryId/courses', courseController.getCoursesByCategory);

// Admin routes
router.use(protect, restrictTo('admin'));

router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

export default router;