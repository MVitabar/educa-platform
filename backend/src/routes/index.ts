import { Router } from 'express';
import authRouter from './auth.routes';
import usersRouter from './users.routes';
import coursesRouter from './courses.routes';
import categoriesRouter from './categories.routes';
import lessonsRouter from './lessons.routes';
import sectionsRouter from './sections.routes';
import enrollmentsRouter from './enrollments.routes';
import reviewsRouter from './reviews.routes';
import resourcesRouter from './resources.routes';
import progressRouter from './progress.routes';
import uploadRouter from './upload.routes';

const router = Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// API v1 routes
const apiRouter = Router();

// Auth routes
apiRouter.use('/auth', authRouter);
console.log('Auth routes mounted at /api/v1/auth');

// Users routes
apiRouter.use('/users', usersRouter);
console.log('Users routes mounted at /api/v1/users');

// Other API routes
apiRouter.use('/categories', categoriesRouter);
apiRouter.use('/courses', coursesRouter);
apiRouter.use('/lessons', lessonsRouter);
apiRouter.use('/enrollments', enrollmentsRouter);
apiRouter.use('/reviews', reviewsRouter);
apiRouter.use('/resources', resourcesRouter);
apiRouter.use('/progress', progressRouter);
apiRouter.use('/upload', uploadRouter);

// Mount sections routes under courses
apiRouter.use('/courses/:courseId/sections', sectionsRouter);

// Mount the API router under /api/v1
router.use('/api/v1', apiRouter);
console.log('API v1 routes mounted at /api/v1');

export default router;