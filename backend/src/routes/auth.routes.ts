// backend/src/routes/auth.routes.ts

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

// =====================================
// RUTAS PÚBLICAS (sin autenticación)
// =====================================

// Registro de nuevo usuario
router.post('/register', validateRegister, authController.register);

// Inicio de sesión
router.post('/login', validateLogin, authController.login);

// Olvidé mi contraseña
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);

// Restablecer contraseña
router.patch('/reset-password/:token', validateResetPassword, authController.resetPassword);

// =====================================
// RUTAS PROTEGIDAS (requieren autenticación)
// =====================================
router.use(protect); // Aplica el middleware de autenticación a todas las rutas siguientes

// Obtener perfil del usuario actual
router.get('/me', authController.getMe);

// Actualizar perfil
router.patch('/me', authController.updateProfile);

// Actualizar contraseña
router.patch('/me/password', [
  body('currentPassword').notEmpty().withMessage('La contraseña actual es requerida'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('La nueva contraseña debe tener al menos 6 caracteres')
], authController.updatePassword);

// Cerrar sesión
router.post('/logout', authController.logout);

export default router;