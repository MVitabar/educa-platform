import express, { Router } from 'express';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Import controllers (to be created)
// import * as resourceController from '../controllers/resources.controller';
// import { upload } from '../utils/upload';

// Public routes (if any)
// router.get('/lesson/:lessonId', resourceController.getResourcesByLesson);
// router.get('/:id', resourceController.getResource);

// Protected routes (require authentication)
router.use(protect);

// Instructor/Admin routes
// router.post(
//   '/',
//   restrictTo('instructor', 'admin'),
//   upload.single('file'),
//   resourceController.uploadResource
// );

// Routes for resource owner or admin
// router.route('/:id')
//   .patch(
//     restrictTo('instructor', 'admin'),
//     resourceController.updateResource
//   )
//   .delete(
//     restrictTo('instructor', 'admin'),
//     resourceController.deleteResource
//   );

export default router;
