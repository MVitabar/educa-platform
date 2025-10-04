import express, { Router } from 'express';
import * as lessonController from '../controllers/lessons.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Rutas públicas
router.get('/:id', lessonController.getLesson);
router.get('/course/:courseId', lessonController.getLessonsByCourse);
router.get('/section/:sectionId', lessonController.getLessonsBySection);

// Rutas protegidas (requieren autenticación)
router.use(protect);

// Rutas solo para instructores y admin
router.post(
  '/',
  restrictTo('instructor', 'admin'),
  lessonController.createLesson
);

// Rutas para instructores (del curso) o admin
router
  .route('/:id')
  .put(
    restrictTo('instructor', 'admin'),
    lessonController.updateLesson
  )
  .delete(
    restrictTo('instructor', 'admin'),
    lessonController.deleteLesson
  );

export default router;
