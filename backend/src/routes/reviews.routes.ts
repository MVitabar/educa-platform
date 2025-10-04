import express, { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Import controllers (to be created)
// import * as reviewController from '../controllers/reviews.controller';

// Public routes
// router.get('/', reviewController.getReviews);
// router.get('/course/:courseId', reviewController.getCourseReviews);
// router.get('/:id', reviewController.getReview);

// Protected routes (require authentication)
router.use(protect);

// Student routes
// router.post('/', reviewController.createReview);
// router.get('/my-reviews', reviewController.getMyReviews);

// Routes for review owner or admin
// router.route('/:id')
//   .patch(
//     reviewController.restrictToReviewOwner,
//     reviewController.updateReview
//   )
//   .delete(
//     reviewController.restrictToReviewOwner,
//     reviewController.deleteReview
//   );

export default router;
