import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from '../services/auth/auth.service';
import User from '../models/user.model';
import { ApiError } from '../utils/apiError';
import { IUser } from '../types/user.types';

import { Types } from 'mongoose';

import { UserDocument } from '../types/user.types';

// Middleware to protect routes
export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1) Obtener el token del encabezado de autorización
    let token: string | undefined;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return next(
        new ApiError(401, 'No estás autenticado. Por favor inicia sesión para acceder')
      );
    }

    // 2) Verificar token
    const decoded = verifyToken(token);

    // 3) Verificar si el usuario aún existe
    const currentUser = await User.findById(decoded.id).select('+password +passwordChangedAt +__v');
    if (!currentUser) {
      return next(
        new ApiError(401, 'El usuario correspondiente a este token ya no existe')
      );
    }

    // 4) Verificar si el usuario cambió la contraseña después de que se emitió el token
    const issuedAt = decoded.iat;
    if (issuedAt && currentUser.changedPasswordAfter(issuedAt)) {
      return next(
        new ApiError(401, 'El usuario cambió recientemente su contraseña. Por favor inicia sesión de nuevo')
      );
    }

    // 5) Otorgar acceso a la ruta protegida
    // Type assertion to UserDocument since we know the shape matches
    req.user = currentUser as unknown as UserDocument;
    next(); // Continuar al siguiente middleware/controlador
  } catch (error) {
    next(error as ApiError);
  }
};

// Middleware to restrict access by roles
export const restrictTo = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new ApiError(403, 'No tienes permiso para realizar esta acción')
      );
    }
    next();
  };
};
