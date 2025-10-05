import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
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
 *   name: Sections
 *   description: Gestión de secciones de cursos
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Section:
 *       type: object
 *       required:
 *         - title
 *         - course
 *         - order
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           example: 5f8d0f4d7f4f1d4e3c8d9e0f
 *           description: ID único de la sección
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: 'Introducción al curso'
 *           description: Título de la sección
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: 'En esta sección aprenderás los conceptos básicos'
 *           description: Descripción detallada de la sección
 *         course:
 *           type: string
 *           format: ObjectId
 *           example: 5f8d0f4d7f4f1d4e3c8d9e0f
 *           description: ID del curso al que pertenece la sección
 *         order:
 *           type: integer
 *           minimum: 0
 *           example: 1
 *           description: Orden de la sección dentro del curso
 *         isPublished:
 *           type: boolean
 *           default: false
 *           description: Indica si la sección está publicada
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación de la sección
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 * 
 *     CreateSectionInput:
 *       type: object
 *       required:
 *         - title
 *         - course
 *         - order
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: 'Introducción al curso'
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: 'En esta sección aprenderás los conceptos básicos'
 *         course:
 *           type: string
 *           format: ObjectId
 *           example: 5f8d0f4d7f4f1d4e3c8d9e0f
 *         order:
 *           type: integer
 *           minimum: 0
 *           example: 1
 *         isPublished:
 *           type: boolean
 *           default: false
 * 
 *     UpdateSectionInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: 'Introducción al curso actualizada'
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: 'Contenido actualizado de la sección'
 *         order:
 *           type: integer
 *           minimum: 0
 *           example: 2
 *         isPublished:
 *           type: boolean
 *           example: true
 * 
 *     SectionWithLessons:
 *       allOf:
 *         - $ref: '#/components/schemas/Section'
 *         - type: object
 *           properties:
 *             lessons:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lesson'
 *               description: Lista de lecciones de la sección
 *           default: false
 *           example: true
 *           description: Indica si la sección está publicada
 *         publishedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de publicación de la sección
 *         createdBy:
 *           type: string
 *           format: ObjectId
 *           description: ID del usuario que creó la sección
 *         updatedBy:
 *           type: string
 *           format: ObjectId
 *           description: ID del usuario que actualizó la sección por última vez
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         lessons:
 *           type: array
 *           items:
 *             type: string
 *             format: ObjectId
 *           description: IDs de las lecciones en esta sección
 *         lessonCount:
 *           type: integer
 *           description: Número de lecciones en la sección
 *         duration:
 *           type: number
 *           description: Duración total de la sección en minutos
 *
 *     CreateSectionInput:
 *       type: object
 *       required:
 *         - title
 *         - course
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: 'Introducción al curso'
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: 'En esta sección aprenderás los conceptos básicos'
 *         course:
 *           type: string
 *           format: ObjectId
 *           example: 5f8d0f4d7f4f1d4e3c8d9e0f
 *         order:
 *           type: integer
 *           minimum: 0
 *           example: 1
 *         isPublished:
 *           type: boolean
 *           default: false
 *
 *     UpdateSectionInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           example: 'Introducción al curso actualizada'
 *         description:
 *           type: string
 *           maxLength: 500
 *           example: 'Contenido actualizado de la sección'
 *         order:
 *           type: integer
 *           minimum: 0
 *           example: 2
 *         isPublished:
 *           type: boolean
 *           example: true
 *
 *     SectionWithLessons:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         order:
 *           type: integer
 *         lessons:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *                 format: ObjectId
 *               title:
 *                 type: string
 *               duration:
 *                 type: number
 *               isPublished:
 *                 type: boolean
 *               isPreview:
 *                 type: boolean
 *               order:
 *                 type: number
 *               videoUrl:
 *                 type: string
 *                 format: uri
 */

/**
 * @swagger
 * tags:
 *   name: Sections
 *   description: Gestión de secciones de cursos
 */

/**
 * @swagger
 * /api/v1/sections:
 *   post:
 *     summary: Crear una nueva sección (instructor/admin)
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateSectionInput'
 *     responses:
 *       201:
 *         description: Sección creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Section'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
export const createSection = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Verificar que el usuario es instructor o admin
    if (!req.user || (req.user.role !== 'instructor' && req.user.role !== 'admin')) {
      return next(new ApiError(403, 'Solo los instructores pueden crear secciones'));
    }

    const section = await Section.create({
      ...req.body,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: section
    });
  } catch (error: any) {
    next(new ApiError(400, `Error al crear la sección: ${error.message}`));
  }
};

/**
 * @swagger
 * /api/v1/sections/{id}:
 *   get:
 *     summary: Obtener una sección por ID
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sección
 *     responses:
 *       200:
 *         description: Detalles de la sección
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Section'
 *       404:
 *         description: Sección no encontrada
 *       400:
 *         description: ID inválido
 */
export const getSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const section = await Section.findById(req.params.id)
      .populate('course', 'title')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!section) {
      return next(new ApiError(404, 'Sección no encontrada'));
    }

    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      return next(new ApiError(400, 'ID de sección inválido'));
    }
    next(new ApiError(500, `Error al obtener la sección: ${error.message}`));
  }
};

/**
 * @swagger
 * /api/v1/sections/course/{courseId}:
 *   get:
 *     summary: Obtener todas las secciones de un curso
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *       - in: query
 *         name: includeLessons
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Incluir las lecciones de cada sección
 *     responses:
 *       200:
 *         description: Lista de secciones del curso
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
 *                     oneOf:
 *                       - $ref: '#/components/schemas/Section'
 *                       - $ref: '#/components/schemas/SectionWithLessons'
 */
export const getSectionsByCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { courseId } = req.params;
    const { includeLessons } = req.query;

    let sections;
    
    if (includeLessons === 'true') {
      sections = await Section.getCourseSectionsWithLessons(courseId);
    } else {
      sections = await Section.find({ course: courseId })
        .sort('order')
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email');
    }

    res.status(200).json({
      success: true,
      count: sections.length,
      data: sections
    });
  } catch (error: any) {
    next(new ApiError(500, `Error al obtener las secciones: ${error.message}`));
  }
};

/**
 * @swagger
 * /api/v1/sections/{id}:
 *   put:
 *     summary: Actualizar una sección (instructor/propietario o admin)
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sección
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateSectionInput'
 *     responses:
 *       200:
 *         description: Sección actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Section'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Sección no encontrada
 */
export const updateSection = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    let section = await Section.findById(req.params.id);
    
    if (!section) {
      return next(new ApiError(404, 'Sección no encontrada'));
    }

    // Verificar que el usuario es admin o instructor del curso
    if (!req.user || (req.user.role !== 'admin' && section.createdBy.toString() !== req.user._id.toString())) {
      return next(new ApiError(403, 'No tienes permiso para actualizar esta sección'));
    }

    section = await Section.findByIdAndUpdate(
      req.params.id, 
      { 
        ...req.body,
        updatedBy: req.user._id
      }, 
      {
        new: true,
        runValidators: true
      }
    );
    
    res.status(200).json({
      success: true,
      data: section
    });
  } catch (error: any) {
    next(new ApiError(400, `Error al actualizar la sección: ${error.message}`));
  }
};

/**
 * @swagger
 * /api/v1/sections/{id}:
 *   delete:
 *     summary: Eliminar una sección (instructor/propietario o admin)
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la sección
 *     responses:
 *       200:
 *         description: Sección eliminada exitosamente
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
 *         description: Sección no encontrada
 */
export const deleteSection = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const section = await Section.findById(req.params.id);
    
    if (!section) {
      return next(new ApiError(404, 'Sección no encontrada'));
    }

    // Verificar que el usuario es admin o instructor del curso
    if (!req.user || (req.user.role !== 'admin' && section.createdBy.toString() !== req.user._id.toString())) {
      return next(new ApiError(403, 'No tienes permiso para eliminar esta sección'));
    }

    // Verificar que la sección no tenga lecciones
    if (section.lessons && section.lessons.length > 0) {
      return next(new ApiError(400, 'No se puede eliminar una sección que contiene lecciones'));
    }

    await section.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      return next(new ApiError(400, 'ID de sección inválido'));
    }
    next(new ApiError(500, `Error al eliminar la sección: ${error.message}`));
  }
};

/**
 * @swagger
 * /api/v1/sections/reorder:
 *   post:
 *     summary: Reordenar secciones de un curso (instructor/propietario o admin)
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - courseId
 *               - sections
 *             properties:
 *               courseId:
 *                 type: string
 *                 format: ObjectId
 *                 example: 5f8d0f4d7f4f1d4e3c8d9e0f
 *               sections:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - order
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: ObjectId
 *                     order:
 *                       type: integer
 *                       minimum: 0
 *     responses:
 *       200:
 *         description: Secciones reordenadas exitosamente
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
 *         description: Datos de entrada inválidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
export const reorderSections = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { courseId, sections } = req.body;

    if (!courseId || !sections || !Array.isArray(sections)) {
      return next(new ApiError(400, 'Se requieren courseId y sections en el cuerpo de la solicitud'));
    }

    // Verificar que el usuario es admin o instructor del curso
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'instructor')) {
      return next(new ApiError(403, 'No tienes permiso para reordenar las secciones'));
    }

    const sectionIds = sections.map(s => s.id);
    await Section.reorderSections(courseId, sectionIds);
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error: any) {
    next(new ApiError(400, `Error al reordenar las secciones: ${error.message}`));
  }
};

export default {
  createSection,
  getSection,
  getSectionsByCourse,
  updateSection,
  deleteSection,
  reorderSections
};
