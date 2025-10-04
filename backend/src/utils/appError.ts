class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
  code?: number;

  constructor(message: string, statusCode: number) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string) {
    return new AppError(message, 400);
  }

  static unauthorized(message = 'You are not authorized to perform this action') {
    return new AppError(message, 401);
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new AppError(message, 403);
  }

  static notFound(message = 'The requested resource was not found') {
    return new AppError(message, 404);
  }

  static conflict(message = 'A conflict occurred') {
    return new AppError(message, 409);
  }

  static internalError(message = 'An internal server error occurred') {
    return new AppError(message, 500);
  }
}

export default AppError;
