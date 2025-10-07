import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import AppError from '../utils/appError';
import { catchAsync } from '../utils/catchAsync';
import { IUser } from '../types/user.types';
import { Lesson } from '../models/lesson.model';
import { IResource, Resource } from '../models/resource.model';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser & { _id: Types.ObjectId };
    }
  }
}

// Type guard to check if user is authenticated
function isAuthenticatedRequest(req: Request): req is Request & { user: IUser & { _id: Types.ObjectId } } {
  return !!(req.user && req.user._id);
}

// Create a wrapper for authenticated routes
const withAuth = (handler: (req: Request & { user: IUser & { _id: Types.ObjectId } }, res: Response, next: NextFunction) => Promise<void>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!isAuthenticatedRequest(req)) {
      return next(new AppError('Authentication required', 401));
    }
    return handler(req as Request & { user: IUser & { _id: Types.ObjectId } }, res, next);
  };
};

/**
 * @swagger
 * components:
 *   schemas:
 *     Resource:
 *       type: object
 *       required:
 *         - title
 *         - url
 *         - type
 *         - lesson
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: ID único del recurso
 *         title:
 *           type: string
 *           description: Título del recurso
 *         description:
 *           type: string
 *           description: Descripción detallada del recurso
 *         url:
 *           type: string
 *           format: uri
 *           description: URL del recurso
 *         type:
 *           type: string
 *           enum: [pdf, video, link, document, image, other]
 *           description: Tipo de recurso
 *         lesson:
 *           type: string
 *           format: ObjectId
 *           description: ID de la lección a la que pertenece el recurso
 *         uploadedBy:
 *           type: string
 *           format: ObjectId
 *           description: ID del usuario que subió el recurso
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 */

/**
 * @swagger
 * /api/v1/courses/{courseId}/sections/{sectionId}/lessons/{lessonId}/resources:
 *   get:
 *     tags: [Resources]
 *     summary: Obtener recursos de una lección
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del curso
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID de la sección
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID de la lección
 *     responses:
 *       200:
 *         description: Lista de recursos de la lección
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
 *                   example: 1
 *                 data:
 *                   type: object
 *                   properties:
 *                     resources:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Resource'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Lección no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getLessonResources = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { courseId, sectionId, lessonId } = req.params;
  
  // Verificar que la lección pertenece a la sección y al curso
  const lesson = await Lesson.findOne({
    _id: lessonId,
    section: sectionId,
    course: courseId
  }).exec();
  
  if (!lesson) {
    return next(new AppError('No se encontró la lección o no pertenece a la sección y curso especificados', 404));
  }
  
  // Explicitly type the query object to help TypeScript
  interface ResourceQuery {
    lesson: Types.ObjectId;
  }
  
  const query: ResourceQuery = { 
    lesson: new Types.ObjectId(lessonId) 
  };
  
  // Use type assertion to help TypeScript understand the query
  const resources = await Resource.find(query as any);

  res.status(200).json({
    status: 'success',
    results: resources.length,
    data: {
      resources,
    },
  });
});

/**
 * @swagger
 * /api/v1/courses/{courseId}/sections/{sectionId}/lessons/{lessonId}/resources/{id}:
 *   get:
 *     tags: [Resources]
 *     summary: Obtener un recurso por ID
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del curso
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID de la sección
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID de la lección
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del recurso
 *     responses:
 *       200:
 *         description: Recurso encontrado
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
 *                     resource:
 *                       $ref: '#/components/schemas/Resource'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Recurso no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getResource = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { courseId, sectionId, lessonId, id: resourceId } = req.params;
  
  // Verificar que el recurso pertenece a la lección, sección y curso
  const resource = await Resource.findOne({
    _id: resourceId,
    lesson: lessonId
  });
  
  if (!resource) {
    return next(new AppError('No se encontró el recurso o no pertenece a la lección especificada', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      resource
    },
  });
});

/**
 * @swagger
 * /api/v1/courses/{courseId}/sections/{sectionId}/lessons/{lessonId}/resources:
 *   post:
 *     tags: [Resources]
 *     summary: Subir un nuevo recurso a una lección
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del curso
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID de la sección
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID de la lección
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *               - url
 *             properties:
 *               title:
 *                 type: string
 *                 description: Título del recurso
 *               description:
 *                 type: string
 *                 description: Descripción del recurso
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: URL del recurso
 *               type:
 *                 type: string
 *                 enum: [pdf, video, link, document, image, other]
 *                 description: Tipo de recurso
 *     responses:
 *       201:
 *         description: Recurso creado exitosamente
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
 *                     resource:
 *                       $ref: '#/components/schemas/Resource'
 *       400:
 *         description: Datos de entrada no válidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Lección no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const uploadResource = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { title, description, url, type } = req.body;
  const { courseId, sectionId, lessonId } = req.params;
  const userId = (req.user as IUser)._id;
  
  // Verificar que la lección pertenece a la sección y al curso
  const lesson = await Lesson.findOne({
    _id: lessonId,
    section: sectionId,
    course: courseId
  });
  
  if (!lesson) {
    return next(new AppError('No se encontró la lección o no pertenece a la sección y curso especificados', 404));
  }
  
  const newResource = await Resource.create({
    title,
    description,
    url,
    type,
    lesson: lessonId,
    uploadedBy: userId
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      resource: newResource
    },
  });
});

/**
 * @swagger
 * /api/v1/courses/{courseId}/sections/{sectionId}/lessons/{lessonId}/resources/{id}:
 *   put:
 *     tags: [Resources]
 *     summary: Actualizar un recurso existente
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del curso
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID de la sección
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID de la lección
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del recurso a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Título del recurso
 *               description:
 *                 type: string
 *                 description: Descripción del recurso
 *               url:
 *                 type: string
 *                 format: uri
 *                 description: URL del recurso
 *               type:
 *                 type: string
 *                 enum: [pdf, video, link, document, image, other]
 *                 description: Tipo de recurso
 *     responses:
 *       200:
 *         description: Recurso actualizado exitosamente
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
 *                     resource:
 *                       $ref: '#/components/schemas/Resource'
 *       400:
 *         description: Datos de entrada no válidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Recurso no encontrado
 */
export const updateResource = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { title, description, url, type } = req.body;
  const userId = (req.user as IUser)._id;

  // Verificar que el recurso existe y pertenece al usuario
  const resource = await Resource.findOne({
    _id: id,
    uploadedBy: userId
  });

  if (!resource) {
    return next(new AppError('No se encontró el recurso o no tienes permiso para actualizarlo', 404));
  }

  // Actualizar solo los campos proporcionados
  const updateData: Partial<IResource> = {};
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (url !== undefined) updateData.url = url;
  if (type !== undefined) updateData.type = type;

  const updatedResource = await Resource.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!updatedResource) {
    return next(new AppError('Error al actualizar el recurso', 500));
  }

  res.status(200).json({
    status: 'success',
    data: {
      resource: updatedResource
    }
  });
});

/**
 * @swagger
 * /api/v1/courses/{courseId}/sections/{sectionId}/lessons/{lessonId}/resources/{id}:
 *   delete:
 *     tags: [Resources]
 *     summary: Eliminar un recurso
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del curso
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID de la sección
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID de la lección
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del recurso a eliminar
 *     responses:
 *       204:
 *         description: Recurso eliminado exitosamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Recurso no encontrado
 */
export const deleteResource = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { courseId, sectionId, lessonId, id: resourceId } = req.params;
  const userId = (req.user as IUser)._id;
  
  // Verificar que el recurso existe y pertenece al usuario
  const resource = await Resource.findOne({
    _id: resourceId,
    lesson: lessonId,
    $or: [
      { uploadedBy: userId },
      { role: 'admin' }
    ]
  });
  
  if (!resource) {
    return next(new AppError('No se encontró el recurso o no tienes permiso para eliminarlo', 404));
  }
  
  await Resource.findByIdAndDelete(resourceId);
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});

// Export all controller functions
export default {
  getLessonResources,
  getResource,
  uploadResource,
  updateResource,
  deleteResource
};
