import { Request, Response, NextFunction } from 'express';
import mongoose, { Types } from 'mongoose';
import { Section } from '../models/section.model';
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
 *     SectionBase:
 *       type: object
 *       required:
 *         - title
 *         - course
 *         - order
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: ID único de la sección
 *         title:
 *           type: string
 *           description: Título de la sección
 *         course:
 *           type: string
 *           format: ObjectId
 *           description: ID del curso al que pertenece la sección
 *         order:
 *           type: integer
 *           description: Orden de la sección dentro del curso
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 * 
 *     CreateSectionInput:
 *       type: object
 *       required:
 *         - title
 *         - order
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           description: Título de la sección
 *         order:
 *           type: integer
 *           minimum: 0
 *           description: Orden de la sección
 * 
 *     UpdateSectionInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           description: Título de la sección
 *         order:
 *           type: integer
 *           minimum: 0
 *           description: Nuevo orden de la sección
 * 
 *     SectionWithLessons:
 *       allOf:
 *         - $ref: '#/components/schemas/SectionBase'
 *         - type: object
 *           properties:
 *             lessons:
 *               type: array
 *               description: Lista de lecciones de la sección
 *               items:
 *                 $ref: '#/components/schemas/Lesson'
 */

/**
 * @swagger
 * /api/v1/courses/{courseId}/sections:
 *   post:
 *     summary: Crear una nueva sección en un curso
 *     description: Crea una nueva sección en el curso especificado. Requiere permisos de instructor o administrador.
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del curso al que pertenecerá la sección
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
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Section'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Curso no encontrado
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
 * /api/v1/courses/{courseId}/sections/{id}:
 *   get:
 *     summary: Obtener una sección por ID
 *     description: Obtiene los detalles de una sección específica dentro de un curso.
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del curso al que pertenece la sección
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID de la sección a obtener
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
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Section'
 *       400:
 *         description: ID inválido
 *       404:
 *         description: Sección no encontrada o no pertenece al curso especificado
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
 * /api/v1/courses/{courseId}/sections:
 *   get:
 *     summary: Obtener todas las secciones de un curso
 *     description: Retorna la lista de secciones de un curso específico, opcionalmente incluyendo sus lecciones.
 *     tags: [Sections]
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del curso del que se desean obtener las secciones
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
 *                   example: true
 *                 count:
 *                   type: integer
 *                   description: Número total de secciones
 *                   example: 3
 *                 data:
 *                   type: array
 *                   description: Lista de secciones
 *                   items:
 *                     oneOf:
 *                       - $ref: '#/components/schemas/Section'
 *                       - $ref: '#/components/schemas/SectionWithLessons'
 *       400:
 *         description: ID de curso inválido
 *       404:
 *         description: Curso no encontrado
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
 * /api/v1/courses/{courseId}/sections/{sectionId}:
 *   put:
 *     summary: Actualizar una sección
 *     description: Actualiza los datos de una sección específica. Requiere permisos de instructor o administrador.
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del curso al que pertenece la sección
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID de la sección a actualizar
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
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Section'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Sección no encontrada o no pertenece al curso especificado
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
 * /api/v1/courses/{courseId}/sections/{sectionId}:
 *   delete:
 *     summary: Eliminar una sección
 *     description: Elimina una sección específica de un curso. Requiere permisos de instructor o administrador.
 *     tags: [Sections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del curso al que pertenece la sección
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID de la sección a eliminar
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
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Sección eliminada correctamente'
 *       400:
 *         description: ID inválido o no se puede eliminar la sección
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Sección no encontrada o no pertenece al curso especificado
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
 * /api/v1/courses/{courseId}/sections/reorder:
 *   patch:
 *     summary: Reordenar secciones de un curso (instructor/propietario o admin)
 *     tags: [Sections]
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sections
 *             properties:
 *               sections:
 *                 type: array
 *                 description: Array de objetos con el ID de la sección y su nuevo orden
 *                 items:
 *                   type: object
 *                   required:
 *                     - id
 *                     - order
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: ObjectId
 *                       description: ID de la sección
 *                     order:
 *                       type: integer
 *                       minimum: 0
 *                       description: Nuevo orden de la sección
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
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { courseId } = req.params;
    const { sections } = req.body;
    const userId = req.user?._id;

    if (!Array.isArray(sections) || sections.length === 0) {
      return next(new ApiError(400, 'Se requiere un arreglo de secciones con sus nuevos órdenes'));
    }

    // Verificar que el usuario es admin o instructor del curso
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'instructor')) {
      return next(new ApiError(403, 'No tienes permiso para reordenar las secciones'));
    }

    // Verificar que todas las secciones pertenecen al curso
    const sectionsInCourse = await Section.countDocuments({
      _id: { $in: sections.map(s => new mongoose.Types.ObjectId(s.id)) },
      course: new mongoose.Types.ObjectId(courseId)
    });

    if (sectionsInCourse !== sections.length) {
      return next(new ApiError(400, 'Algunas secciones no pertenecen al curso especificado'));
    }

    // Actualizar el orden de las secciones
    const bulkOps = sections.map(section => ({
      updateOne: {
        filter: { 
          _id: new mongoose.Types.ObjectId(section.id), 
          course: new mongoose.Types.ObjectId(courseId) 
        },
        update: { $set: { order: section.order } }
      }
    }));

    await Section.bulkWrite(bulkOps, { session });
    
    // Actualizar el campo updatedAt del curso
    await mongoose.model('Course').findByIdAndUpdate(
      new mongoose.Types.ObjectId(courseId), 
      { updatedAt: new Date() }, 
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    
    res.status(200).json({
      success: true,
      message: 'Secciones reordenadas exitosamente'
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
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
