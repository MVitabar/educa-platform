import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import Course from '../models/course.model';
import { ApiError } from '../utils/apiError';
import { IUser } from '../types/user.types';

// Extend the Express Request type to include user
interface IAuthenticatedRequest extends Request {
  user?: IUser & { _id: Types.ObjectId };
}

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Gestión de cursos
 */

/**
 * @swagger
 * tags:
 *   name: Courses
 *   description: Gestión de cursos
 */

/**
 * @swagger
 * /api/v1/courses:
 *   get:
 *     summary: Obtener todos los cursos
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de cursos por página
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por ID de categoría
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: Filtrar por nivel
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Precio mínimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Precio máximo
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price, -price, rating, -rating, students, -students, date, -date]
 *         description: Campo por el que ordenar
 *     responses:
 *       200:
 *         description: Lista de cursos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                   description: Número total de cursos
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     next:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                     prev:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 */
// Interface para los parámetros de consulta
type QueryParams = {
  page?: string;
  limit?: string;
  category?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  search?: string;
};

export const getCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1) Filtrado básico
    const queryObj: any = { isPublished: true };
    const queryParams = req.query as unknown as QueryParams;

    // 2) Filtrado por categoría
    if (queryParams.category) {
      queryObj.category = queryParams.category;
    }

    // 3) Filtrado por nivel
    if (queryParams.level) {
      queryObj.level = queryParams.level;
    }

    // 4) Filtrado por rango de precios
    if (queryParams.minPrice || queryParams.maxPrice) {
      queryObj.price = {};
      if (queryParams.minPrice) {
        queryObj.price.$gte = Number(queryParams.minPrice);
      }
      if (queryParams.maxPrice) {
        queryObj.price.$lte = Number(queryParams.maxPrice);
      }
    }

    // 5) Búsqueda por texto
    if (queryParams.search) {
      queryObj.$text = { $search: queryParams.search };
    }

    // 6) Ordenamiento
    let sortBy = '-createdAt';
    if (queryParams.sort) {
      const sortMap: Record<string, string> = {
        'price': 'price',
        '-price': '-price',
        'rating': 'rating.average',
        '-rating': '-rating.average',
        'students': 'studentsEnrolled',
        '-students': '-studentsEnrolled',
        'date': 'createdAt',
        '-date': '-createdAt'
      };
      sortBy = sortMap[queryParams.sort] || sortBy;
    }

    // 7) Paginación
    const page = parseInt(queryParams.page || '1');
    const limit = parseInt(queryParams.limit || '10');
    const skip = (page - 1) * limit;

    // 8) Ejecutar consulta
    const findQuery = Course.find(queryObj)
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .populate('instructor', 'name email avatar')
      .populate('category', 'name');

    const countQuery = Course.countDocuments(queryObj);

    const [courses, total] = await Promise.all([findQuery, countQuery]);

    // 9) Calcular páginas
    const pages = Math.ceil(total / limit);
    const nextPage = page < pages ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;

    res.status(200).json({
      success: true,
      count: courses.length,
      pagination: {
        total,
        pages,
        page,
        limit,
        next: nextPage ? { page: nextPage, limit } : undefined,
        prev: prevPage ? { page: prevPage, limit } : undefined
      },
      data: courses
    });
  } catch (error: any) {
    next(new ApiError(500, `Error al obtener los cursos: ${error.message}`));
  }
};

/**
 * @swagger
 * /api/v1/courses/{id}:
 *   get:
 *     summary: Obtener un curso por ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *     responses:
 *       200:
 *         description: Detalles del curso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         description: Curso no encontrado
 *       400:
 *         description: ID inválido
 */
export const getCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return next(new ApiError(404, 'Curso no encontrado'));
    }
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      return next(new ApiError(400, 'ID de curso inválido'));
    }
    next(new ApiError(500, `Error al obtener el curso: ${error.message}`));
  }
};

/**
 * @swagger
 * /api/v1/courses:
 *   post:
 *     summary: Crear un nuevo curso (instructor/admin)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCourseInput'
 *     responses:
 *       201:
 *         description: Curso creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado - Se requiere autenticación
 *       403:
 *         description: Prohibido - Solo instructores pueden crear cursos
 */
export const createCourse = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Verificar que el usuario es instructor o admin
    if (!req.user || (req.user.role !== 'instructor' && req.user.role !== 'admin')) {
      return next(new ApiError(403, 'Solo los instructores pueden crear cursos'));
    }

    const courseData = {
      ...req.body,
      instructor: req.user?._id
    };

    const course = await Course.create(courseData);
    
    res.status(201).json({
      success: true,
      data: course
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      return next(new ApiError(400, messages.join(', ')));
    }
    next(new ApiError(500, `Error al crear el curso: ${error.message}`));
  }
};

/**
 * @swagger
 * /api/v1/courses/{id}:
 *   put:
 *     summary: Actualizar un curso (instructor/propietario o admin)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCourseInput'
 *     responses:
 *       200:
 *         description: Curso actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado - Se requiere autenticación
 *       403:
 *         description: Prohibido - No tienes permiso para actualizar este curso
 *       404:
 *         description: Curso no encontrado
 */
export const updateCourse = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    let course = await Course.findById(req.params.id);
    
    if (!course) {
      return next(new ApiError(404, 'Curso no encontrado'));
    }

    // Verificar que el usuario es el instructor del curso o admin
    if (!req.user || (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin')) {
      return next(new ApiError(403, 'No tienes permiso para actualizar este curso'));
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      return next(new ApiError(400, messages.join(', ')));
    }
    next(new ApiError(500, `Error al actualizar el curso: ${error.message}`));
  }
};

/**
 * @swagger
 * /api/v1/courses/{id}:
 *   delete:
 *     summary: Eliminar un curso (instructor/propietario o admin)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *     responses:
 *       200:
 *         description: Curso eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autorizado - Se requiere autenticación
 *       403:
 *         description: Prohibido - No tienes permiso para eliminar este curso
 *       404:
 *         description: Curso no encontrado
 */
export const deleteCourse = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return next(new ApiError(404, 'Curso no encontrado'));
    }

    // Verificar que el usuario es el instructor del curso o admin
    if (!req.user || (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin')) {
      return next(new ApiError(403, 'No tienes permiso para eliminar este curso'));
    }

    await course.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      return next(new ApiError(400, 'ID de curso inválido'));
    }
    next(new ApiError(500, `Error al eliminar el curso: ${error.message}`));
  }
};

export default {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse
};
