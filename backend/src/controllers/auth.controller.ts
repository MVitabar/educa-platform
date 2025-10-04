import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import * as authService from '../services/auth/auth.service';
import { IUser } from '../types/user.types';

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
 * Controlador para obtener el perfil del usuario autenticado
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
 * Controlador para actualizar la contraseña del usuario autenticado
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
 * Controlador para solicitar restablecimiento de contraseña
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
 * Controlador para restablecer la contraseña con un token
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

    const { user, token: authToken } = await authService.resetPassword(
      token,
      password
    );

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
 * Controlador para cerrar sesión
 */
export const logout = (_req: Request, res: Response) => {
  // Eliminar la cookie del token
  res.clearCookie('token');
  
  res.status(200).json({
    success: true,
    message: 'Sesión cerrada correctamente',
  });
};
