import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Category } from '../models/category.model';
import Course from '../models/course.model';
import AppError from '../utils/appError';
import { catchAsync } from '../utils/catchAsync';

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Gestión de categorías de cursos
 */

// Import the IUser type from the user types file
import { IUser } from '../types/user.types';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser & { _id: Types.ObjectId };
    }
  }
}

/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     summary: Obtener todas las categorías
 *     tags: [Categories]
 *     parameters:
 *       - in: query
 *         name: featured
 *         schema:
 *           type: boolean
 *         description: Filtrar por categorías destacadas
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *         description: Límite de resultados
 *     responses:
 *       200:
 *         description: Lista de categorías
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: number
 *                   example: 5
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Category'
 */
export const getCategories = catchAsync(async (req: Request, res: Response) => {
  const categories = await Category.find();
  
  res.status(200).json({
    status: 'success',
    results: categories.length,
    data: {
      categories
    }
  });
});

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Obtener una categoría por ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Categoría encontrada
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
 *       404:
 *         description: No se encontró la categoría con ese ID
 */
/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     summary: Obtener una categoría por ID
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría
 *     responses:
 *       200:
 *         description: Categoría encontrada
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
 *                     category:
 *                       $ref: '#/components/schemas/Category'
 *       404:
 *         description: No se encontró la categoría con ese ID
 */
export const getCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const category = await Category.findById(req.params.id);
  
  if (!category) {
    return next(new AppError('No se encontró la categoría con ese ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      category
    }
  });
});

/**
 * @swagger
 * /api/v1/categories:
 *   post:
 *     summary: Crear una nueva categoría (Solo administradores)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       201:
 *         description: Categoría creada exitosamente
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
 *                     category:
 *                       $ref: '#/components/schemas/Category'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado - Se requiere autenticación de administrador
 */
export const createCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Verificar si el usuario es administrador
  if (req.user?.role !== 'admin') {
    return next(new AppError('No tienes permiso para realizar esta acción', 403));
  }
  const newCategory = await Category.create(req.body);
  
  res.status(201).json({
    status: 'success',
    data: {
      category: newCategory
    }
  });
});

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   patch:
 *     summary: Actualizar una categoría (Solo administradores)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CategoryInput'
 *     responses:
 *       200:
 *         description: Categoría actualizada exitosamente
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
 *                     category:
 *                       $ref: '#/components/schemas/Category'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado - Se requiere autenticación de administrador
 *       404:
 *         description: No se encontró la categoría con ese ID
 */
export const updateCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Verificar si el usuario es administrador
  if (req.user?.role !== 'admin') {
    return next(new AppError('No tienes permiso para realizar esta acción', 403));
  }
  const category = await Category.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );
  
  if (!category) {
    return next(new AppError('No se encontró la categoría con ese ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      category
    }
  });
});

/**
 * @swagger
 * /api/v1/categories/{id}:
 *   delete:
 *     summary: Eliminar una categoría (Solo administradores)
 *     tags: [Categories]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría a eliminar
 *     responses:
 *       204:
 *         description: Categoría eliminada exitosamente
 *       401:
 *         description: No autorizado - Se requiere autenticación de administrador
 *       404:
 *         description: No se encontró la categoría con ese ID
 */
export const deleteCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Verificar si el usuario es administrador
  if (req.user?.role !== 'admin') {
    return next(new AppError('No tienes permiso para realizar esta acción', 403));
  }
  const category = await Category.findByIdAndDelete(req.params.id);
  
  if (!category) {
    return next(new AppError('No se encontró la categoría con ese ID', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

/**
 * @swagger
 * /api/v1/categories/{id}/courses:
 *   get:
 *     summary: Obtener cursos de una categoría específica
 *     tags: [Categories]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página para la paginación
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de resultados por página
 *     responses:
 *       200:
 *         description: Lista de cursos de la categoría
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
 *                   example: 10
 *                 data:
 *                   type: object
 *                   properties:
 *                     courses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Course'
 *       404:
 *         description: No se encontró la categoría con ese ID
 */
export const getCoursesByCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Verificar si la categoría existe
  const category = await Category.findById(req.params.id);
  if (!category) {
    return next(new AppError('No se encontró la categoría con ese ID', 404));
  }
  
  // Paginación
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;
  
  // Obtener cursos de la categoría con paginación
  const [courses, total] = await Promise.all([
    Course.find({ category: req.params.id })
      .skip(skip)
      .limit(limit)
      .populate('instructor', 'name email')
      .select('-__v'),
    Course.countDocuments({ category: req.params.id })
  ]);
  
  res.status(200).json({
    status: 'success',
    results: courses.length,
    data: {
      courses
    },
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  });
});
