import express, { Router } from 'express';
import * as sectionController from '../controllers/sections.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// Rutas públicas
router.get('/:id', sectionController.getSection);
router.get('/course/:courseId', sectionController.getSectionsByCourse);

// Rutas protegidas (requieren autenticación)
router.use(protect);

// Rutas solo para instructores y admin
router.post(
  '/',
  restrictTo('instructor', 'admin'),
  sectionController.createSection
);

// Ruta para reordenar secciones
router.post(
  '/reorder',
  restrictTo('instructor', 'admin'),
  sectionController.reorderSections
);

// Rutas para instructores (del curso) o admin
router
  .route('/:id')
  .put(
    restrictTo('instructor', 'admin'),
    sectionController.updateSection
  )
  .delete(
    restrictTo('instructor', 'admin'),
    sectionController.deleteSection
  );

export default router;
