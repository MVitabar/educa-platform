import express, { Router } from 'express';
import * as userController from '../controllers/users.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';

const router = Router();

// ====================================
// RUTAS PÚBLICAS
// ====================================
// (Estas rutas están en auth.routes.ts)

// ====================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ====================================
// Aplicar el middleware de autenticación a todas las rutas siguientes
router.use(protect);

// Obtener perfil del usuario actual
router.get('/me', userController.getProfile);

// Actualizar perfil del usuario actual
router.patch('/update-me', userController.updateProfile);

// Actualizar contraseña del usuario actual
router.patch('/update-password', userController.updatePassword);

// Eliminar cuenta del usuario actual
router.delete('/delete-me', userController.deleteAccount);

// Obtener cursos en los que está inscrito el usuario actual
router.get('/my-enrollments', userController.getUserEnrollments);

// Obtener cursos creados por el usuario actual (solo instructores)
router.get('/my-courses', restrictTo('instructor'), userController.getUserCourses);

// ====================================
// RUTAS DE ADMINISTRADOR (requieren rol de admin)
// ====================================
const adminRouter = express.Router();
adminRouter.use(restrictTo('admin'));

// Obtener todos los usuarios (solo admin)
adminRouter.get('/', userController.getAllUsers);

// Obtener, actualizar o eliminar un usuario por ID (solo admin)
adminRouter
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

// Mount admin routes under /users
router.use('', adminRouter);

export default router;
