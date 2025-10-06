import { Request, Response, NextFunction } from 'express';
import mongoose, { Types, SortOrder } from 'mongoose';
import slugify from 'slugify';
import Course from '../models/course.model';
import { Category } from '../models/category.model';
import { ICategory, ICategoryDocument } from '../types/category.types';
import { ApiError } from '../utils/apiError';

interface CourseQuery {
  isPublished: boolean;
  category?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  price?: {
    $gte?: number;
    $lte?: number;
  };
  $text?: {
    $search: string;
  };
  [key: string]: any; // For any additional properties
}
import { IUser } from '../types/user.types';

// Extend the Express Request type to include user
interface IAuthenticatedRequest extends Request {
  user?: IUser & { _id: Types.ObjectId };
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Course:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - price
 *         - instructor
 *         - category
 *         - level
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated ID of the course
 *         title:
 *           type: string
 *           description: The course title
 *         subtitle:
 *           type: string
 *           description: A short subtitle for the course
 *         description:
 *           type: string
 *           description: Detailed course description
 *         price:
 *           type: number
 *           minimum: 0
 *           description: Course price in USD
 *         instructor:
 *           type: string
 *           description: Reference to the User model (instructor)
 *         category:
 *           type: string
 *           description: Reference to the Category model
 *         level:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *           description: Course difficulty level
 *         duration:
 *           type: number
 *           description: Course duration in hours
 *         thumbnail:
 *           type: string
 *           format: uri
 *           description: URL to the course thumbnail image
 *         isPublished:
 *           type: boolean
 *           default: false
 *           description: Whether the course is published
 *         isFeatured:
 *           type: boolean
 *           default: false
 *           description: Whether the course is featured
 *         ratingAverage:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *           default: 0
 *           description: Average rating from reviews
 *         ratingCount:
 *           type: number
 *           default: 0
 *           description: Number of ratings
 *         studentsCount:
 *           type: number
 *           default: 0
 *           description: Number of enrolled students
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 * 
 *     CreateCourseInput:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - price
 *         - category
 *         - level
 *       properties:
 *         title:
 *           type: string
 *           minLength: 10
 *           maxLength: 100
 *         subtitle:
 *           type: string
 *           maxLength: 200
 *         description:
 *           type: string
 *           minLength: 20
 *         price:
 *           type: number
 *           minimum: 0
 *         category:
 *           type: string
 *         level:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         duration:
 *           type: number
 *           minimum: 0
 *         thumbnail:
 *           type: string
 *           format: uri
 *         isPublished:
 *           type: boolean
 *         isFeatured:
 *           type: boolean
 * 
 *     UpdateCourseInput:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 10
 *           maxLength: 100
 *         subtitle:
 *           type: string
 *           maxLength: 200
 *         description:
 *           type: string
 *           minLength: 20
 *         price:
 *           type: number
 *           minimum: 0
 *         category:
 *           type: string
 *         level:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         duration:
 *           type: number
 *           minimum: 0
 *         thumbnail:
 *           type: string
 *           format: uri
 *         isPublished:
 *           type: boolean
 *         isFeatured:
 *           type: boolean
 * 
 *     Pagination:
 *       type: object
 *       properties:
 *         next:
 *           type: object
 *           properties:
 *             page:
 *               type: number
 *             limit:
 *               type: number
 *         prev:
 *           type: object
 *           properties:
 *             page:
 *               type: number
 *             limit:
 *               type: number
 * 
 * @swagger
 * tags:
 *   name: Courses
 *   description: Course management endpoints

/**
 * @swagger
 * /api/v1/courses:
 *   get:
 *     summary: Obtener todos los cursos
 *     tags: [Courses]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de cursos por página
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por ID de categoría
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [beginner, intermediate, advanced]
 *         description: Filtrar por nivel
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Precio mínimo
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Precio máximo
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price, -price, rating, -rating, students, -students, date, -date]
 *         description: Campo por el que ordenar
 *     responses:
 *       200:
 *         description: Lista de cursos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                   description: Número total de cursos
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     next:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                     prev:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 */
// Interface para los parámetros de consulta
type QueryParams = {
  page?: string;
  limit?: string;
  category?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  search?: string;
};

export const getCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1) Filtrado básico
    const queryObj: CourseQuery = { isPublished: true };
    const queryParams = req.query as unknown as QueryParams;

    // 2) Filtrado por categoría
    if (queryParams.category) {
      queryObj.category = queryParams.category;
    }

    // 3) Filtrado por nivel
    if (queryParams.level) {
      queryObj.level = queryParams.level as 'beginner' | 'intermediate' | 'advanced';
    }

    // 4) Filtrado por rango de precios
    if (queryParams.minPrice || queryParams.maxPrice) {
      queryObj.price = {};
      if (queryParams.minPrice) {
        queryObj.price.$gte = Number(queryParams.minPrice);
      }
      if (queryParams.maxPrice) {
        queryObj.price.$lte = Number(queryParams.maxPrice);
      }
    }

    // 5) Búsqueda por texto
    if (queryParams.search) {
      queryObj.$text = { $search: queryParams.search };
    }

    // 6) Ordenamiento
    type SortField = 'price' | 'rating.average' | 'studentsEnrolled' | 'createdAt' | '-price' | '-rating.average' | '-studentsEnrolled' | '-createdAt';
    let sortBy: string | Record<string, 1 | -1> = { createdAt: -1 }; // Default sort
    
    if (queryParams.sort) {
      const sortMap: Record<string, Record<string, 1 | -1>> = {
        'price': { price: 1 },
        '-price': { price: -1 },
        'rating': { 'rating.average': 1 },
        '-rating': { 'rating.average': -1 },
        'students': { studentsEnrolled: 1 },
        '-students': { studentsEnrolled: -1 },
        'date': { createdAt: 1 },
        '-date': { createdAt: -1 }
      };
      sortBy = sortMap[queryParams.sort] || sortBy;
    }

    // 7) Paginación
    const page = parseInt(queryParams.page || '1');
    const limit = parseInt(queryParams.limit || '10');
    const skip = (page - 1) * limit;

    // 8) Ejecutar consulta
    // Usamos una aserción de tipo más específica para queryObj
    const findQuery = Course.find(queryObj as Record<string, unknown>)
      .sort(sortBy)
      .skip(skip)
      .limit(limit)
      .populate('instructor', 'name email avatar')
      .populate('category', 'name');

    const countQuery = Course.countDocuments(queryObj as Record<string, unknown>);

    const [courses, total] = await Promise.all([findQuery, countQuery]);

    // 9) Calcular páginas
    const pages = Math.ceil(total / limit);
    const nextPage = page < pages ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;

    res.status(200).json({
      success: true,
      count: courses.length,
      pagination: {
        total,
        pages,
        page,
        limit,
        next: nextPage ? { page: nextPage, limit } : undefined,
        prev: prevPage ? { page: prevPage, limit } : undefined
      },
      data: courses
    });
  } catch (error: any) {
    next(new ApiError(500, `Error al obtener los cursos: ${error.message}`));
  }
};

/**
 * @swagger
 * /api/v1/courses/{id}:
 *   get:
 *     summary: Obtener un curso por ID
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *     responses:
 *       200:
 *         description: Detalles del curso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       404:
 *         description: Curso no encontrado
 *       400:
 *         description: ID inválido
 */
export const getCourse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return next(new ApiError(404, 'Curso no encontrado'));
    }
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      return next(new ApiError(400, 'ID de curso inválido'));
    }
    next(new ApiError(500, `Error al obtener el curso: ${error.message}`));
  }
};

/**
 * @swagger
 * /api/v1/courses:
 *   post:
 *     summary: Crear un nuevo curso (instructor/admin)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCourseInput'
 *     responses:
 *       201:
 *         description: Curso creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado - Se requiere autenticación
 *       403:
 *         description: Prohibido - Solo instructores pueden crear cursos
 */
export const createCourse = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Verificar que el usuario es instructor o admin
    if (!req.user || (req.user.role !== 'instructor' && req.user.role !== 'admin')) {
      await session.abortTransaction();
      return next(new ApiError(403, 'Solo los instructores pueden crear cursos'));
    }

    const { category: categoryName, ...rest } = req.body;

    if (!categoryName) {
      throw new ApiError(400, 'El nombre de la categoría es requerido');
    }

    console.log('Buscando categoría:', categoryName);
    
    // Primero intentamos encontrar la categoría por slug (que es único)
    const slug = slugify(categoryName.trim().toLowerCase(), { strict: true });
    let categoryDoc = await Category.findOne({ slug }).session(session);
    
    console.log('Categoría encontrada por slug:', categoryDoc);

    // Si no la encontramos, intentamos por nombre (case insensitive)
    if (!categoryDoc) {
      categoryDoc = await Category.findOne({ 
        name: { $regex: new RegExp(`^${categoryName}$`, 'i') }
      }).session(session);
      console.log('Categoría encontrada por nombre:', categoryDoc);
    }

    // Si la categoría no existe, crearla
    if (!categoryDoc) {
      try {
        console.log('Creando nueva categoría:', categoryName);
        
        // Usamos create directamente con el modelo para aprovechar los hooks
        const [newCategory] = await Category.create([{
          name: categoryName.trim(),
          description: 'Categoría creada automáticamente',
          isActive: true,
          featured: false,
          icon: 'default-icon',
          createdBy: req.user._id,
          updatedBy: req.user._id,
          parent: null,
          // El slug se generará automáticamente por el pre-save hook
        }], { session });
        
        console.log('Categoría guardada exitosamente:', newCategory);
        categoryDoc = newCategory;
      } catch (error: unknown) {
        console.error('Error al crear la categoría:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido al crear la categoría';
        throw new ApiError(400, `Error al crear la categoría: ${errorMessage}`);
      }
    }

    const courseData = {
      ...rest,
      // Extraer solo la URL de la imagen si es un objeto
      image: rest.image?.url || rest.image || 'default-course.jpg',
      category: categoryDoc.name, // Usamos el nombre de la categoría en lugar del ID
      instructor: req.user._id,
      isPublished: req.body.isPublished !== undefined ? req.body.isPublished : true // Aseguramos que isPublished se tome del request
    };
    
    console.log('Datos del curso a guardar (con isPublished):', courseData);
    
    console.log('Datos del curso a guardar:', courseData);

    const course = await Course.create([courseData], { session });
    
    await session.commitTransaction();
    
    res.status(201).json({
      success: true,
      data: course[0] // Create devuelve un array
    });
  } catch (error: any) {
    await session.abortTransaction();
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      return next(new ApiError(400, messages.join(', ')));
    }
    next(new ApiError(500, `Error al crear el curso: ${error.message}`));
  } finally {
    session.endSession();
  }
};

/**
 * @swagger
 * /api/v1/courses/{id}:
 *   put:
 *     summary: Actualizar un curso (instructor/propietario o admin)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCourseInput'
 *     responses:
 *       200:
 *         description: Curso actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Course'
 *       400:
 *         description: Datos de entrada inválidos
 *       401:
 *         description: No autorizado - Se requiere autenticación
 *       403:
 *         description: Prohibido - No tienes permiso para actualizar este curso
 *       404:
 *         description: Curso no encontrado
 */
export const updateCourse = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    let course = await Course.findById(req.params.id);
    
    if (!course) {
      return next(new ApiError(404, 'Curso no encontrado'));
    }

    // Verificar que el usuario es el instructor del curso o admin
    if (!req.user || (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin')) {
      return next(new ApiError(403, 'No tienes permiso para actualizar este curso'));
    }

    course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: course
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((val: any) => val.message);
      return next(new ApiError(400, messages.join(', ')));
    }
    next(new ApiError(500, `Error al actualizar el curso: ${error.message}`));
  }
};

/**
 * @swagger
 * /api/v1/courses/{id}:
 *   delete:
 *     summary: Eliminar un curso (instructor/propietario o admin)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del curso
 *     responses:
 *       200:
 *         description: Curso eliminado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: ID inválido
 *       401:
 *         description: No autorizado - Se requiere autenticación
 *       403:
 *         description: Prohibido - No tienes permiso para eliminar este curso
 *       404:
 *         description: Curso no encontrado
 */
export const deleteCourse = async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return next(new ApiError(404, 'Curso no encontrado'));
    }

    // Verificar que el usuario es el instructor del curso o admin
    if (!req.user || (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin')) {
      return next(new ApiError(403, 'No tienes permiso para eliminar este curso'));
    }

    await course.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error: any) {
    if (error.name === 'CastError') {
      return next(new ApiError(400, 'ID de curso inválido'));
    }
    next(new ApiError(500, `Error al eliminar el curso: ${error.message}`));
  }
};

/**
 * @swagger
 * /api/v1/categories/{categoryId}/courses:
 *   get:
 *     summary: Obtener cursos por categoría
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la categoría
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de cursos por página
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [price, -price, rating, -rating, students, -students, date, -date]
 *           default: -createdAt
 *         description: Campo por el que ordenar
 *     responses:
 *       200:
 *         description: Lista de cursos de la categoría
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     next:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                         limit:
 *                           type: number
 *                     prev:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                         limit:
 *                           type: number
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Course'
 *       404:
 *         description: Categoría no encontrada
 */
export const getCoursesByCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { categoryId } = req.params;
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '10', 10);
    const skip = (page - 1) * limit;
    
    // Definir el tipo de ordenamiento
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      'price': { price: 1 },
      '-price': { price: -1 },
      'rating': { 'rating.average': 1 },
      '-rating': { 'rating.average': -1 },
      'students': { studentsEnrolled: 1 },
      '-students': { studentsEnrolled: -1 },
      'date': { createdAt: 1 },
      '-date': { createdAt: -1 },
      '-createdAt': { createdAt: -1 }
    };
    
    const sortQuery = sortMap[(req.query.sort as string) || '-createdAt'] || { createdAt: -1 };

    // Verificar si la categoría existe
    const category = await Category.findById(categoryId).exec();
    if (!category) {
      const error = new ApiError(404, 'Categoría no encontrada');
      return next(error);
    }

    // Construir el objeto de consulta
    const query: any = { category: categoryId, isPublished: true };

    // Obtener cursos con paginación
    const [courses, total] = await Promise.all([
      Course.find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .populate('instructor', 'name')
        .populate('category', 'name')
        .lean(),
      Course.countDocuments(query)
    ]);

    // Construir objeto de paginación
    const pagination: any = {};
    if (skip + courses.length < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    if (skip > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: courses.length,
      pagination,
      data: courses
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getCoursesByCategory
};
