import { Router } from 'express';
import * as reviewController from '../controllers/reviews.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/courses/:courseId/reviews', reviewController.getCourseReviews);

// Protected routes
router.use(protect);

// Student routes
router.post(
  '/courses/:courseId/reviews',
  restrictTo('student'),
  reviewController.createReview
);

// Review owner or admin
router
  .route('/reviews/:id')
  .put(reviewController.updateReview)
  .delete(reviewController.deleteReview);

export default router;