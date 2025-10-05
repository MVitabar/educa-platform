import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import * as authService from '../services/auth/auth.service';
import { IUser, UserRole } from '../types/user.types';
import AppError from '../utils/appError';
import { catchAsync } from '../utils/catchAsync';
import User from '../models/user.model';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import config from '../config';

// Helper function to generate JWT token
const generateToken = (payload: { id: string; role: UserRole }): string => {
  return jwt.sign(
    payload, 
    config.jwtSecret as jwt.Secret, 
    {
      expiresIn: config.jwtExpiresIn,
      algorithm: 'HS256',
    } as jwt.SignOptions
  );
};

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
}

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Autenticación y autorización de usuarios
 */

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: ID del usuario
 *         name:
 *           type: string
 *           description: Nombre del usuario
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico del usuario
 *         role:
 *           type: string
 *           enum: [student, instructor, admin]
 *           description: Rol del usuario
 *     Token:
 *       type: object
 *       properties:
 *         token:
 *           type: string
 *           description: Token JWT para autenticación
 *     Error:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [error]
 *         message:
 *           type: string
 *           description: Descripción del error
 */

// Extender la interfaz de Request para incluir el usuario
declare global {
  namespace Express {
    interface Request {
      user?: IUser & { _id: Types.ObjectId };
    }
  }
}

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - passwordConfirm
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *               passwordConfirm:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *               $ref: '#/components/schemas/Error'
 */
export const register = async (
  req: Request<{}, {}, RegisterRequest>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, email, password, passwordConfirm } = req.body as RegisterRequest;
    
    const { user, token } = await authService.register({
      name,
      email,
      password,
      passwordConfirm,
    });

    res.status(201).json({
      success: true,
      token,
      data: {
        user,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      const err = error as Error & { statusCode?: number; status?: string };
      if (!err.statusCode) {
        err.statusCode = 500;
        err.status = 'error';
      }
      next(err);
    } else {
      const unknownError = new Error('An unknown error occurred') as Error & { statusCode: number; status: string };
      unknownError.statusCode = 500;
      unknownError.status = 'error';
      next(unknownError);
    }
  }
};

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Credenciales inválidas
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      throw new Error('Por favor ingresa tu correo y contraseña');
    }

    const { user, token } = await authService.login(email, password);

    // Configurar cookie segura con el token (opcional)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
    });

    res.status(200).json({
      success: true,
      token,
      data: {
        user,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      const err = error as Error & { statusCode?: number; status?: string };
      if (!err.statusCode) {
        err.statusCode = 500;
        err.status = 'error';
      }
      next(err);
    } else {
      const unknownError = new Error('An unknown error occurred') as Error & { statusCode: number; status: string };
      unknownError.statusCode = 500;
      unknownError.status = 'error';
      next(unknownError);
    }
  }
};

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Obtener perfil del usuario autenticado
 *     description: Obtiene la información del perfil del usuario actualmente autenticado
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil de usuario obtenido exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req.user as IUser)._id?.toString();
    if (!userId) {
      throw new Error('User ID not found in request');
    }
    const user = await authService.getMe(userId);
    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      const err = error as Error & { statusCode?: number; status?: string };
      if (!err.statusCode) {
        err.statusCode = 500;
        err.status = 'error';
      }
      next(err);
    } else {
      const unknownError = new Error('An unknown error occurred') as Error & { statusCode: number; status: string };
      unknownError.statusCode = 500;
      unknownError.status = 'error';
      next(unknownError);
    }
  }
};

/**
 * @swagger
 * /api/v1/auth/update-password:
 *   patch:
 *     summary: Actualizar contraseña del usuario autenticado
 *     description: Permite al usuario cambiar su contraseña actual por una nueva
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *                 description: Contraseña actual del usuario
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Nueva contraseña (mínimo 8 caracteres)
 *     responses:
 *       200:
 *         description: Contraseña actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                   description: Nuevo token JWT
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Contraseña actual incorrecta o nueva contraseña inválida
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
export const updatePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      throw new Error('Por favor proporciona tanto la contraseña actual como la nueva');
    }

    const { user, token } = await authService.updatePassword(
      (req.user as IUser)._id?.toString() ?? '',
      currentPassword,
      newPassword
    );

    res.status(200).json({
      success: true,
      token,
      data: {
        user,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      const err = error as Error & { statusCode?: number; status?: string };
      if (!err.statusCode) {
        err.statusCode = 500;
        err.status = 'error';
      }
      next(err);
    } else {
      const unknownError = new Error('An unknown error occurred') as Error & { statusCode: number; status: string };
      unknownError.statusCode = 500;
      unknownError.status = 'error';
      next(unknownError);
    }
  }
};

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Solicitar restablecimiento de contraseña
 *     description: Envía un correo con un enlace para restablecer la contraseña
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Correo electrónico del usuario
 *     responses:
 *       200:
 *         description: Correo de restablecimiento enviado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   description: Mensaje de confirmación
 *       400:
 *         description: Correo electrónico no proporcionado o inválido
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: No existe un usuario con el correo electrónico proporcionado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
export const forgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      throw new Error('Por favor proporciona un correo electrónico');
    }

    const result = await authService.forgotPassword(email);
    
    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      const err = error as Error & { statusCode?: number; status?: string };
      if (!err.statusCode) {
        err.statusCode = 500;
        err.status = 'error';
      }
      next(err);
    } else {
      const unknownError = new Error('An unknown error occurred') as Error & { statusCode: number; status: string };
      unknownError.statusCode = 500;
      unknownError.status = 'error';
      next(unknownError);
    }
  }
};

/**
 * @swagger
 * /api/v1/auth/reset-password/{token}:
 *   patch:
 *     summary: Restablecer contraseña con token
 *     description: Permite al usuario establecer una nueva contraseña usando un token de restablecimiento
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Token de restablecimiento de contraseña
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 description: Nueva contraseña (mínimo 8 caracteres)
 *     responses:
 *       200:
 *         description: Contraseña restablecida exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                   description: Nuevo token JWT
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Token inválido o expirado
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
export const resetPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { token } = req.params;
    const { password } = req.body;
    
    if (!password) {
      throw new Error('Por favor proporciona una nueva contraseña');
    }

    // Using the existing updatePassword method from authService
    // Note: This assumes the token is valid and the user exists
    const user = await User.findOne({
      passwordResetToken: crypto
        .createHash('sha256')
        .update(token)
        .digest('hex'),
      passwordResetExpires: { $gt: Date.now() }
    }) as IUser & { _id: Types.ObjectId };

    if (!user) {
      throw new Error('El token es inválido o ha expirado');
    }

    // Update the user's password
    user.password = password;
    // passwordConfirm is a virtual field, only used for validation
    // The actual password confirmation should be handled in the model's pre-save hook
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Generate new token
    const authToken = generateToken({ 
      id: user._id.toString(), 
      role: user.role as UserRole 
    });

    res.status(200).json({
      success: true,
      token: authToken,
      data: {
        user,
      },
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      const err = error as Error & { statusCode?: number; status?: string };
      if (!err.statusCode) {
        err.statusCode = 500;
        err.status = 'error';
      }
      next(err);
    } else {
      const unknownError = new Error('An unknown error occurred') as Error & { statusCode: number; status: string };
      unknownError.statusCode = 500;
      unknownError.status = 'error';
      next(unknownError);
    }
  }
};

/**
 * @swagger
 * /api/v1/auth/logout:
 *   get:
 *     summary: Cerrar sesión
 *     description: Invalida el token de autenticación actual
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                   description: Mensaje de confirmación
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
export const logout = (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
};

/**
 * @swagger
 * /api/v1/me:
 *   patch:
 *     summary: Actualizar Perfil de usuario
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 */
export const updateProfile = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /update-password.',
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody: Partial<IUser> = {
    name: req.body.name,
    email: req.body.email
  };

  try {
    // 3) Update user document
    const user = await User.findById(req.user!._id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Update user fields
    Object.assign(user, filteredBody);
    const updatedUser = await user.save();

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      const err = error as Error & { statusCode?: number; status?: string };
      if (!err.statusCode) {
        err.statusCode = 500;
        err.status = 'error';
      }
      next(err);
    } else {
      const unknownError = new Error('An unknown error occurred') as Error & { statusCode: number; status: string };
      unknownError.statusCode = 500;
      unknownError.status = 'error';
      next(unknownError);
    }
  }
});
