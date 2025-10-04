import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/auth/auth.service';
import User from '../models/user.model';
import { ApiError } from '../utils/apiError';

// Interfaz extendida para incluir la propiedad user
export interface AuthenticatedRequest extends Request {
  user?: any; // Cambiar 'any' por la interfaz de tu modelo de usuario si está disponible
}

// Middleware para proteger rutas
export const protect = async (
  req: AuthenticatedRequest,
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
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return next(
        new ApiError(401, 'El usuario correspondiente a este token ya no existe')
      );
    }

    // 4) Verificar si el usuario cambió la contraseña después de que se emitió el token
    if (decoded.iat && currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new ApiError(401, 'El usuario cambió recientemente su contraseña. Por favor inicia sesión de nuevo')
      );
    }

    // 5) Otorgar acceso a la ruta protegida
    req.user = currentUser;
    next();
  } catch (error) {
    next(error);
  }
};

// Middleware para restringir el acceso por roles
export const restrictTo = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ApiError(403, 'No tienes permiso para realizar esta acción')
      );
    }
    next();
  };
};
