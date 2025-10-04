import express, { Router } from 'express';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import * as enrollmentController from '../controllers/enrollments.controller';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Enrollment:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the enrollment
 *         user:
 *           type: string
 *           description: ID of the enrolled user
 *         course:
 *           type: object
 *           $ref: '#/components/schemas/Course'
 *         progress:
 *           type: number
 *           description: Course completion percentage (0-100)
 *         completedLessons:
 *           type: array
 *           items:
 *             type: string
 *             description: Array of completed lesson IDs
 *         completed:
 *           type: boolean
 *           description: Whether the course is completed
 *         enrolledAt:
 *           type: string
 *           format: date-time
 *         completedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *       example:
 *         _id: 60d21b4667d0d8992e610c85
 *         user: 60d21b4667d0d8992e610c86
 *         course:
 *           _id: 60d21b4667d0d8992e610c87
 *           title: 'Introduction to Web Development'
 *         progress: 45
 *         completedLessons: ['60d21b4667d0d8992e610c88', '60d21b4667d0d8992e610c89']
 *         completed: false
 *         enrolledAt: '2023-06-25T10:30:00Z'
 *         completedAt: null
 *
 *     CreateEnrollmentInput:
 *       type: object
 *       required:
 *         - courseId
 *       properties:
 *         courseId:
 *           type: string
 *           description: ID of the course to enroll in
 *       example:
 *         courseId: 60d21b4667d0d8992e610c87
 */

/**
 * @swagger
 * /api/v1/enrollments:
 *   post:
 *     summary: Enroll in a course (Student only)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEnrollmentInput'
 *     responses:
 *       201:
 *         description: Successfully enrolled in the course
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Enrollment'
 *       400:
 *         description: Invalid input or already enrolled
 *       401:
 *         description: Unauthorized - User not logged in
 *       404:
 *         description: Course not found
 */

/**
 * @swagger
 * /api/v1/enrollments/me:
 *   get:
 *     summary: Get my enrollments (Student only)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of user's enrollments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Enrollment'
 */

/**
 * @swagger
 * /api/v1/enrollments/me/courses/{courseId}:
 *   get:
 *     summary: Check enrollment status for a course (Student only)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the course
 *     responses:
 *       200:
 *         description: Enrollment status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     isEnrolled:
 *                       type: boolean
 *                       example: true
 *                     enrollment:
 *                       $ref: '#/components/schemas/Enrollment'
 *       404:
 *         description: Not enrolled in this course
 */

/**
 * @swagger
 * /api/v1/enrollments/course/{courseId}:
 *   get:
 *     summary: Get all enrollments for a course (Instructor/Admin only)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the course
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of enrollments for the course
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   example: 15
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Enrollment'
 *       403:
 *         description: Forbidden - Not authorized to view these enrollments
 *       404:
 *         description: Course not found
 */

// Protected routes (require authentication)
router.use(protect);

// Student routes
router.post('/', restrictTo('student'), enrollmentController.createEnrollment);
router.get('/me', restrictTo('student'), enrollmentController.getMyEnrollments);
router.get('/me/courses/:courseId', restrictTo('student'), enrollmentController.checkEnrollment);

// Instructor/Admin routes
router.get(
  '/course/:courseId',
  restrictTo('instructor', 'admin'),
  enrollmentController.getEnrollmentsByCourse
);

// Admin only routes
router
  .route('/:id')
  .get(restrictTo('admin'), enrollmentController.getEnrollment)
  .patch(restrictTo('admin'), enrollmentController.updateEnrollment)
  .delete(restrictTo('admin'), enrollmentController.deleteEnrollment);

export default router;
