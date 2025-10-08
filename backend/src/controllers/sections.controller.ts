import { Request, Response, NextFunction } from 'express';
import mongoose, { Types } from 'mongoose';
import { Section } from '../models/section.model';
import { Lesson } from '../models/lesson.model';
import Course from '../models/course.model';
import { ApiError } from '../utils/apiError';
import { IUser } from '../types/user.types';
import { generateSectionId } from '../utils/generateId';

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
  console.log('=== Inicio de createSection ===');
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  const session = await mongoose.startSession();
  await session.startTransaction();
  
  try {
    console.log('Verificando permisos del usuario...');
    // Verificar que el usuario es instructor o admin
    if (!req.user || (req.user.role !== 'instructor' && req.user.role !== 'admin')) {
      console.log('Usuario no autorizado para crear secciones');
      await session.abortTransaction();
      session.endSession();
      return next(new ApiError(403, 'Solo los instructores pueden crear secciones'));
    }

    // Get courseId from URL params
    const { courseId } = req.params;
    console.log('ID del curso:', courseId);
    
    // Validate courseId
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      console.log('ID de curso inválido:', courseId);
      await session.abortTransaction();
      session.endSession();
      return next(new ApiError(400, 'ID de curso inválido'));
    }

    console.log('Verificando existencia del curso...');
    // Check if course exists and get sections count
    const course = await Course.exists({ _id: courseId }).session(session);
    if (!course) {
      console.log('Curso no encontrado:', courseId);
      await session.abortTransaction();
      session.endSession();
      return next(new ApiError(404, 'Curso no encontrado'));
    }

    console.log('Contando secciones existentes...');
    // Get current sections count
    const sectionsCount = await Section.countDocuments({ course: courseId }).session(session);
    console.log('Número de secciones actuales:', sectionsCount);

    // Generate custom section ID
    const sectionId = generateSectionId(courseId);
    console.log('Nuevo ID de sección generado:', sectionId);

    // Create section with custom ID
    const sectionData = {
      _id: sectionId,
      ...req.body,
      course: courseId,
      createdBy: req.user._id,
      updatedBy: req.user._id,
      order: sectionsCount // Set initial order
    };
    
    console.log('Datos de la nueva sección:', sectionData);
    
    // Create the section using the model directly with the session
    console.log('Creando la sección...');
    const section = new Section(sectionData);
    await section.save({ session });
    console.log('Sección creada en la base de datos');

    console.log('Haciendo commit de la transacción...');
    await session.commitTransaction();
    session.endSession();
    console.log('Transacción completada con éxito');

    // Populate the createdBy field for the response
    console.log('Obteniendo datos completos de la sección...');
    const populatedSection = await Section.findById(section._id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    console.log('Enviando respuesta al cliente...');
    res.status(201).json({
      success: true,
      data: populatedSection
    });
  } catch (error: any) {
    await session.abortTransaction();
    session.endSession();
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
    const { sectionId, courseId } = req.params;
    
    // Find the section by ID and ensure it belongs to the specified course
    const section = await Section.findOne({ _id: sectionId, course: courseId });
    
    if (!section) {
      return next(new ApiError(404, 'Sección no encontrada o no pertenece al curso especificado'));
    }

    // Verificar que el usuario es admin o instructor del curso
    if (!req.user || (req.user.role !== 'admin' && section.createdBy.toString() !== req.user._id.toString())) {
      return next(new ApiError(403, 'No tienes permiso para eliminar esta sección'));
    }

    // Iniciar una transacción para asegurar la consistencia de los datos
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Eliminar todas las lecciones asociadas a esta sección
      // Primero, obtener el ID de la sección como string
      const sectionIdStr = section._id.toString();
      
      // Eliminar las lecciones que pertenecen a esta sección
      const deleteResult = await Lesson.deleteMany(
        { section: sectionIdStr },
        { session }
      );
      
      console.log(`Eliminadas ${deleteResult.deletedCount} lecciones de la sección ${sectionIdStr}`);

      // Eliminar la sección
      await section.deleteOne({ session });
      
      // Confirmar la transacción
      await session.commitTransaction();
      session.endSession();
      
      console.log(`Sección ${section._id} y sus lecciones asociadas eliminadas correctamente`);
    
      res.status(200).json({
        success: true,
        message: 'Sección y sus lecciones eliminadas correctamente'
      });
    } catch (error: any) {
      // Si hay un error, deshacer la transacción
      await session.abortTransaction();
      session.endSession();
      
      console.error('Error al eliminar la sección y sus lecciones:', error);
      
      if (error.name === 'CastError') {
        return next(new ApiError(400, 'ID de sección inválido'));
      }
      next(new ApiError(500, `Error al eliminar la sección: ${error.message}`));
    }
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

/**
 * @swagger
 * /api/v1/courses/{courseId}/sections/{sectionId}/next-lesson-order:
 *   get:
 *     summary: Obtener el siguiente orden disponible para una lección en la sección
 *     description: Obtiene el siguiente número de orden disponible para una nueva lección en la sección especificada
 *     tags: [Sections]
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
 *     responses:
 *       200:
 *         description: Siguiente orden disponible para una nueva lección
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: number
 *                   description: Siguiente número de orden disponible
 *                   example: 1
 *       400:
 *         description: ID de sección inválido
 *       404:
 *         description: Sección no encontrada
 */
export const getNextLessonOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { sectionId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sectionId)) {
      return next(new ApiError(400, 'ID de sección no válido'));
    }

    // Verificar que la sección exista
    const section = await Section.findById(sectionId);
    if (!section) {
      return next(new ApiError(404, 'Sección no encontrada'));
    }

    // Obtener la última lección de la sección ordenada por orden descendente
    const lastLesson = await mongoose.model('Lesson').findOne(
      { section: sectionId },
      { order: 1 },
      { sort: { order: -1 } }
    );

    // Calcular el siguiente orden
    const nextOrder = (lastLesson?.order ?? 0) + 1;

    res.status(200).json({
      success: true,
      data: nextOrder
    });
  } catch (error) {
    console.error('Error al obtener el siguiente orden de lección:', error);
    next(new ApiError(500, 'Error al obtener el siguiente orden de lección'));
  }
};

export default {
  createSection,
  getSection,
  getSectionsByCourse,
  updateSection,
  deleteSection,
  reorderSections,
  getNextLessonOrder
};
