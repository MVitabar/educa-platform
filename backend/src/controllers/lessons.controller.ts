import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Lesson } from '../models/lesson.model';
import { ApiError } from '../utils/apiError';
import { IUser } from '../types/user.types';

// Extend the Express Request type to include user
interface IAuthenticatedRequest extends Request {
  user?: IUser & { _id: Types.ObjectId };
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Resource:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Título del recurso
 *         url:
 *           type: string
 *           format: uri
 *           description: URL del recurso
 *         type:
 *           type: string
 *           enum: [pdf, doc, zip, other]
 *           default: other
 *           description: Tipo de recurso
 *
 *     Lesson:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - duration
 *         - course
 *         - section
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           example: 5f8d0f4d7f4f1d4e3c8d9e0f
 *           description: ID único de la lección
 *         title:
 *           type: string
 *           minLength: 5
 *           maxLength: 100
 *           example: 'Introducción a React'
 *           description: Título de la lección
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: 'Conceptos básicos de React y su ecosistema'
 *           description: Descripción breve de la lección
 *         content:
 *           type: string
 *           example: 'Contenido detallado de la lección en formato Markdown o HTML'
 *           description: Contenido completo de la lección
 *         duration:
 *           type: integer
 *           minimum: 1
 *           example: 30
 *           description: Duración en minutos
 *         videoUrl:
 *           type: string
 *           format: uri
 *           example: 'https://example.com/videos/1'
 *           description: URL del video de la lección
 *         resources:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Resource'
 *         course:
 *           type: string
 *           format: ObjectId
 *           example: 5f8d0f4d7f4f1d4e3c8d9e0f
 *           description: ID del curso al que pertenece la lección
 *         section:
 *           type: string
 *           format: ObjectId
 *           example: 5f8d0f4d7f4f1d4e3c8d9e0f
 *           description: ID de la sección a la que pertenece la lección
 *         order:
 *           type: number
 *           minimum: 0
 *           example: 1
 *           description: Orden de la lección dentro de la sección
 *         isPublished:
 *           type: boolean
 *           default: false
 *           example: true
 *           description: Indica si la lección está publicada
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     CreateLessonInput:
 *       type: object
 *       required:
 *         - title
 *         - content
 *         - duration
 *         - course
 *         - section
 *       properties:
 *         title:
 *           type: string
 *           minLength: 5
 *           maxLength: 100
 *           example: 'Introducción a React'
 *         content:
 *           type: string
 *           example: 'Contenido de la lección en Markdown'
 *         description:
 *           type: string
 *           maxLength: 500
 *         duration:
 *           type: integer
 *           minimum: 1
 *           example: 30
 *         videoUrl:
 *           type: string
 *           format: uri
 *         resources:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Resource'
 *         course:
 *           type: string
 *           format: ObjectId
 *         section:
 *           type: string
 *           format: ObjectId
 *         order:
 *           type: number
 *           minimum: 0
 *         isPublished:
 *           type: boolean
 *
 *     UpdateLessonInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 5
 *           maxLength: 100
 *         content:
 *           type: string
 *         description:
 *           type: string
 *           maxLength: 500
 *         duration:
 *           type: integer
 *           minimum: 1
 *         videoUrl:
 *           type: string
 *           format: uri
 *         resources:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Resource'
 *         order:
 *           type: number
 *           minimum: 0
 *         isPublished:
 *           type: boolean
 */

/**
 * @swagger
 * tags:
 *   name: Lessons
 *   description: Gestión de lecciones de los cursos
 */

/**
 * @swagger
 * /api/v1/lessons:
 *   post:
 *     summary: Crear una nueva lección (instructor/admin)
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateLessonInput'
 *     responses:
 *       201:
 *         description: Lección creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Lesson'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
export const createLesson = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Verificar que el usuario es instructor o admin
    if (!req.user || (req.user.role !== 'instructor' && req.user.role !== 'admin')) {
      return next(new ApiError(403, 'Solo los instructores pueden crear lecciones'));
    }

    const lesson = await Lesson.create(req.body);

    res.status(201).json({
      success: true,
      data: lesson
    });
  } catch (error: any) {
    next(new ApiError(400, `Error al crear la lección: ${error.message}`));
  }
};

/**
 * @swagger
 * /api/v1/lessons/{id}:
 *   get:
 *     summary: Obtener una lección por ID
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la lección
 *     responses:
 *       200:
 *         description: Detalles de la lección
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Lesson'
 *       404:
 *         description: Lección no encontrada
 *       400:
 *         description: ID inválido
 */
export const getLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('course', 'title')
      .populate('section', 'title');

    if (!lesson) {
      return next(new ApiError(404, 'Lección no encontrada'));
    }

    res.status(200).json({
      success: true,
      data: lesson
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      return next(new ApiError(400, 'ID de lección inválido'));
    }
    next(new ApiError(500, `Error al obtener la lección: ${error.message}`));
  }
};

/**
 * @swagger
 * /api/v1/lessons/course/{courseId}:
 *   get:
 *     summary: Obtener todas las lecciones de un curso
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *     responses:
 *       200:
 *         description: Lista de lecciones del curso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lesson'
 */
export const getLessonsByCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lessons = await Lesson.find({ course: req.params.courseId, isPublished: true })
      .sort('order')
      .populate('section', 'title order');

    res.status(200).json({
      success: true,
      count: lessons.length,
      data: lessons
    });
  } catch (error: any) {
    next(new ApiError(500, `Error al obtener las lecciones: ${error.message}`));
  }
};

/**
 * @swagger
 * /api/v1/lessons/section/{sectionId}:
 *   get:
 *     summary: Obtener todas las lecciones de una sección
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sección
 *     responses:
 *       200:
 *         description: Lista de lecciones de la sección
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lesson'
 */
export const getLessonsBySection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const lessons = await Lesson.find({ section: req.params.sectionId, isPublished: true })
      .sort('order');

    res.status(200).json({
      success: true,
      count: lessons.length,
      data: lessons
    });
  } catch (error: any) {
    next(new ApiError(500, `Error al obtener las lecciones: ${error.message}`));
  }
};

/**
 * @swagger
 * /api/v1/lessons/{id}:
 *   put:
 *     summary: Actualizar una lección (instructor/propietario o admin)
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la lección
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateLessonInput'
 *     responses:
 *       200:
 *         description: Lección actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Lesson'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Lección no encontrada
 */
export const updateLesson = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    let lesson = await Lesson.findById(req.params.id);
    
    if (!lesson) {
      return next(new ApiError(404, 'Lección no encontrada'));
    }

    // Verificar que el usuario es admin o instructor del curso
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'instructor')) {
      return next(new ApiError(403, 'No tienes permiso para actualizar esta lección'));
    }

    lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: lesson
    });
  } catch (error: any) {
    next(new ApiError(400, `Error al actualizar la lección: ${error.message}`));
  }
};

/**
 * @swagger
 * /api/v1/lessons/{id}:
 *   delete:
 *     summary: Eliminar una lección (instructor/propietario o admin)
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la lección
 *     responses:
 *       200:
 *         description: Lección eliminada exitosamente
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
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Lección no encontrada
 */
export const deleteLesson = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    
    if (!lesson) {
      return next(new ApiError(404, 'Lección no encontrada'));
    }

    // Verificar que el usuario es admin o instructor del curso
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'instructor')) {
      return next(new ApiError(403, 'No tienes permiso para eliminar esta lección'));
    }

    await lesson.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      return next(new ApiError(400, 'ID de lección inválido'));
    }
    next(new ApiError(500, `Error al eliminar la lección: ${error.message}`));
  }
};

export default {
  createLesson,
  getLesson,
  getLessonsByCourse,
  getLessonsBySection,
  updateLesson,
  deleteLesson
};
