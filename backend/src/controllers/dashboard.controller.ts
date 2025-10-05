import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { IUser } from '../types/user.types';
import { 
  StudentDashboardStats, 
  EnrolledCourse, 
  RecentLesson, 
  InstructorDashboardStats, 
  InstructorCourse, 
  InstructorReview, 
  StudentProgress 
} from '../types/dashboard.types';
import { Enrollment } from '../models/enrollment.model';
import { IProgress } from '../types/progress.types';
import { Progress } from '../models/progress.model';

/**
 * @swagger
 * components:
 *   schemas:
 *     StudentDashboardStats:
 *       type: object
 *       properties:
 *         enrolledCourses:
 *           type: number
 *           description: Total number of enrolled courses
 *         completedCourses:
 *           type: number
 *           description: Number of completed courses
 *         coursesInProgress:
 *           type: number
 *           description: Number of courses in progress
 *         totalHoursWatched:
 *           type: number
 *           format: float
 *           description: Total hours of video watched
 *         completionRate:
 *           type: number
 *           description: Overall course completion percentage
 *         recentActivity:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [lesson, quiz, assignment]
 *               title:
 *                 type: string
 *               course:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *
 *     EnrolledCourse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         image:
 *           type: string
 *         instructor:
 *           type: string
 *         progress:
 *           type: number
 *         completed:
 *           type: boolean
 *         enrolledAt:
 *           type: string
 *           format: date-time
 *         lastAccessed:
 *           type: string
 *           format: date-time
 *
 *     InstructorDashboardStats:
 *       type: object
 *       properties:
 *         totalStudents:
 *           type: number
 *         activeStudents:
 *           type: number
 *         totalCourses:
 *           type: number
 *         publishedCourses:
 *           type: number
 *         draftCourses:
 *           type: number
 *         totalEarnings:
 *           type: number
 *         monthlyEarnings:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               month:
 *                 type: string
 *               amount:
 *                 type: number
 *         topCourses:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *               title:
 *                 type: string
 *               enrollments:
 *                 type: number
 *               revenue:
 *                 type: number
 *               rating:
 *                 type: number
 *
 * @swagger
 * tags:
 *   - name: Dashboard
 *     description: Student and instructor dashboard endpoints
 */

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: IUser & { _id: Types.ObjectId };
    }
  }
}

// Response type
interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  results?: number;
}

// Mock data for development
const mockStudentStats: StudentDashboardStats = {
  enrolledCourses: 5,
  completedCourses: 2,
  coursesInProgress: 3,  // Changed from inProgressCourses to match type
  totalHoursWatched: 12.5,
  completionRate: 40,
  recentActivity: [
    { 
      type: 'lesson' as const, 
      title: 'Introducción a React', 
      course: 'Curso de React', 
      date: new Date().toISOString() 
    }
  ]
};

const mockInstructorStats: InstructorDashboardStats = {
  totalStudents: 125,
  activeStudents: 89,
  totalCourses: 8,
  publishedCourses: 6,
  draftCourses: 2,
  totalEarnings: 12500,
  monthlyEarnings: [
    { month: '2023-01', amount: 1200 },
    { month: '2023-02', amount: 1800 },
    { month: '2023-03', amount: 1500 }
  ],
  topCourses: [
    { 
      id: '1', 
      title: 'Curso Avanzado de React', 
      enrollments: 45, 
      revenue: 4500, 
      rating: 4.8 
    }
  ]
};

// Helper functions
const getQueryParam = <T>(value: any, defaultValue: T, type: 'string' | 'number' = 'string'): T => {
  if (value === undefined || value === '') return defaultValue;
  if (type === 'number') {
    const num = Number(value);
    return (isNaN(num) ? defaultValue : num) as T;
  }
  return String(value) as unknown as T;
};

// Database helper functions

/**
 * Obtiene los cursos recientes de un instructor
 */
async function getInstructorRecentCoursesFromDB(
  userId: Types.ObjectId, 
  limit: number = 3
): Promise<InstructorCourse[]> {
  try {
    // En un entorno real, esto consultaría la base de datos
    // Por ahora, devolvemos datos de ejemplo
    return [
      {
        id: '1',
        title: 'Curso de React Avanzado',
        description: 'Aprende React avanzado con proyectos reales',
        image: 'https://via.placeholder.com/300x200',
        status: 'published' as const,
        price: 49.99,
        enrollments: 124,
        revenue: 6198.76,
        rating: 4.8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        title: 'Node.js para Principiantes',
        description: 'Aprende Node.js desde cero',
        image: 'https://via.placeholder.com/300x200',
        status: 'published' as const,
        price: 29.99,
        enrollments: 87,
        revenue: 2609.13,
        rating: 4.6,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString()
      }
    ].slice(0, limit);
  } catch (error) {
    console.error('Error fetching instructor recent courses:', error);
    throw error;
  }
}

/**
 * Obtiene las próximas sesiones programadas por el instructor
 */
async function getUpcomingSessionsFromDB(
  userId: Types.ObjectId,
  limit: number = 5
): Promise<Array<{
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  startTime: string;
  duration: number;
  type: 'live' | 'workshop' | 'qa';
  meetingLink?: string;
}>> {
  try {
    // En un entorno real, esto consultaría la base de datos
    // Por ahora, devolvemos datos de ejemplo
    return [
      {
        id: 'sess1',
        title: 'Sesión de Q&A',
        courseId: '1',
        courseTitle: 'Curso de React Avanzado',
        startTime: new Date(Date.now() + 86400000).toISOString(), // Mañana
        duration: 60,
        type: 'qa' as const,
        meetingLink: 'https://meet.example.com/abc123'
      },
      {
        id: 'sess2',
        title: 'Taller Práctico',
        courseId: '2',
        courseTitle: 'Node.js para Principiantes',
        startTime: new Date(Date.now() + 2 * 86400000).toISOString(), // Pasado mañana
        duration: 90,
        type: 'workshop' as const,
        meetingLink: 'https://meet.example.com/def456'
      }
    ].slice(0, limit);
  } catch (error) {
    console.error('Error fetching upcoming sessions:', error);
    throw error;
  }
}

/**
 * Obtiene análisis detallados de un curso específico
 */
async function getCourseAnalyticsFromDB(
  instructorId: Types.ObjectId,
  courseId: string
): Promise<{
  courseId: string;
  courseTitle: string;
  totalStudents: number;
  activeStudents: number;
  completionRate: number;
  averageProgress: number;
  totalRevenue: number;
  averageRating: number;
  ratingCount: number;
  enrollmentTrend: Array<{ date: string; count: number }>;
  completionRates: {
    completed: number;
    inProgress: number;
    notStarted: number;
  };
  studentActivity: Array<{ date: string; activeStudents: number; completedLessons: number }>;
  revenueData: Array<{ month: string; amount: number; currency: string }>;
  lastUpdated: string;
}> {
  try {
    // En un entorno real, esto consultaría la base de datos
    // Por ahora, devolvemos datos de ejemplo
    return {
      courseId,
      courseTitle: 'Curso de React Avanzado',
      totalStudents: 124,
      activeStudents: 87,
      completionRate: 45,
      averageProgress: 67,
      totalRevenue: 6198.76,
      averageRating: 4.8,
      ratingCount: 42,
      enrollmentTrend: Array.from({ length: 6 }, (_, i) => ({
        date: new Date(Date.now() - (5 - i) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        count: Math.floor(Math.random() * 20) + 5
      })),
      completionRates: {
        completed: 45,
        inProgress: 35,
        notStarted: 20
      },
      studentActivity: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        activeStudents: Math.floor(Math.random() * 30) + 10,
        completedLessons: Math.floor(Math.random() * 50) + 20
      })),
      revenueData: Array.from({ length: 6 }, (_, i) => ({
        month: new Date(Date.now() - (5 - i) * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7),
        amount: Math.floor(Math.random() * 2000) + 500,
        currency: 'USD'
      })),
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching course analytics:', error);
    throw error;
  }
}

// Database helper functions
const getStudentStatsFromDB = async (userId: Types.ObjectId): Promise<StudentDashboardStats> => {
  try {
    // Get all enrollments for the student
    const enrollments = await Enrollment.find({ student: userId })
      .populate({
        path: 'course',
        select: 'title description image instructor duration',
        populate: {
          path: 'instructor',
          select: 'name email'
        }
      });

    // Calculate statistics
    const totalEnrollments = enrollments.length;
    const completedEnrollments = enrollments.filter((e: { status: string }) => e.status === 'completed').length;
    const inProgressEnrollments = enrollments.filter((e: { status: string }) => e.status === 'in-progress').length;
    
    // Calculate total hours watched (assuming each course has a duration in hours)
    const totalHoursWatched = enrollments.reduce((total, enrollment) => {
      // @ts-ignore - course is populated
      const courseDuration = enrollment.course?.duration || 0;
      // @ts-ignore - progress is a number between 0 and 1
      const progress = enrollment.progress || 0;
      return total + (courseDuration * progress);
    }, 0);

    // Calculate completion rate (percentage of completed enrollments)
    const completionRate = totalEnrollments > 0 
      ? Math.round((completedEnrollments / totalEnrollments) * 100) 
      : 0;

    // Get recent activity (last 5 completed lessons or progress updates)
    const recentProgress = await Progress.aggregate([
      { $match: { user: userId } },
      { $unwind: '$completedLessons' },
      { $sort: { 'completedLessons.completedAt': -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'lessons',
          localField: 'completedLessons.lesson',
          foreignField: '_id',
          as: 'lesson'
        }
      },
      { $unwind: '$lesson' },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $project: {
          _id: 0,
          type: { $literal: 'lesson' },
          title: '$lesson.title',
          course: '$course.title',
          date: '$completedLessons.completedAt'
        }
      }
    ]);

    return {
      enrolledCourses: totalEnrollments,
      completedCourses: completedEnrollments,
      coursesInProgress: inProgressEnrollments,
      totalHoursWatched: Math.round(totalHoursWatched * 10) / 10, // Round to 1 decimal place
      completionRate,
      recentActivity: recentProgress
    };
  } catch (error) {
    console.error('Error getting student stats from DB:', error);
    throw error;
  }
};

const getStudentCoursesFromDB = async (
  userId: Types.ObjectId, 
  options: { status: string; limit: number; sort: string }
): Promise<EnrolledCourse[]> => {
  try {
    // Build query based on status
    const query: any = { student: userId };
    
    if (options.status === 'completed') {
      query.status = 'completed';
    } else if (options.status === 'in-progress') {
      query.status = 'in-progress';
    } else if (options.status === 'not-started') {
      query.status = 'not-started';
    }
    
    // Build sort
    const sort: any = {};
    switch (options.sort) {
      case 'recent':
        sort.createdAt = -1;
        break;
      case 'title':
        sort['course.title'] = 1;
        break;
      case 'progress':
        sort.progress = -1;
        break;
      default:
        sort.createdAt = -1;
    }
    
    // Execute query
    const enrollments = await Enrollment.find(query)
      .populate({
        path: 'course',
        select: 'title description image instructor totalLessons totalDuration',
        populate: {
          path: 'instructor',
          select: 'name email'
        }
      })
      .sort(sort)
      .limit(options.limit || 10);
    
    // Map to EnrolledCourse format
    return enrollments.map((enrollment: any) => ({
      id: enrollment._id.toString(),
      // @ts-ignore - course is populated
      title: enrollment.course?.title || 'Curso sin título',
      // @ts-ignore - course is populated
      description: enrollment.course?.description || '',
      // @ts-ignore - course is populated
      image: enrollment.course?.image || '',
      // @ts-ignore - course is populated
      instructor: enrollment.course?.instructor?.name || 'Instructor',
      progress: enrollment.progress || 0,
      completed: enrollment.status === 'completed',
      enrolledAt: enrollment.enrolledAt.toISOString(),
      lastAccessed: enrollment.updatedAt.toISOString(),
      completedAt: enrollment.completedAt?.toISOString()
    }));
  } catch (error) {
    console.error('Error getting student courses from DB:', error);
    throw error;
  }
};

const getStudentRecentLessonsFromDB = async (
  userId: Types.ObjectId, 
  limit: number = 5
): Promise<RecentLesson[]> => {
  try {
    // Get recent progress records for the user
    const recentProgress = await Progress.aggregate([
      { $match: { user: userId } },
      { $unwind: '$completedLessons' },
      { $sort: { 'completedLessons.completedAt': -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'lessons',
          localField: 'completedLessons.lesson',
          foreignField: '_id',
          as: 'lesson'
        }
      },
      { $unwind: '$lesson' },
      {
        $lookup: {
          from: 'courses',
          localField: 'course',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $project: {
          _id: 0,
          id: '$lesson._id',
          title: '$lesson.title',
          course: '$course.title',
          courseId: { $toString: '$course._id' },
          duration: { $ifNull: ['$lesson.duration', 0] },
          progress: 100, // Since these are completed lessons
          lastAccessed: '$completedLessons.completedAt',
          thumbnail: { $ifNull: ['$lesson.thumbnail', ''] },
          completed: true
        }
      }
    ]);

    // If no completed lessons, get recently accessed lessons
    if (recentProgress.length === 0) {
      const recentAccess = await Progress.aggregate([
        { $match: { user: userId } },
        { $unwind: '$lessonProgress' },
        { $sort: { 'lessonProgress.lastAccessed': -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'lessons',
            localField: 'lessonProgress.lesson',
            foreignField: '_id',
            as: 'lesson'
          }
        },
        { $unwind: '$lesson' },
        {
          $lookup: {
            from: 'courses',
            localField: 'course',
            foreignField: '_id',
            as: 'course'
          }
        },
        { $unwind: '$course' },
        {
          $project: {
            _id: 0,
            id: '$lesson._id',
            title: '$lesson.title',
            course: '$course.title',
            courseId: { $toString: '$course._id' },
            duration: { $ifNull: ['$lesson.duration', 0] },
            progress: { $multiply: [{ $ifNull: ['$lessonProgress.progress', 0] }, 100] },
            lastAccessed: '$lessonProgress.lastAccessed',
            thumbnail: { $ifNull: ['$lesson.thumbnail', ''] },
            completed: { $gte: ['$lessonProgress.progress', 0.95] } // Consider 95% as completed
          }
        }
      ]);
      
      return recentAccess;
    }

    return recentProgress;
  } catch (error) {
    console.error('Error getting recent lessons from DB:', error);
    return [];
  }
};

const getInstructorStatsFromDB = async (userId: Types.ObjectId): Promise<InstructorDashboardStats> => {
  // Implementation would go here
  return mockInstructorStats;
};

const getInstructorCoursesFromDB = async (
  userId: Types.ObjectId, 
  options: { status: string; sort: string; limit: number }
): Promise<InstructorCourse[]> => {
  // Implementation would go here
  return [];
};

const getInstructorReviewsFromDB = async (
  userId: Types.ObjectId, 
  limit: number
): Promise<InstructorReview[]> => {
  // Implementation would go here
  return [];
};

const getCourseStudentsProgressFromDB = async (
  instructorId: Types.ObjectId, 
  courseId: string, 
  options: { status: string; sort: string }
): Promise<StudentProgress[]> => {
  // Implementation would go here
  return [];
};

// Student Controllers
/**
 * @swagger
 * /api/v1/dashboard/student:
 *   get:
 *     summary: Get student dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StudentDashboardStats'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getStudentDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'No autorizado' });
    }
    
    const stats = await getStudentStatsFromDB(req.user._id);
    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dashboard/student/courses/active:
 *   get:
 *     summary: Get active courses for student
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, in-progress, completed]
 *           default: in-progress
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 10
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, title, progress]
 *           default: recent
 *     responses:
 *       200:
 *         description: List of active courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: number
 *                   example: 1
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EnrolledCourse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getActiveCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'No autorizado' });
    }

    const status = getQueryParam(req.query.status, 'in-progress');
    const limit = getQueryParam(Number(req.query.limit), 10, 'number');
    const sort = getQueryParam(req.query.sort, 'recent');

    const courses = await getStudentCoursesFromDB(req.user._id, { status, limit, sort });
    
    res.status(200).json({
      status: 'success',
      results: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dashboard/student/courses/completed:
 *   get:
 *     summary: Get completed courses for student
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of completed courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/EnrolledCourse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getCompletedCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'No autorizado' });
    }

    const courses = await getStudentCoursesFromDB(req.user._id, { 
      status: 'completed',
      limit: 10,
      sort: 'recent' 
    });
    
    res.status(200).json({
      status: 'success',
      results: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dashboard/student/upcoming-deadlines:
 *   get:
 *     summary: Get upcoming deadlines for student
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of upcoming deadlines
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       course:
 *                         type: string
 *                       dueDate:
 *                         type: string
 *                         format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getUpcomingDeadlines = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'No autorizado' });
    }

    const limit = getQueryParam(Number(req.query.limit), 5, 'number');
    const recentLessons = await getStudentRecentLessonsFromDB(req.user._id, limit);
    
    // Transform to the expected format
    const deadlines = recentLessons.map(lesson => ({
      id: lesson.id,
      title: lesson.title,
      course: lesson.course,
      dueDate: lesson.lastAccessed, // Using lastAccessed as due date for now
      type: 'lesson',
      progress: lesson.progress,
      completed: lesson.completed
    }));

    res.status(200).json({
      status: 'success',
      results: deadlines.length,
      data: { deadlines }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dashboard/instructor/stats:
 *   get:
 *     summary: Get instructor dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Instructor dashboard statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InstructorDashboardStats'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getInstructorStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'No autorizado' });
    }
    
    const stats = await getInstructorStatsFromDB(req.user._id);
    res.status(200).json({
      status: 'success',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dashboard/instructor/students:
 *   get:
 *     summary: Get instructor's students
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of students enrolled in instructor's courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StudentProgress'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getInstructorStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'No autorizado' });
    }
    
    // Mock data for instructor's students
    const students = [
      {
        id: '1',
        name: 'Estudiante Ejemplo',
        email: 'estudiante@example.com',
        coursesEnrolled: 3,
        lastActive: new Date().toISOString()
      }
    ];
    
    res.status(200).json({
      status: 'success',
      results: students.length,
      data: { students }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dashboard/instructor/revenue:
 *   get:
 *     summary: Get instructor revenue data
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Instructor revenue statistics
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
 *                     totalEarnings:
 *                       type: number
 *                     monthlyEarnings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                           amount:
 *                             type: number
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getInstructorRevenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'No autorizado' });
    }
    
    // Mock data for instructor revenue
    const revenue = {
      totalEarnings: 1250.50,
      monthlyEarnings: [
        { month: '2023-01', amount: 1200 },
        { month: '2023-02', amount: 1500 },
        { month: '2023-03', amount: 1800 },
      ],
      topPerformingCourses: [
        { id: '1', title: 'Curso de React', earnings: 800 },
        { id: '2', title: 'TypeScript Avanzado', earnings: 600 },
      ]
    };
    
    res.status(200).json({
      status: 'success',
      data: revenue
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dashboard/instructor/courses:
 *   get:
 *     summary: Get instructor's courses
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, published, draft, archived]
 *           default: all
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [recent, title, students, revenue]
 *           default: recent
 *     responses:
 *       200:
 *         description: List of instructor's courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InstructorCourse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getInstructorCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'No autorizado' });
    }
    
    const status = getQueryParam(req.query.status, 'all');
    const sort = getQueryParam(req.query.sort, 'recent');
    const limit = getQueryParam(Number(req.query.limit), 10, 'number');
    
    const courses = await getInstructorCoursesFromDB(req.user._id, { status, sort, limit });
    
    res.status(200).json({
      status: 'success',
      results: courses.length,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dashboard/instructor/courses/{courseId}/students:
 *   get:
 *     summary: Get students' progress for a specific course
 *     tags: [Dashboard]
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
 *           enum: [all, active, completed, inactive]
 *           default: all
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, progress, lastActive, enrolledAt]
 *           default: name
 *     responses:
 *       200:
 *         description: List of students with their progress in the course
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/StudentProgress'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Course not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
export const getCourseStudentsProgress = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'No autorizado' });
    }
    
    const { courseId } = req.params;
    const status = getQueryParam(req.query.status, 'all');
    const sort = getQueryParam(req.query.sort, 'name');
    
    const students = await getCourseStudentsProgressFromDB(
      req.user._id, 
      courseId, 
      { status, sort }
    );
    
    res.status(200).json({
      status: 'success',
      results: students.length,
      data: students
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dashboard/instructors/me/courses/recent:
 *   get:
 *     summary: Obtiene los cursos recientes del instructor
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 3
 *     responses:
 *       200:
 *         description: Lista de cursos recientes del instructor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/InstructorCourse'
 */
export async function getInstructorRecentCourses(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'No autorizado'
      });
    }

    const limit = getQueryParam<number>(req.query.limit, 3, 'number');
    const courses = await getInstructorRecentCoursesFromDB(userId, limit);

    res.status(200).json({
      status: 'success',
      data: courses
    });
  } catch (error) {
    console.error('Error al obtener cursos recientes del instructor:', error);
    next(error);
  }
}

/**
 * @swagger
 * /api/v1/dashboard/instructors/me/sessions/upcoming:
 *   get:
 *     summary: Obtiene las próximas sesiones programadas por el instructor
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *           default: 5
 *     responses:
 *       200:
 *         description: Lista de próximas sesiones
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       courseId:
 *                         type: string
 *                       courseTitle:
 *                         type: string
 *                       startTime:
 *                         type: string
 *                         format: date-time
 *                       duration:
 *                         type: number
 *                       type:
 *                         type: string
 *                         enum: [live, workshop, qa]
 *                       meetingLink:
 *                         type: string
 *                         format: uri
 */
export async function getUpcomingSessions(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'No autorizado'
      });
    }

    const limit = getQueryParam<number>(req.query.limit, 5, 'number');
    const sessions = await getUpcomingSessionsFromDB(userId, limit);

    res.status(200).json({
      status: 'success',
      data: sessions
    });
  } catch (error) {
    console.error('Error al obtener próximas sesiones:', error);
    next(error);
  }
}

/**
 * @swagger
 * /api/v1/dashboard/instructors/me/analytics:
 *   get:
 *     summary: Obtiene análisis detallados de un curso específico
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *     responses:
 *       200:
 *         description: Análisis detallados del curso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/CourseAnalytics'
 */
export async function getCourseAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = req.user?._id;
    const { courseId } = req.query;

    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'No autorizado'
      });
    }

    if (!courseId || typeof courseId !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'Se requiere el ID del curso'
      });
    }

    const analytics = await getCourseAnalyticsFromDB(userId, courseId);

    res.status(200).json({
      status: 'success',
      data: analytics
    });
  } catch (error) {
    console.error('Error al obtener análisis del curso:', error);
    next(error);
  }
}

// Default export with all controllers
export default {
  // Student
  getStudentDashboard,
  getActiveCourses,
  getCompletedCourses,
  getUpcomingDeadlines,
  
  // Instructor
  getInstructorStats,
  getInstructorStudents,
  getInstructorRevenue,
  getInstructorCourses,
  getCourseStudentsProgress,
  getInstructorRecentCourses,
  getUpcomingSessions,
  getCourseAnalytics,
  
  // Aliases for backward compatibility
  getStudentDashboardStats: getStudentDashboard,
  getStudentCourses: getActiveCourses,
  getInstructorDashboard: getInstructorStats,
  getInstructorDashboardStats: getInstructorStats,
  getInstructorReviews: getInstructorReviewsFromDB,
  
  // Helper functions (exposed for testing)
  _getStudentStatsFromDB: getStudentStatsFromDB,
  _getStudentCoursesFromDB: getStudentCoursesFromDB,
  _getStudentRecentLessonsFromDB: getStudentRecentLessonsFromDB,
  _getInstructorStatsFromDB: getInstructorStatsFromDB,
  _getInstructorCoursesFromDB: getInstructorCoursesFromDB,
  _getInstructorRecentCoursesFromDB: getInstructorRecentCoursesFromDB,
  _getUpcomingSessionsFromDB: getUpcomingSessionsFromDB,
  _getCourseAnalyticsFromDB: getCourseAnalyticsFromDB,
  _getCourseStudentsProgressFromDB: getCourseStudentsProgressFromDB
};