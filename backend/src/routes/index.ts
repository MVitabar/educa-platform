import { Router, Request, Response, NextFunction } from 'express';
import { notFoundHandler } from '../middlewares/error.middleware';

// Import all route handlers
import authRouter from './auth.routes';
import usersRouter from './users.routes';
import coursesRouter from './courses.routes';
import lessonsRouter from './lessons.routes';
import sectionsRouter from './sections.routes';
import progressRouter from './progress.routes';
// Import new route handlers (to be created)
import enrollmentsRouter from './enrollments.routes';
import categoriesRouter from './categories.routes';
import reviewsRouter from './reviews.routes';
import resourcesRouter from './resources.routes';

const router = Router();

// Debug flag to control route printing
const DEBUG_ROUTES = process.env.NODE_ENV !== 'production';

// Log all incoming requests
router.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// Mount API routes
const mountRoute = (path: string, router: Router, name: string) => {
  router.use(path, router);
  console.log(`${name} routes mounted at ${path}`);
};

// Core routes
router.use('/auth', authRouter);
console.log('Auth routes mounted at /auth');

router.use('/users', usersRouter);
console.log('Users routes mounted at /users');

// Course-related routes
router.use('/courses', coursesRouter);
console.log('Courses routes mounted at /courses');

router.use('/lessons', lessonsRouter);
console.log('Lessons routes mounted at /lessons');

router.use('/sections', sectionsRouter);
console.log('Sections routes mounted at /sections');

// New feature routes (to be implemented)
router.use('/enrollments', enrollmentsRouter);
console.log('Enrollments routes mounted at /enrollments');

router.use('/categories', categoriesRouter);
console.log('Categories routes mounted at /categories');

router.use('/reviews', reviewsRouter);
console.log('Reviews routes mounted at /reviews');

router.use('/resources', resourcesRouter);
console.log('Resources routes mounted at /resources');

// Progress tracking routes
router.use('/progress', progressRouter);
console.log('Progress tracking routes mounted at /progress');

// 404 handler for all routes
router.use(notFoundHandler);

// Debug: Print all registered routes
if (DEBUG_ROUTES) {
  const printRoutes = () => {
    const routes: { method: string; path: string }[] = [];
    const seen = new Set<string>();

    const processStack = (stack: any[], parentPath = '') => {
      stack.forEach((layer) => {
        if (!layer.route && !layer.name) return;

        if (layer.route) {
          const methods = Object.keys(layer.route.methods)
            .filter(method => method !== '_all')
            .map(method => method.toUpperCase())
            .join(',');

          if (methods) {
            // Get the path and ensure it doesn't start with 'i/'
            let path = layer.route.path;
            if (path.startsWith('i/')) {
              path = path.substring(1); // Remove the 'i' at the beginning
            }
            const fullPath = `${parentPath}${path === '/' ? '' : path}`;
            const routeKey = `${methods} ${fullPath}`;
            
            if (!seen.has(routeKey)) {
              seen.add(routeKey);
              routes.push({ method: methods, path: fullPath });
            }
          }
        } else if (layer.name === 'router' && layer.handle) {
          // Don't add any prefix for router paths
          processStack(layer.handle.stack, parentPath);
        }
      });
    };

    processStack(router.stack, '');

    console.log('\n=== Registered Routes ===');
    routes.forEach(route => {
      console.log(`${route.method.padEnd(7)} ${route.path}`);
    });
    console.log('========================\n');
  };

  setTimeout(printRoutes, 1000);
}

export default router;