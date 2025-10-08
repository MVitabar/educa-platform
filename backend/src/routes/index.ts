import { Router } from 'express';
import authRouter from './auth.routes';
import userRouter from './users.routes';
import courseRouter from './courses.routes';
import sectionRouter from './sections.routes';
import lessonRouter from './lessons.routes';
import enrollmentRouter from './enrollments.routes';
import dashboardRouter from './dashboard.routes';
import categoryRouter from './categories.routes';
import reviewRouter from './reviews.routes';
import progressRouter from './progress.routes';
import resourceRouter from './resources.routes';
import uploadRouter from './upload.routes';
import lessonsController from '../controllers/lessons.controller';

const router = Router();

// API version 1 routes
const apiRouter = Router();

// Mount routes
apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/enrollments', enrollmentRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/categories', categoryRouter);
apiRouter.use('/reviews', reviewRouter);
apiRouter.use('/resources', resourceRouter);
apiRouter.use('/progress', progressRouter);
apiRouter.use('/upload', uploadRouter);

// Mount lessons routes for direct access
apiRouter.use('/lessons', lessonRouter);

// Mount courses routes
apiRouter.use('/courses', courseRouter);

// Mount sections routes under courses with mergeParams
const courseSectionsRouter = Router({ mergeParams: true });
courseSectionsRouter.use(sectionRouter);
courseRouter.use('/:courseId/sections', courseSectionsRouter);

// Mount the API router under /api/v1
router.use('/api/v1', apiRouter);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

console.log('API v1 routes mounted at /api/v1');
console.log('Sections routes mounted at /api/v1/courses/:courseId/sections');
console.log('Nested lessons routes mounted at /api/v1/courses/:courseId/sections/:sectionId/lessons');
console.log('Direct lessons routes mounted at /api/v1/lessons');

export default router;