import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'express-validator';

// Custom error class
export class ApiError extends Error {
  statusCode: number;
  data: any;

  constructor(statusCode: number, message: string, data?: any) {
    super(message);
    this.statusCode = statusCode;
    this.data = data;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Validation error interface
interface ValidationErrors {
  [key: string]: string[];
}

// Error handler middleware
export const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('❌ Error:', err);

  // Handle validation errors
  if (Array.isArray((err as any).errors)) {
    const validationErrors: ValidationErrors = {};
    (err as any).errors.forEach((error: ValidationError) => {
      if (!validationErrors[error.param]) {
        validationErrors[error.param] = [];
      }
      validationErrors[error.param].push(error.msg);
    });

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validationErrors,
    });
  }

  // Handle custom API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: err.data,
    });
  }

  // Handle other errors
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

// 404 Not Found handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
};
