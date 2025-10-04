import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import AppError from '../utils/appError';

export const validateCategoryInput = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('El nombre de la categoría es requerido')
    .isLength({ max: 100 })
    .withMessage('El nombre no puede tener más de 100 caracteres'),
    
  body('description')
    .trim()
    .notEmpty()
    .withMessage('La descripción es requerida')
    .isLength({ max: 500 })
    .withMessage('La descripción no puede tener más de 500 caracteres'),
    
  body('icon')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('El ícono no puede tener más de 50 caracteres'),
    
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const errorMessage = errors.array().map(err => err.msg).join('. ');
      return next(new AppError(errorMessage, 400));
    }
    next();
  }
];
