import { Request, Response, NextFunction } from 'express';
import mongoose, { Types } from 'mongoose';
import { Lesson } from '../models/lesson.model';
import { Section } from '../models/section.model';
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
 * components:
 *   schemas:
 *     ContentBlock:
 *       type: object
 *       required:
 *         - type
 *         - content
 *         - order
 *       properties:
 *         type:
 *           type: string
 *           enum: [text, video, video_link, pdf, document]
 *           description: Tipo de bloque de contenido
 *         content:
 *           type: string
 *           description: Contenido del bloque (texto, URL, etc.)
 *         title:
 *           type: string
 *           description: Título opcional para el bloque
 *         description:
 *           type: string
 *           description: Descripción opcional para el bloque
 *         duration:
 *           type: number
 *           description: Duración en minutos (para videos)
 *         thumbnailUrl:
 *           type: string
 *           description: URL de la miniatura (para videos)
 *         fileSize:
 *           type: number
 *           description: Tamaño del archivo en bytes (para archivos subidos)
 *         fileType:
 *           type: string
 *           description: Tipo MIME del archivo (para archivos subidos)
 *         order:
 *           type: number
 *           description: Orden del bloque en la lección
 * 
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
 *             type: object
 *             required:
 *               - title
 *               - contentBlocks
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *               description:
 *                 type: string
 *               contentBlocks:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   $ref: '#/components/schemas/ContentBlock'
 *               duration:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *               resources:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Resource'
 *               isPublished:
 *                 type: boolean
 *                 default: false
 *               isFree:
 *                 type: boolean
 *                 default: false
 *               isPreview:
 *                 type: boolean
 *                 default: false
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
export const createLesson = async (req: IAuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get courseId and sectionId from either request body or URL params
    const { courseId: bodyCourseId, sectionId: bodySectionId, ...restBody } = req.body;
    const { courseId: paramCourseId, sectionId: paramSectionId } = req.params;

    // Use values from body if available, otherwise fall back to URL params
    const courseId = bodyCourseId || paramCourseId;
    const sectionId = bodySectionId || paramSectionId;
    
    // Verify required parameters are present
    if (!courseId || !sectionId) {
      return next(new ApiError(400, 'Faltan parámetros requeridos (courseId y sectionId). Deben estar en el cuerpo de la solicitud o en la URL.'));
    }
    
    // Verify user is instructor or admin
    if (!req.user || (req.user.role !== 'instructor' && req.user.role !== 'admin')) {
      return next(new ApiError(403, 'Solo los instructores pueden crear lecciones'));
    }

    // Extract remaining fields from request body
    const {
      title,
      description,
      contentBlocks = [],
      duration = 0,
      resources = [],
      isPublished = false,
      isFree = false,
      isPreview = false
    } = restBody;

    // Solo validar courseId como ObjectId, ya que sectionId es personalizado
    if (!Types.ObjectId.isValid(courseId)) {
      return next(new ApiError(400, 'ID de curso no válido'));
    }

    // Verificar que la sección exista y pertenezca al curso
    const section = await Section.findOne({ 
      _id: sectionId,
      course: courseId
    });
    
    if (!section) {
      return next(new ApiError(404, 'Sección no encontrada o no pertenece al curso especificado'));
    }

    // Validar los bloques de contenido
    if (!Array.isArray(contentBlocks) || contentBlocks.length === 0) {
      return next(new ApiError(400, 'La lección debe contener al menos un bloque de contenido'));
    }

    // Validar cada bloque de contenido
    for (const [index, block] of contentBlocks.entries()) {
      if (!block.type || !block.content) {
        return next(new ApiError(400, `El bloque ${index + 1} debe tener tipo y contenido`));
      }
      
      // Validar el tipo de contenido
      const validTypes = ['text', 'video', 'video_link', 'pdf', 'document'];
      if (!validTypes.includes(block.type)) {
        return next(new ApiError(400, `Tipo de bloque no válido: ${block.type}`));
      }
      
      // Validar que los campos requeridos estén presentes según el tipo
      if (block.type === 'video' || block.type === 'video_link') {
        try {
          new URL(block.content);
        } catch (e) {
          return next(new ApiError(400, `La URL del video no es válida en el bloque ${index + 1}`));
        }
      }
    }

    // Calcular la duración total si no se proporciona
    let totalDuration = duration;
    if (!totalDuration) {
      totalDuration = contentBlocks.reduce((sum: number, block: any) => {
        return sum + (block.duration || 0);
      }, 0);
      // Mínimo 1 minuto de duración
      totalDuration = Math.max(1, totalDuration);
    }

    const lessonData = {
      title: title.trim(),
      description: description?.trim(),
      contentBlocks: contentBlocks.map((block: any, index: number) => ({
        type: block.type,
        content: block.content,
        title: block.title?.trim(),
        description: block.description?.trim(),
        duration: block.duration || 0,
        thumbnailUrl: block.thumbnailUrl,
        fileSize: block.fileSize,
        fileType: block.fileType,
        order: block.order !== undefined ? block.order : index
      })),
      duration: totalDuration,
      resources: resources.map((resource: any) => ({
        title: resource.title.trim(),
        url: resource.url,
        type: resource.type,
        description: resource.description?.trim(),
        fileSize: resource.fileSize,
        mimeType: resource.mimeType,
        thumbnailUrl: resource.thumbnailUrl,
        duration: resource.duration
      })),
      course: new Types.ObjectId(courseId),
      section: sectionId,
      isPublished,
      isFree,
      isPreview,
      createdBy: req.user._id,
      viewCount: 0,
      completionCount: 0,
      requiresCompletion: true,
      prerequisites: []
    };

    const lesson = new Lesson(lessonData);
    await lesson.save();

    // Actualizar el contador de lecciones en la sección
    await Section.findByIdAndUpdate(
      sectionId,
      { $inc: { lessonCount: 1 } },
      { new: true }
    );

    res.status(201).json({
      success: true,
      data: lesson,
    });
  } catch (error: any) {
    console.error('Error creating lesson:', error);
    next(new ApiError(500, `Error al crear la lección: ${error.message}`));
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
    next(new ApiError(500, 'Error al obtener las lecciones'));
  }
};

/**
 * @swagger
 * /api/v1/courses/{courseId}/sections/{sectionId}/lessons/reorder:
 *   patch:
 *     summary: Reordenar lecciones en una sección
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
 *             type: object
 *             required: [lessonIds]
 *             properties:
 *               lessonIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array de IDs de lecciones en el nuevo orden
 *     responses:
 *       200:
 *         description: Orden de lecciones actualizado correctamente
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: No tienes permiso para realizar esta acción
 *       404:
 *         description: Sección o lección no encontrada
 */
const reorderLessons = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { courseId, sectionId } = req.params;
    const { lessonIds } = req.body;

    if (!Array.isArray(lessonIds) || lessonIds.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return next(new ApiError(400, 'Se requiere un array de IDs de lecciones'));
    }

    // Verificar que todas las lecciones pertenecen a la sección y al curso
    const lessons = await Lesson.find({
      _id: { $in: lessonIds },
      section: sectionId,
      course: courseId
    }).session(session);

    if (lessons.length !== lessonIds.length) {
      await session.abortTransaction();
      session.endSession();
      return next(new ApiError(404, 'Una o más lecciones no fueron encontradas'));
    }

    // Actualizar el orden de las lecciones
    const bulkOps = lessonIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { order: index } }
      }
    }));

    await Lesson.bulkWrite(bulkOps, { session });
    
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Orden de lecciones actualizado correctamente'
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
    
    if (error.name === 'CastError') {
      return next(new ApiError(400, 'ID de curso, sección o lección inválido'));
    }
    next(new ApiError(500, `Error al reordenar las lecciones: ${error.message}`));
  }
};

// Export all controller methods
export default {
  createLesson,
  getLesson,
  getLessonsByCourse,
  getLessonsBySection,
  updateLesson,
  deleteLesson,
  getLessons,
  reorderLessons
};
