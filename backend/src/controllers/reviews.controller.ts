import { Response, NextFunction, Request } from 'express';
import { Types } from 'mongoose';
import { Review } from '../models/review.model';
import { catchAsync } from '../utils/catchAsync';
import AppError from '../utils/appError';
import { IUser } from '../types/user.types';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser & { _id: Types.ObjectId };
    }
  }
}

type IAuthenticatedRequest = Request;

/**
 * @swagger
 * components:
 *   schemas:
 *     Review:
 *       type: object
 *       required:
 *         - rating
 *         - comment
 *         - course
 *         - student
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the review
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           description: Rating from 1 to 5 stars
 *         comment:
 *           type: string
 *           description: The review comment
 *         course:
 *           type: string
 *           description: Reference to the Course model
 *         student:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             avatar:
 *               type: string
 *           description: Reference to the User model of the student who wrote the review
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     CreateReviewInput:
 *       type: object
 *       required:
 *         - rating
 *         - comment
 *       properties:
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *     UpdateReviewInput:
 *       type: object
 *       properties:
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *         comment:
 *           type: string
 *   responses:
 *     UnauthorizedError:
 *       description: Access token is missing or invalid
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               message:
 *                 type: string
 *                 example: You are not logged in. Please log in to get access.
 *     ForbiddenError:
 *       description: User doesn't have permission to perform this action
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               message:
 *                 type: string
 *                 example: You do not have permission to perform this action
 *     NotFoundError:
 *       description: The requested resource was not found
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: error
 *               message:
 *                 type: string
 *                 example: No review found with that ID
 * 
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Course reviews management
 */

/**
 * @swagger
 * /api/v1/courses/{courseId}/reviews:
 *   get:
 *     summary: Get all reviews for a course
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the course
 *     responses:
 *       200:
 *         description: List of reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Review'
 */
export const getCourseReviews = catchAsync(async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  const { courseId } = req.params;
  
  const reviews = await Review.find({ course: courseId })
    .populate('student', 'name avatar')
    .sort('-createdAt');

  res.status(200).json({
    status: 'success',
    results: reviews.length,
    data: {
      reviews
    }
  });
});

/**
 * @swagger
 * /api/v1/courses/{courseId}/reviews:
 *   post:
 *     summary: Create a new review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the course
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReviewInput'
 *     responses:
 *       201:
 *         description: Review created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 */
export const createReview = catchAsync(async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  const { courseId } = req.params;
  const { rating, comment } = req.body;
  
  if (!req.user) {
    return next(new AppError('You must be logged in to leave a review', 401));
  }

  // Check if user has already reviewed this course
  const existingReview = await Review.findOne({
    student: req.user._id,
    course: courseId
  });

  if (existingReview) {
    return next(new AppError('You have already reviewed this course', 400));
  }

  if (!req.user) {
    return next(new AppError('You must be logged in to leave a review', 401));
  }

  const review = await Review.create({
    student: req.user._id,
    course: courseId,
    rating,
    comment,
    title: `Review by ${req.user.name}`
  });

  // Populate student data in the response
  await review.populate('student', 'name avatar');

  res.status(201).json({
    status: 'success',
    data: {
      review
    }
  });
});

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   put:
 *     summary: Update a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the review
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateReviewInput'
 *     responses:
 *       200:
 *         description: Review updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 */
export const updateReview = catchAsync(async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  const review = await Review.findById(id);
  
  if (!review) {
    return next(new AppError('No review found with that ID', 404));
  }

  if (!req.user) {
    return next(new AppError('You must be logged in to perform this action', 401));
  }

  // Check if the user is the owner of the review or an admin
  if (review.student.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to update this review', 403));
  }

  review.rating = rating || review.rating;
  review.comment = comment || review.comment;
  
  await review.save();
  
  // Populate student data in the response
  await review.populate('student', 'name avatar');

  res.status(200).json({
    status: 'success',
    data: {
      review
    }
  });
});

/**
 * @swagger
 * /api/v1/reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the review
 *     responses:
 *       204:
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 */
export const deleteReview = catchAsync(async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  const review = await Review.findById(id);
  
  if (!review) {
    return next(new AppError('No review found with that ID', 404));
  }

  if (!req.user) {
    return next(new AppError('You must be logged in to perform this action', 401));
  }

  // Check if the user is the owner of the review or an admin
  if (review.student.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return next(new AppError('You are not authorized to delete this review', 403));
  }

  await Review.findByIdAndDelete(id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});
