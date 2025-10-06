import { Router, Request, Response, NextFunction } from 'express';
import { uploadFile, deleteFile } from '../controllers/upload.controller';
import { protect, restrictTo } from '../middlewares/auth.middleware';
import { IRequest } from '../types/express';

const router = Router();

// Type for the request handler with IRequest
type RequestHandler = (
  req: IRequest,
  res: Response,
  next: NextFunction
) => Promise<void | Response>;

// Helper function to handle async route handlers
const asyncHandler = (fn: RequestHandler) => (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  return Promise.resolve(fn(req as unknown as IRequest, res, next)).catch(next);
};

// @desc    Upload a file
// @route   POST /api/v1/upload
// @access  Private/Instructor
router.post(
  '/',
  protect,
  restrictTo('instructor', 'admin'),
  asyncHandler(uploadFile)
);

// @desc    Delete a file
// @route   DELETE /api/v1/upload
// @access  Private/Instructor
router.delete(
  '/',
  protect,
  restrictTo('instructor', 'admin'),
  asyncHandler(deleteFile)
);

export default router;
