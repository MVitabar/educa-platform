import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { catchAsync } from '../utils/catchAsync';
import { Progress } from '../models/progress.model';
import AppError from '../utils/appError';
import { IUser } from '../types/user.types';

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
 * tags:
 *   name: Progress
 *   description: Seguimiento del progreso del usuario en los cursos
 */

/**
 * @swagger
 * /api/v1/progress/course/{courseId}:
 *   get:
 *     summary: Obtener el progreso de un curso específico
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *     responses:
 *       200:
 *         description: Progreso del curso obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Progress'
 *       401:
 *         description: No autorizado - Se requiere autenticación
 *       404:
 *         description: No se encontró el progreso para este curso
 */
export const getCourseProgress = catchAsync(withAuth(async (req, res, next) => {
  const progress = await Progress.getUserCourseProgress(
    req.user._id,
    new Types.ObjectId(req.params.courseId)
  );
  
  res.status(200).json({
    status: 'success',
    data: progress
  });
}));

/**
 * @swagger
 * /api/v1/progress/course/{courseId}/track:
 *   post:
 *     summary: Actualizar el progreso de una lección
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lessonId
 *               - progress
 *             properties:
 *               lessonId:
 *                 type: string
 *                 description: ID de la lección
 *               progress:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Porcentaje de progreso (0-100)
 *     responses:
 *       200:
 *         description: Progreso actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Progress'
 *       400:
 *         description: Se requiere el ID de la lección y el progreso
 *       401:
 *         description: No autorizado - Se requiere autenticación
 *       404:
 *         description: No se encontró el progreso para este curso
 */
export const trackLessonProgress = catchAsync(withAuth(async (req, res, next) => {
  const { lessonId, progress } = req.body;
  
  if (!lessonId || progress === undefined) {
    return next(new AppError('Lesson ID and progress are required', 400));
  }

  const userProgress = await Progress.getOrCreate(
    req.user._id,
    new Types.ObjectId(req.params.courseId)
  );
  
  await userProgress.updateLessonProgress(new Types.ObjectId(lessonId), progress);
  
  const updatedProgress = await Progress.getUserCourseProgress(
    req.user._id,
    new Types.ObjectId(req.params.courseId)
  );
  
  res.status(200).json({
    status: 'success',
    data: updatedProgress
  });
}));

/**
 * @swagger
 * /api/v1/progress/course/{courseId}/complete:
 *   post:
 *     summary: Marcar una lección como completada
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - lessonId
 *             properties:
 *               lessonId:
 *                 type: string
 *                 description: ID de la lección a marcar como completada
 *     responses:
 *       200:
 *         description: Lección marcada como completada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Progress'
 *       400:
 *         description: Se requiere el ID de la lección
 *       401:
 *         description: No autorizado - Se requiere autenticación
 *       404:
 *         description: No se encontró el progreso para este curso
 */
export const completeLesson = catchAsync(withAuth(async (req, res, next) => {
  const { lessonId } = req.body;
  
  if (!lessonId) {
    return next(new AppError('Lesson ID is required', 400));
  }

  const userProgress = await Progress.getOrCreate(
    req.user._id,
    new Types.ObjectId(req.params.courseId)
  );
  
  await userProgress.completeLesson(new Types.ObjectId(lessonId));
  
  const updatedProgress = await Progress.getUserCourseProgress(
    req.user._id,
    new Types.ObjectId(req.params.courseId)
  );
  
  res.status(200).json({
    status: 'success',
    data: updatedProgress
  });
}));

/**
 * @swagger
 * /api/v1/progress/course/{courseId}/stats:
 *   get:
 *     summary: Obtener estadísticas del curso (solo instructores/administradores)
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *     responses:
 *       200:
 *         description: Estadísticas del curso obtenidas exitosamente
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
 *                     totalStudents:
 *                       type: number
 *                       description: Número total de estudiantes inscritos
 *                     averageProgress:
 *                       type: number
 *                       description: Progreso promedio de los estudiantes (0-100)
 *                     completedCount:
 *                       type: number
 *                       description: Número de estudiantes que han completado el curso
 *                     lessonCompletion:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           lessonId:
 *                             type: string
 *                           title:
 *                             type: string
 *                           completionRate:
 *                             type: number
 *       401:
 *         description: No autorizado - Se requiere autenticación
 *       403:
 *         description: No tienes permiso para ver estas estadísticas
 */
export const getCourseStats = catchAsync(withAuth(async (req, res, next) => {
  if (req.user.role !== 'instructor' && req.user.role !== 'admin') {
    return next(new AppError('Not authorized to view course stats', 403));
  }
  
  const stats = await Progress.getCourseStats(new Types.ObjectId(req.params.courseId));
  
  res.status(200).json({
    status: 'success',
    data: stats
  });
}));