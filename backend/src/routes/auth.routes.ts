import express, { Router } from 'express';
import { body } from 'express-validator';
import * as authController from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Validaciones
const validateRegister = [
  body('name').trim().notEmpty().withMessage('El nombre es requerido'),
  body('email').isEmail().withMessage('Por favor ingresa un correo electrónico válido'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

const validateLogin = [
  body('email').isEmail().withMessage('Por favor ingresa un correo electrónico válido'),
  body('password').exists().withMessage('La contraseña es requerida')
];

const validateForgotPassword = [
  body('email').isEmail().withMessage('Por favor ingresa un correo electrónico válido')
];

const validateResetPassword = [
  body('password')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres')
];

// Rutas públicas
router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);
router.patch('/reset-password/:token', validateResetPassword, authController.resetPassword);

// Middleware de autenticación para las rutas siguientes
const protectedRouter = express.Router();
protectedRouter.use(protect);

// Rutas protegidas (requieren autenticación)
protectedRouter.get('/me', authController.getMe);
protectedRouter.patch('/update-password', [
  body('currentPassword').notEmpty().withMessage('La contraseña actual es requerida'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
], authController.updatePassword);
protectedRouter.post('/logout', authController.logout);

// Mount protected routes under the main router
router.use('', protectedRouter);

export default router;
