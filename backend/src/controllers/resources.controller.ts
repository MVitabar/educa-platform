import { Request, Response, NextFunction } from 'express';
import AppError from '../utils/appError';
import { catchAsync } from '../utils/catchAsync';
import { IUser } from '../types/user.types';

/**
 * @swagger
 * tags:
 *   name: Resources
 *   description: Gestión de recursos de lecciones
 */

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
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 */

// Temporary interface until we create the Resource model
interface IResource {
  _id: any;
  title: string;
  description?: string;
  url: string;
  type: string;
  lesson: any;
  uploadedBy: any;
}

// Temporary mock for Resource model
const Resource = {
  find: (query: any) => Promise.resolve<IResource[]>([]),
  findById: (id: string) => Promise.resolve<IResource | null>(null),
  create: (data: Omit<IResource, '_id'>) => Promise.resolve<IResource>({ ...data, _id: 'mock-id' } as IResource),
  findOneAndUpdate: (filter: any, update: any, options: any) => Promise.resolve<IResource | null>(null),
  findOneAndDelete: (filter: any) => Promise.resolve<IResource | null>(null)
} as const;

/**
 * @swagger
 * /api/v1/lessons/{lessonId}/resources:
 *   get:
 *     summary: Obtener todos los recursos de una lección
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
 *         required: true
 *         schema:
 *           type: string
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
  const { lessonId } = req.params;
  
  const resources = await Resource.find({ lesson: lessonId });
  
  res.status(200).json({
    status: 'success',
    results: resources.length,
    data: {
      resources
    }
  });
});

/**
 * @swagger
 * /api/v1/resources/{id}:
 *   get:
 *     summary: Obtener un recurso por ID
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del recurso
 *     responses:
 *       200:
 *         description: Detalles del recurso
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
 *       404:
 *         description: Recurso no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getResource = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const resource = await Resource.findById(req.params.id);
  
  if (!resource) {
    return next(new AppError('No resource found with that ID', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      resource
    }
  });
});

export const uploadResource = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { lessonId } = req.params;
  const { title, description, url, type } = req.body;
  
  const newResource = await Resource.create({
    title,
    description,
    url,
    type,
    lesson: lessonId,
    uploadedBy: (req.user as IUser)._id
  });
  
  res.status(201).json({
    status: 'success',
    data: {
      resource: newResource
    }
  });
});

/**
 * @swagger
 * /api/v1/resources/{id}:
 *   patch:
 *     summary: Actualizar un recurso
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del recurso
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               url:
 *                 type: string
 *                 format: uri
 *               type:
 *                 type: string
 *                 enum: [pdf, video, link, document, image, other]
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
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Recurso no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const updateResource = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { title, description, url, type } = req.body;
  
  const resource = await Resource.findOneAndUpdate(
    { _id: req.params.id, uploadedBy: (req.user as IUser)._id },
    { title, description, url, type },
    { new: true, runValidators: true }
  );
  
  if (!resource) {
    return next(new AppError('No resource found with that ID or you are not authorized to update it', 404));
  }
  
  res.status(200).json({
    status: 'success',
    data: {
      resource
    }
  });
});

/**
 * @swagger
 * /api/v1/resources/{id}:
 *   delete:
 *     summary: Eliminar un recurso
 *     tags: [Resources]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del recurso
 *     responses:
 *       204:
 *         description: Recurso eliminado exitosamente
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Recurso no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const deleteResource = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const resource = await Resource.findOneAndDelete({
    _id: req.params.id,
    $or: [
      { uploadedBy: (req.user as IUser)._id },
      { role: 'admin' }
    ]
  });
  
  if (!resource) {
    return next(new AppError('No resource found with that ID or you are not authorized to delete it', 404));
  }
  
  res.status(204).json({
    status: 'success',
    data: null
  });
});
