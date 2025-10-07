import { Router } from 'express';
import * as sectionController from '../controllers/sections.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

// Create a new router with mergeParams: true to maintain parent route params
const router = Router({ mergeParams: true });

// Apply authentication to all routes except GET / (getSectionsByCourse)
router.get('/', sectionController.getSectionsByCourse);

// Apply authentication to all other routes
router.use(protect);

/**
 * @route GET /api/v1/courses/:courseId/sections
 * @desc Get all sections for a course
 * @access Public
 */
// Moved above the protect middleware to make it public

// Rutas solo para instructores
router.use(restrictTo('instructor'));

/**
 * @route POST /api/v1/courses/:courseId/sections
 * @desc Crear una nueva sección en un curso
 * @access Privado (instructor)
 */
router.post('/', sectionController.createSection);

/**
 * @route PATCH /api/v1/courses/:courseId/sections/reorder
 * @desc Reordenar las secciones de un curso
 * @access Privado (instructor)
 */
router.patch('/reorder', sectionController.reorderSections);

/**
 * @route GET /api/v1/courses/:courseId/sections/:id
 * @desc Obtener una sección específica
 * @access Público (sin autenticación)
 */
router.get('/:id', sectionController.getSection);

/**
 * @route PUT /api/v1/courses/:courseId/sections/:id
 * @desc Actualizar una sección
 * @access Privado (instructor)
 */
router.put('/:id', sectionController.updateSection);

/**
 * @route DELETE /api/v1/courses/:courseId/sections/:id
 * @desc Eliminar una sección
 * @access Privado (instructor, admin)
 */
router.delete('/:id', restrictTo('instructor', 'admin'), sectionController.deleteSection);

export default router;
