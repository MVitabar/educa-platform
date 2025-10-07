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
 * tags:
 *   - name: Lessons
 *     description: Operaciones relacionadas con lecciones
 *
 * components:
 *   schemas:
 *     Resource:
 *       type: object
 *       required:
 *         - title
 *         - url
 *         - type
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: ID único del recurso
 *           example: 5f8d0f4d7f4f1d4e3c8d9e0f
 *         title:
 *           type: string
 *           minLength: 5
 *           maxLength: 100
 *           description: Título del recurso
 *           example: 'Presentación PDF'
 *         description:
 *           type: string
 *           description: Descripción detallada del recurso
 *           example: 'Presentación con los conceptos básicos'
 *         url:
 *           type: string
 *           format: uri
 *           description: URL del recurso
 *           example: 'https://example.com/resources/presentation.pdf'
 *         type:
 *           type: string
 *           enum: [video, document, link, file, other]
 *           description: Tipo de recurso
 *           example: 'document'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del recurso
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
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
 * /api/v1/courses/{courseId}/sections/{sectionId}/lessons:
 *   post:
 *     summary: Crear una nueva lección en una sección (instructor/admin)
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sección
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
    const { courseId, sectionId } = req.params;
    
    // Verificar que el usuario es instructor o admin
    if (!req.user || (req.user.role !== 'instructor' && req.user.role !== 'admin')) {
      return next(new ApiError(403, 'Solo los instructores pueden crear lecciones'));
    }

    // Verificar que la sección pertenece al curso
    // Aquí podrías agregar una verificación adicional si es necesario
    
    // Crear la lección con los IDs de curso y sección
    const lessonData = {
      ...req.body,
      course: courseId,
      section: sectionId,
      createdBy: req.user._id
    };

    const lesson = await Lesson.create(lessonData);

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
 * /api/v1/courses/{courseId}/sections/{sectionId}/lessons/{id}:
 *   get:
 *     summary: Obtener una lección por ID
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sección
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
 *         description: Lección no encontrada o no pertenece a la sección/curso especificados
 *       400:
 *         description: ID inválido
 */
export const getLesson = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId, sectionId, id } = req.params;
    
    const lesson = await Lesson.findOne({
      _id: id,
      course: courseId,
      section: sectionId
    })
    .populate('course', 'title')
    .populate('section', 'title');

    if (!lesson) {
      return next(new ApiError(404, 'Lección no encontrada o no pertenece a la sección/curso especificados'));
    }

    res.status(200).json({
      success: true,
      data: lesson
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      return next(new ApiError(400, 'ID de lección, sección o curso inválido'));
    }
    next(new ApiError(500, `Error al obtener la lección: ${error.message}`));
  }
};

/**
 * @swagger
 * /api/v1/courses/{courseId}/lessons:
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
    const { courseId } = req.params;
    
    const lessons = await Lesson.find({ 
      course: courseId, 
      isPublished: true 
    })
    .sort('order')
    .populate('section', 'title order')
    .populate('course', 'title');

    res.status(200).json({
      success: true,
      count: lessons.length,
      data: lessons
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      return next(new ApiError(400, 'ID de curso inválido'));
    }
    next(new ApiError(500, `Error al obtener las lecciones: ${error.message}`));
  }
};

/**
 * @swagger
 * /api/v1/courses/{courseId}/sections/{sectionId}/lessons:
 *   get:
 *     summary: Obtener todas las lecciones de una sección
 *     tags: [Lessons]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
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
    const { courseId, sectionId } = req.params;
    
    // Verificar que la sección pertenece al curso
    // Aquí podrías agregar una verificación adicional si es necesario
    
    const lessons = await Lesson.find({ 
      section: sectionId,
      course: courseId,
      isPublished: true 
    })
    .sort('order')
    .populate('section', 'title order')
    .populate('course', 'title');

    res.status(200).json({
      success: true,
      count: lessons.length,
      data: lessons
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      return next(new ApiError(400, 'ID de sección o curso inválido'));
    }
    next(new ApiError(500, `Error al obtener las lecciones: ${error.message}`));
  }
};

/**
 * @swagger
 * /api/v1/courses/{courseId}/sections/{sectionId}/lessons/{id}:
 *   put:
 *     summary: Actualizar una lección (instructor/propietario o admin)
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sección
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
 *         description: Lección no encontrada o no pertenece a la sección/curso especificados
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
 * /api/v1/courses/{courseId}/sections/{sectionId}/lessons/{id}:
 *   delete:
 *     summary: Eliminar una lección (instructor/propietario o admin)
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sección
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
 *         description: Lección no encontrada o no pertenece a la sección/curso especificados
 */
export const deleteLesson = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    if (!Types.ObjectId.isValid(id)) {
      return next(new ApiError(400, 'ID de lección inválido'));
    }

    const lesson = await Lesson.findByIdAndDelete(id);

    if (!lesson) {
      return next(new ApiError(404, 'Lección no encontrada'));
    }

    // Verificar que el usuario es admin o instructor del curso
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'instructor')) {
      return next(new ApiError(403, 'No tienes permiso para eliminar esta lección'));
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/lessons:
 *   get:
 *     summary: Obtener todas las lecciones con filtros
 *     tags: [Lessons]
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
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Número de lecciones por página (máx. 100)
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [title, -title, createdAt, -createdAt, duration, -duration]
 *           default: -createdAt
 *         description: Campo por el que ordenar (prefijo - para orden descendente)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por título o contenido
 *       - in: query
 *         name: courseId
 *         schema:
 *           type: string
 *         description: Filtrar por ID de curso
 *       - in: query
 *         name: sectionId
 *         schema:
 *           type: string
 *         description: Filtrar por ID de sección
 *     responses:
 *       200:
 *         description: Lista de lecciones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   description: Número total de lecciones
 *                   example: 42
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     next:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                           example: 2
 *                         limit:
 *                           type: number
 *                           example: 10
 *                     prev:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                           example: null
 *                         limit:
 *                           type: number
 *                           example: 10
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Lesson'
 *       400:
 *         description: Parámetros de consulta inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado - Se requiere autenticación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Prohibido - Se requieren privilegegios de administrador
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */const getLessons = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '10', 10);
    const skip = (page - 1) * limit;
    
    // Initialize the query object
    const query: any = {};
    
    if (req.query.course) {
      query.course = req.query.course;
    }
    
    if (req.query.section) {
      query.section = req.query.section;
    }
    
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search as string, $options: 'i' } },
        { description: { $regex: req.query.search as string, $options: 'i' } }
      ];
    }

    const sort = (req.query.sort as string) || 'createdAt';

    const [lessons, total] = await Promise.all([
      Lesson.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('course', 'title')
        .populate('section', 'title')
        .lean(),
      Lesson.countDocuments(query)
    ]);

    const pagination: Record<string, any> = {};
    if (skip + lessons.length < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    if (skip > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: lessons.length,
      pagination,
      data: lessons
    });
  } catch (error) {
    next(error);
  }
};

// Export all controller functions
export default {
  createLesson,
  getLesson,
  getLessons,
  getLessonsByCourse,
  getLessonsBySection,
  updateLesson,
  deleteLesson
};
