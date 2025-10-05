import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Enrollment } from '../models/enrollment.model';
import User from '../models/user.model';
import Course from '../models/course.model';
import AppError from '../utils/appError';
import { catchAuthAsync, AuthenticatedRequest } from '../utils/catchAsync';

/**
 * @swagger
 * tags:
 *   name: Enrollments
 *   description: Gestión de inscripciones a cursos
 * 
 * components:
 *   schemas:
 *     Enrollment:
 *       type: object
 *       required:
 *         - student
 *         - course
 *         - status
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: ID único de la inscripción
 *         student:
 *           type: string
 *           format: ObjectId
 *           description: Referencia al modelo de Usuario (estudiante)
 *         course:
 *           type: string
 *           format: ObjectId
 *           description: Referencia al modelo de Curso
 *         status:
 *           type: string
 *           enum: [pending, active, completed, cancelled]
 *           default: pending
 *           description: Estado de la inscripción
 *         completedLessons:
 *           type: array
 *           items:
 *             type: string
 *             format: ObjectId
 *             description: IDs de las lecciones completadas
 *         progress:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           default: 0
 *           description: Porcentaje de finalización del curso
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de finalización del curso
 *         enrolledAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de inscripción
 *         lastAccessed:
 *           type: string
 *           format: date-time
 *           description: Último acceso al curso
 *         metadata:
 *           type: object
 *           description: Metadatos adicionales de la inscripción
 * 
 *     EnrollmentInput:
 *       type: object
 *       required:
 *         - courseId
 *       properties:
 *         courseId:
 *           type: string
 *           format: ObjectId
 *           description: ID del curso al que se desea inscribir
 * 
 *     EnrollmentUpdate:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, active, completed, cancelled]
 *           description: Nuevo estado de la inscripción
 *         progress:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           description: Nuevo porcentaje de progreso
 *         completedLessons:
 *           type: array
 *           items:
 *             type: string
 *             format: ObjectId
 *             description: IDs de lecciones completadas
 * 
 *   responses:
 *     EnrollmentResponse:
 *       description: Respuesta de éxito para operaciones de inscripción
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 example: success
 *               data:
 *                 $ref: '#/components/schemas/Enrollment'
 *           format: date-time
 *           description: When the enrollment was created
 * 
 *     CreateEnrollmentInput:
 *       type: object
 *       required:
 *         - courseId
 *       properties:
 *         courseId:
 *           type: string
 *           description: ID of the course to enroll in
 * 
 *     UpdateEnrollmentInput:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, active, completed, cancelled]
 *           description: New status of the enrollment
 *         completedLessons:
 *           type: array
 *           items:
 *             type: string
 *             description: Array of completed lesson IDs
 * 
 * @swagger
 * tags:
 *   name: Enrollments
 *   description: Course enrollment management
 */

/**
 * @swagger
 * /api/v1/courses/{courseId}/enroll:
 *   post:
 *     summary: Enroll in a course
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the course to enroll in
 *     responses:
 *       201:
 *         description: Successfully enrolled in the course
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/Enrollment'
 *       400:
 *         description: Ya estás inscrito en este curso
 *       401:
 *         description: No autorizado - Se requiere autenticación
 *       404:
 *         description: No se encontró el curso con ese ID
 */
export const createEnrollment = catchAuthAsync(async (req, res, next) => {
  const { courseId } = req.body;
  const userId = req.user._id;

  // Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError('No se encontró el curso con ese ID', 404));
  }

  // Check if already enrolled
  const existingEnrollment = await Enrollment.findOne({ user: userId, course: courseId });
  if (existingEnrollment) {
    return next(new AppError('Ya estás inscrito en este curso', 400));
  }

  const enrollment = await Enrollment.create({
    user: userId,
    course: courseId,
    progress: 0,
    completedLessons: [],
    completed: false,
    enrolledAt: new Date()
  });

  // Populate course details
  await enrollment.populate('course', 'title description image instructor');

  res.status(201).json({
    status: 'success',
    data: {
      enrollment
    }
  });
});

/**
 * @swagger
 * /api/v1/enrollments/me/courses:
 *   get:
 *     summary: Get all enrollments for the current user (Student only)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's enrollments
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnrollmentList'
 */
// Get all enrollments for the current user (student only)
/**
 * @swagger
 * /api/v1/enrollments/my-enrollments:
 *   get:
 *     summary: Obtener mis inscripciones
 *     description: Obtiene la lista de cursos en los que el usuario está inscrito
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, completed, cancelled]
 *         description: Filtrar por estado de inscripción
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página para la paginación
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de resultados por página
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [enrolledAt, -enrolledAt, progress, -progress]
 *           default: -enrolledAt
 *         description: Campo por el cual ordenar los resultados
 *     responses:
 *       200:
 *         description: Lista de inscripciones obtenida exitosamente
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
 *                     enrollments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Enrollment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
/**
 * @swagger
 * /api/v1/courses/{courseId}/students:
 *   get:
 *     summary: Get all enrollments for a course (instructor only)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the course
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, completed, cancelled]
 *         description: Filter by enrollment status
 *     responses:
 *       200:
 *         description: List of enrollments for the course
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
 *                     $ref: '#/components/schemas/Enrollment'
 *       403:
 *         description: Not authorized to view these enrollments
 *       404:
 *         description: Course not found
 */
export const getEnrollmentsByCourse = catchAuthAsync(async (req, res, next) => {
  const { courseId } = req.params;
  const { status } = req.query;

  // Check if the course exists and the current user is the instructor
  const course = await Course.findOne({
    _id: courseId,
    instructor: req.user._id
  });

  if (!course) {
    return next(new AppError('No se encontró el curso o no tienes permiso para ver estas inscripciones', 404));
  }

  // Build query
  const query: any = { course: courseId };
  if (status) {
    query.status = status;
  }

  const enrollments = await Enrollment.find(query)
    .populate('student', 'name email')
    .populate('course', 'title');

  res.status(200).json({
    success: true,
    count: enrollments.length,
    data: enrollments
  });
});

/**
 * @swagger
 * /api/v1/me/enrollments:
 *   get:
 *     summary: Get current user's enrollments
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, active, completed, cancelled]
 *         description: Filter by enrollment status
 *     responses:
 *       200:
 *         description: List of user's enrollments
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
 *                     $ref: '#/components/schemas/Enrollment'
 */
export const getMyEnrollments = catchAuthAsync(async (req, res, next) => {
  const userId = req.user._id;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [enrollments, total] = await Promise.all([
    Enrollment.find({ user: userId })
      .populate('course', 'title description image instructor')
      .sort('-enrolledAt')
      .skip(skip)
      .limit(limit),
    Enrollment.countDocuments({ user: userId })
  ]);

  res.status(200).json({
    status: 'success',
    results: enrollments.length,
    data: {
      enrollments
    },
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @swagger
 * /api/v1/enrollments/me/courses/{courseId}:
 *   get:
 *     summary: Check if user is enrolled in a course
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the course to check
 *     responses:
 *       200:
 *         description: Enrollment status
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
 *                     isEnrolled:
 *                       type: boolean
 *                     enrollment:
 *                       $ref: '#/components/schemas/Enrollment'
 */
export const checkEnrollment = catchAuthAsync(async (req, res, next) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  const enrollment = await Enrollment.findOne({
    user: userId,
    course: courseId
  }).populate('course', 'title description image instructor');

  if (!enrollment) {
    return res.status(200).json({
      status: 'success',
      data: {
        isEnrolled: false
      }
    });
  }

  res.status(200).json({
    status: 'success',
    data: {
      isEnrolled: true,
      enrollment
    }
  });
});

/**
 * @swagger
 * /api/v1/enrollments/course/{courseId}:
 *   get:
 *     summary: Get enrollments for a specific course (Admin/Instructor only)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the course to get enrollments for
 *     responses:
 *       200:
 *         description: List of enrollments for the course
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EnrollmentList'
 */
// Get enrollments for a specific course (admin/instructor only)
/**
 * @swagger
 * /api/v1/enrollments/enroll:
 *   post:
 *     summary: Inscribirse a un curso
 *     description: Crea una nueva inscripción para el usuario autenticado
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EnrollmentInput'
 *     responses:
 *       201:
 *         description: Inscripción creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/EnrollmentResponse'
 *       400:
 *         description: Ya estás inscrito en este curso
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Curso no encontrado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const enrollInCourse = catchAuthAsync(async (req, res, next) => {
  const { courseId } = req.params;
  const userId = req.user._id;
  
  // Check if the user is the course instructor or admin
  const course = await Course.findById(courseId);
  if (!course) {
    return next(new AppError('No se encontró el curso con ese ID', 404));
  }
  
  if (course.instructor.toString() !== userId.toString() && req.user.role !== 'admin') {
    return next(new AppError('No estás autorizado para ver estas inscripciones', 403));
  }

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [enrollments, total] = await Promise.all([
    Enrollment.find({ course: courseId })
      .populate('user', 'name email')
      .sort('-enrolledAt')
      .skip(skip)
      .limit(limit),
    Enrollment.countDocuments({ course: courseId })
  ]);

  res.status(200).json({
    status: 'success',
    results: enrollments.length,
    data: {
      enrollments
    },
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit)
    }
  });
});

// Get student dashboard statistics
/**
 * @swagger
 * /api/v1/enrollments/dashboard/stats:
 *   get:
 *     summary: Obtener estadísticas del dashboard
 *     description: Obtiene estadísticas generales para el dashboard del estudiante
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
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
 *                     totalEnrollments:
 *                       type: number
 *                       description: Número total de cursos inscritos
 *                     completedCourses:
 *                       type: number
 *                       description: Número de cursos completados
 *                     inProgressCourses:
 *                       type: number
 *                       description: Número de cursos en progreso
 *                     averageProgress:
 *                       type: number
 *                       description: Progreso promedio en todos los cursos
 *                     recentCourses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Enrollment'
 *                       description: Cursos recientemente accedidos
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
export const getDashboardStats = catchAuthAsync(async (req, res, next) => {
  const userId = req.user._id;

  // Obtener todas las inscripciones del usuario
  const enrollments = await Enrollment.find({ user: userId })
    .populate('course', 'title');

  // Calcular estadísticas
  const enrolledCourses = enrollments.length;
  const completedCourses = enrollments.filter(e => e.progress === 100).length;
  const coursesInProgress = enrollments.filter(e => e.progress > 0 && e.progress < 100).length;
  const completionRate = enrolledCourses > 0 
    ? enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrolledCourses 
    : 0;

  // Calcular horas de estudio (en un entorno real, esto vendría de un registro de tiempo)
  // Por ahora, usamos una estimación basada en el progreso
  const estimatedHoursPerCourse = 10; // Horas estimadas por curso
  const totalHoursWatched = enrollments.reduce(
    (sum, e) => sum + Math.round((e.progress / 100) * estimatedHoursPerCourse), 
    0
  );

  // Obtener actividad reciente (últimas lecciones completadas, etc.)
  // En un entorno real, esto vendría de un registro de actividad
  const recentActivity = [];
  
  // Tomar los 3 cursos más recientes con progreso
  const recentEnrollments = [...enrollments]
    .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))
    .slice(0, 3);

  for (const enrollment of recentEnrollments) {
    if (enrollment.progress > 0) {
      recentActivity.push({
        type: 'lesson',
        title: `Lección completada en ${(enrollment.course as any)?.title || 'curso'}`,
        course: (enrollment.course as any)?.title || 'Curso desconocido',
        date: enrollment.updatedAt || new Date()
      });
    }
  }

  res.status(200).json({
    status: 'success',
    data: {
      enrolledCourses,
      completedCourses,
      coursesInProgress,
      totalHoursWatched,
      completionRate: Math.round(completionRate * 10) / 10, // Redondear a 1 decimal
      recentActivity: recentActivity.slice(0, 5) // Limitar a 5 actividades
    }
  });
});

/**
 * @swagger
 * /api/v1/enrollments/{id}:
 *   get:
 *     summary: Get a specific enrollment (Admin only)
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the enrollment to get
 *     responses:
 *       200:
 *         description: Enrollment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Enrollment'
 *       403:
 *         description: Forbidden - Not authorized to view this enrollment
 *       404:
 *         description: Enrollment not found
 */
/**
 * @swagger
 * /api/v1/enrollments/{enrollmentId}:
 *   get:
 *     summary: Obtener detalles de una inscripción
 *     description: Obtiene los detalles de una inscripción específica por su ID
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la inscripción a consultar
 *     responses:
 *       200:
 *         description: Detalles de la inscripción obtenidos exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/EnrollmentResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: No tienes permiso para ver esta inscripción
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Inscripción no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const getEnrollment = catchAuthAsync(async (req, res, next) => {
  const enrollment = await Enrollment.findById(req.params.id)
    .populate('user', 'name email')
    .populate('course', 'title');

  if (!enrollment) {
    return next(new AppError('No se encontró la inscripción con ese ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      enrollment
    }
  });
});

// Admin only
/**
 * @swagger
 * /api/v1/enrollments/{enrollmentId}:
 *   patch:
 *     summary: Actualizar una inscripción
 *     description: Actualiza el estado o progreso de una inscripción
 *     tags: [Enrollments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: enrollmentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la inscripción a actualizar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EnrollmentUpdate'
 *     responses:
 *       200:
 *         description: Inscripción actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/EnrollmentResponse'
 *       400:
 *         description: Datos de actualización inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: No tienes permiso para actualizar esta inscripción
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Inscripción no encontrada
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const updateEnrollment = catchAuthAsync(async (req, res, next) => {
  const enrollment = await Enrollment.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );

  if (!enrollment) {
    return next(new AppError('No se encontró la inscripción con ese ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      enrollment
    }
  });
});

// Admin only
export const deleteEnrollment = catchAuthAsync(async (req, res, next) => {
  const enrollment = await Enrollment.findByIdAndDelete(req.params.id);

  if (!enrollment) {
    return next(new AppError('No se encontró la inscripción con ese ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
