import express, { Router } from 'express';
import * as courseController from '../controllers/courses.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Rutas públicas
router.get('/', courseController.getCourses);
router.get('/:id', courseController.getCourse);

// Rutas protegidas (requieren autenticación)
router.use(protect);

// Rutas solo para instructores
router.post(
  '/',
  restrictTo('instructor', 'admin'),
  courseController.createCourse
);

// Rutas para instructores (dueños del curso) o admin
router
  .route('/:id')
  .put(
    restrictTo('instructor', 'admin'),
    courseController.updateCourse
  )
  .delete(
    restrictTo('instructor', 'admin'),
    courseController.deleteCourse
  );

export default router;
