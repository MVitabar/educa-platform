import { Router } from 'express';
import { protect } from '../middlewares/auth.middleware';
import * as progressController from '../controllers/progress.controller';

const router = Router();

// All routes require authentication
router.use(protect);

/**
 * @swagger
 * /api/v1/progress/course/{courseId}:
 *   get:
 *     summary: Get user progress for a course
 *     tags: [Progress]
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
 *         description: User progress data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Progress'
 */
router.get('/course/:courseId', progressController.getCourseProgress);

/**
 * @swagger
 * /api/v1/progress/course/{courseId}/track:
 *   post:
 *     summary: Track lesson progress
 *     tags: [Progress]
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
 *             type: object
 *             required:
 *               - lessonId
 *               - progress
 *             properties:
 *               lessonId:
 *                 type: string
 *               progress:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Progress updated successfully
 */
router.post('/course/:courseId/track', progressController.trackLessonProgress);

/**
 * @swagger
 * /api/v1/progress/course/{courseId}/complete:
 *   post:
 *     summary: Mark a lesson as completed
 *     tags: [Progress]
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
 *             type: object
 *             required:
 *               - lessonId
 *             properties:
 *               lessonId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lesson marked as completed
 */
router.post('/course/:courseId/complete', progressController.completeLesson);

/**
 * @swagger
 * /api/v1/progress/course/{courseId}/stats:
 *   get:
 *     summary: Get course statistics (instructors only)
 *     tags: [Progress]
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
 *         description: Course statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CourseStats'
 */
router.get('/course/:courseId/stats', progressController.getCourseStats);

export default router;
