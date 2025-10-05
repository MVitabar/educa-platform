import { Router } from 'express';
import * as dashboardController from '../controllers/dashboard.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication middleware to all dashboard routes
router.use(protect);

// ====================================
// STUDENT DASHBOARD ROUTES
// ====================================
router.get('/student', restrictTo('student'), dashboardController.getStudentDashboard);
router.get('/student/courses/active', restrictTo('student'), dashboardController.getActiveCourses);
router.get('/student/courses/completed', restrictTo('student'), dashboardController.getCompletedCourses);
router.get('/student/upcoming-deadlines', restrictTo('student'), dashboardController.getUpcomingDeadlines);

// ====================================
// INSTRUCTOR DASHBOARD ROUTES
// ====================================
// Estadísticas generales
router.get('/instructor/stats', restrictTo('instructor'), dashboardController.getInstructorStats);

// Cursos
router.get('/instructor/courses', restrictTo('instructor'), dashboardController.getInstructorCourses);
router.get('/instructor/courses/recent', restrictTo('instructor'), dashboardController.getInstructorRecentCourses);

// Estudiantes
router.get('/instructor/students', restrictTo('instructor'), dashboardController.getInstructorStudents);

// Ingresos
router.get('/instructor/revenue', restrictTo('instructor'), dashboardController.getInstructorRevenue);

// Sesiones
router.get('/instructor/sessions/upcoming', restrictTo('instructor'), dashboardController.getUpcomingSessions);

// Análisis
router.get('/instructor/analytics', restrictTo('instructor'), dashboardController.getCourseAnalytics);

// Rutas específicas de cursos
router.get('/instructor/courses/:courseId/students', restrictTo('instructor'), dashboardController.getCourseStudentsProgress);

export default router;
