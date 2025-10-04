import express, { Router } from 'express';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import * as categoryController from '../controllers/categories.controller';
import { validateCategoryInput } from '../validations/category.validation';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the category
 *         name:
 *           type: string
 *           description: The name of the category
 *         description:
 *           type: string
 *           description: A brief description of the category
 *         icon:
 *           type: string
 *           description: Icon representing the category
 *         coursesCount:
 *           type: number
 *           description: Number of courses in this category
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date when the category was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date when the category was last updated
 *       example:
 *         _id: 60d21b4667d0d8992e610c85
 *         name: Web Development
 *         description: Learn web development from scratch
 *         icon: code
 *         coursesCount: 15
 *         createdAt: 2023-06-25T10:30:00Z
 *         updatedAt: 2023-06-25T10:30:00Z
 * 
 *     CreateCategoryInput:
 *       type: object
 *       required:
 *         - name
 *         - description
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the category
 *           example: Web Development
 *         description:
 *           type: string
 *           description: A brief description of the category
 *           example: Learn web development from scratch
 *         icon:
 *           type: string
 *           description: Icon representing the category
 *           example: code
 */

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of all categories
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
 *                     $ref: '#/components/schemas/Category'
 * 
 *   post:
 *     summary: Create a new category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryInput'
 *     responses:
 *       201:
 *         description: Category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - User not logged in
 *       403:
 *         description: Forbidden - User is not an admin
 * 
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Get a single category by ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 * 
 *   patch:
 *     summary: Update a category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryInput'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - User not logged in
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: Category not found
 * 
 *   delete:
 *     summary: Delete a category (Admin only)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       204:
 *         description: Category deleted successfully
 *       401:
 *         description: Unauthorized - User not logged in
 *       403:
 *         description: Forbidden - User is not an admin
 *       404:
 *         description: Category not found
 * 
 * @swagger
 * /api/v1/categories/{id}/courses:
 *   get:
 *     summary: Get all courses in a category
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
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
 *         description: Number of courses per page
 *     responses:
 *       200:
 *         description: List of courses in the category
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
 *                     $ref: '#/components/schemas/Course'
 *       404:
 *         description: Category not found
 */

// Public routes
router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategory);
router.get('/:id/courses', categoryController.getCoursesByCategory);

// Protected routes (require authentication)
router.use(protect);

// Admin only routes
router.post(
  '/',
  restrictTo('admin'),
  validateCategoryInput,
  categoryController.createCategory
);

router
  .route('/:id')
  .patch(
    restrictTo('admin'),
    validateCategoryInput,
    categoryController.updateCategory
  )
  .delete(
    restrictTo('admin'),
    categoryController.deleteCategory
  );

export default router;