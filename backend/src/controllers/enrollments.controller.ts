import { Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Enrollment } from '../models/enrollment.model';
import Course from '../models/course.model';
import AppError from '../utils/appError';
import { catchAsync } from '../utils/catchAsync';

/**
 * @swagger
 * tags:
 *   name: Enrollments
 *   description: Gestión de inscripciones a cursos
 */

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user: {
    _id: Types.ObjectId;
    role: string;
  };
}

/**
 * @swagger
 * /api/v1/enrollments:
 *   post:
 *     summary: Inscribirse a un curso
 *     tags: [Enrollments]
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
 *             properties:
 *               courseId:
 *                 type: string
 *                 description: ID del curso al que se desea inscribir
 *     responses:
 *       201:
 *         description: Inscripción exitosa
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
export const createEnrollment = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

export const getMyEnrollments = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  const [enrollments, total] = await Promise.all([
    Enrollment.find({ user: req.user._id })
      .populate('course', 'title description image instructor')
      .sort('-enrolledAt')
      .skip(skip)
      .limit(limit),
    Enrollment.countDocuments({ user: req.user._id })
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

export const checkEnrollment = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

export const getEnrollmentsByCourse = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const { courseId } = req.params;
  const userId = req.user._id;
  
  // Check if user is the course instructor or admin
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
      .populate('user', 'name email avatar')
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

// Admin only
export const getEnrollment = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
export const updateEnrollment = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
export const deleteEnrollment = catchAsync(async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const enrollment = await Enrollment.findByIdAndDelete(req.params.id);

  if (!enrollment) {
    return next(new AppError('No se encontró la inscripción con ese ID', 404));
  }

  res.status(204).json({
    status: 'success',
    data: null
  });
});
