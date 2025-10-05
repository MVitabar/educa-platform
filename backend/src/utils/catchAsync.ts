import { NextFunction, Request, RequestHandler, Response } from 'express';
import { Types } from 'mongoose';
import { IUser, UserRole } from '../types/user.types';

// Base async handler type
type AsyncRequestHandler<T = Request> = (
  req: T,
  res: Response,
  next: NextFunction
) => Promise<any>;

// For authenticated requests
export interface AuthenticatedRequest extends Request {
  user: IUser & {
    _id: Types.ObjectId;
    role: UserRole;
  };
  params: {
    [key: string]: string;
  };
  query: {
    [key: string]: string | undefined;
    page?: string;
    limit?: string;
  };
}

// For regular requests
export const catchAsync = <T extends Request = Request>(
  fn: AsyncRequestHandler<T>
): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req as T, res, next).catch(next);
  };
};

// For authenticated requests
export const catchAuthAsync = (
  fn: AsyncRequestHandler<AuthenticatedRequest>
): RequestHandler => {
  return catchAsync<AuthenticatedRequest>(async (req, res, next) => {
    if (!req.user) {
      return next(new Error('User not authenticated'));
    }
    return fn(req, res, next);
  });
};
