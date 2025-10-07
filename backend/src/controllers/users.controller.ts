import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { promisify } from 'util';
import User from '../models/user.model';
import Course from '../models/course.model';
import { ApiError } from '../utils/apiError';
import { generateToken } from '../services/auth/auth.service';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../utils/email';
import { Types, Document } from 'mongoose';
import { IUser, UserRole } from '../types/user.types';

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: Gestión de usuarios
 *
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           format: ObjectId
 *           description: ID del usuario
 *         name:
 *           type: string
 *           description: Nombre del usuario
 *         email:
 *           type: string
 *           format: email
 *           description: Correo electrónico del usuario
 *         role:
 *           type: string
 *           enum: [student, instructor, admin]
 *           description: Rol del usuario
 *         avatar:
 *           type: string
 *           description: URL del avatar del usuario
 *         bio:
 *           type: string
 *           description: Biografía del usuario
 *         isActive:
 *           type: boolean
 *           description: Indica si el usuario está activo
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de creación del usuario
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Fecha de última actualización
 */

// UserDocument type for type safety
type UserDocument = IUser & { _id: Types.ObjectId } & Document;

// Define a simplified Course type
type SimpleCourse = {
  _id: Types.ObjectId;
  title: string;
  description: string;
  price: number;
  image: string;
  studentsEnrolled: number;
  rating?: number;
  category: { name: string } | Types.ObjectId;
};

// Promisify crypto.randomBytes
const randomBytes = promisify(crypto.randomBytes);


/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Obtener perfil del usuario actual
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario actual
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const getProfile = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user?._id).select('-password -__v');
    
    if (!user) {
      return next(new ApiError(404, 'Usuario no encontrado'));
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error: any) {
    next(new ApiError(500, 'Error al obtener el perfil: ' + error.message));
  }
};

// @desc    Registrar un nuevo usuario
// @route   POST /api/v1/auth/register
// @access  Public
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, password, role = 'student' } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new ApiError(400, 'El correo electrónico ya está en uso'));
    }

    // Crear usuario
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    // Enviar correo de bienvenida
    if (user) {
      try {
        await sendWelcomeEmail({
          email: user.email,
          name: user.name,
          emailVerificationToken: user.emailVerificationToken || ''
        });
      } catch (error) {
        console.error('Error al enviar correo de bienvenida:', error);
        // No fallar la solicitud si el correo no se puede enviar
      }
    }

    // Usar un tipo más simple para el usuario
    interface SimpleUser {
      _id: Types.ObjectId;
      role: UserRole;
      toObject(): any;
    }
    
    const userDoc = user as unknown as SimpleUser;
    
    // Generar token con tipos simples
    const token = generateToken({
      id: userDoc._id.toString(),
      role: userDoc.role
    });

    // Crear objeto de respuesta sin la contraseña
    const userResponse = {
      ...userDoc.toObject(),
      password: undefined
    };

    res.status(201).json({
      status: 'success' as const,
      token,
      data: {
        user: userResponse
      }
    });
  } catch (error: any) {
    next(new ApiError(500, 'Error al registrar el usuario: ' + error.message));
  }
};

// @desc    Iniciar sesión
// @route   POST /api/v1/auth/login
// @access  Público
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    // 1) Verificar si el email y la contraseña existen
    if (!email || !password) {
      return next(new ApiError(400, 'Por favor ingresa tu correo y contraseña'));
    }

    // 2) Verificar si el usuario existe y la contraseña es correcta
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      return next(new ApiError(401, 'Correo o contraseña incorrectos'));
    }

    // 3) Verificar si la cuenta está activa
    if (!user.isActive) {
      return next(new ApiError(401, 'Tu cuenta ha sido desactivada. Por favor contacta al soporte.'));
    }

    // Usar un tipo simple para el usuario
    interface SimpleUser {
      _id: Types.ObjectId;
      role: UserRole;
      password?: string;
    }
    
    const userDoc = user as unknown as SimpleUser;
    
    // 4) Generar token con tipos simples
    const token = generateToken({
      id: userDoc._id.toString(),
      role: userDoc.role
    });

    // 5) No devolver la contraseña en la respuesta
    userDoc.password = undefined;

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user
      }
    });
  } catch (error: any) {
    next(new ApiError(500, 'Error al obtener el perfil: ' + error.message));
  }
};

/**
 * @swagger
 * /api/v1/users/update-me:
 *   patch:
 *     summary: Actualizar perfil del usuario actual
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               avatar:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil actualizado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
export const updateProfile = async (req: any, res: Response, next: NextFunction) => {
  try {
    // 1) Crear un objeto con los campos permitidos para actualizar
    const filteredBody: Partial<Omit<IUser, 'id' | 'fullName'>> = {};
    const allowedFields = ['name', 'email', 'avatar', 'bio'];
    
    // Filtrar solo los campos permitidos
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key)) {
        (filteredBody as any)[key] = req.body[key];
      }
    });

    // 2) Actualizar el usuario
    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      filteredBody,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      status: 'success',
      data: {
        user: updatedUser
      }
    });
  } catch (error: any) {
    next(new ApiError(500, 'Error al actualizar el perfil: ' + error.message));
  }
};

// @desc    Eliminar cuenta del usuario actual
// @route   DELETE /api/v1/users/delete-me
// @access  Privado
export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    await User.findByIdAndUpdate(req.user?._id, { isActive: false });
    
    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error: any) {
    next(new ApiError(500, 'Error al eliminar la cuenta: ' + error.message));
  }
};

// @desc    Obtener inscripciones del usuario actual
// @route   GET /api/v1/users/my-enrollments
// @access  Privado
export const getUserEnrollments = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const enrollments = await User.aggregate([
      { $match: { _id: req.user?._id } },
      {
        $lookup: {
          from: 'enrollments',
          localField: '_id',
          foreignField: 'user',
          as: 'enrollments'
        }
      },
      { $unwind: '$enrollments' },
      {
        $lookup: {
          from: 'courses',
          localField: 'enrollments.course',
          foreignField: '_id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $project: {
          _id: '$enrollments._id',
          course: {
            _id: '$course._id',
            title: '$course.title',
            description: '$course.description',
            image: '$course.image',
            instructor: '$course.instructor'
          },
          progress: '$enrollments.progress',
          completed: '$enrollments.completed',
          enrolledAt: '$enrollments.enrolledAt',
          completedAt: '$enrollments.completedAt'
        }
      }
    ]);

    res.status(200).json({
      status: 'success',
      results: enrollments.length,
      data: {
        enrollments
      }
    });
  } catch (error: any) {
    next(new ApiError(500, 'Error al obtener las inscripciones: ' + error.message));
  }
};

// Interfaces para la respuesta de la API
interface CategoryRef {
  _id: Types.ObjectId;
  name: string;
}

interface CourseResponse {
  _id: Types.ObjectId;
  title: string;
  description: string;
  price: number;
  image: string;
  studentsEnrolled: number;
  rating?: number;
  category: CategoryRef | Types.ObjectId;
}

// Función para transformar los datos del curso
function toCourseResponse(course: any): CourseResponse {
  return {
    _id: course._id,
    title: course.title,
    description: course.description,
    price: course.price,
    image: course.image,
    studentsEnrolled: course.studentsEnrolled,
    rating: course.rating,
    category: course.category
  };
}

// @desc    Obtener cursos del usuario actual (solo instructores)
// @route   GET /api/v1/users/my-courses
// @access  Privado/Instructor
export const getUserCourses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user?._id) {
      return next(new ApiError(401, 'No autorizado'));
    }

    // 1. Get all courses for the instructor in a single query
    const courses = await Course.aggregate([
      { $match: { instructor: req.user._id } },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      {
        $project: {
          title: 1,
          description: 1,
          price: 1,
          image: 1,
          studentsEnrolled: 1,
          rating: 1,
          'category._id': 1,
          'category.name': 1
        }
      }
    ]);

    // Skip the second query since we already have all the data

    // 2. Map to the desired structure
    const formattedCourses = courses.map(course => ({
      _id: course._id,
      title: course.title,
      description: course.description,
      price: course.price,
      image: course.image,
      studentsEnrolled: course.studentsEnrolled,
      rating: course.rating,
      category: {
        _id: course.category._id,
        name: course.category.name
      }
    }));

    // 3. Create the final response
    const response = {
      status: 'success' as const,
      results: formattedCourses.length,
      data: { courses: formattedCourses }
    };
    
    res.status(200).json(response);
  } catch (error: any) {
    next(new ApiError(500, 'Error al obtener los cursos: ' + error.message));
  }
};

// @desc    Cambiar contraseña
// @route   PATCH /api/v1/users/update-password
// @access  Privado
export const updatePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user || !req.user._id) {
      return next(new ApiError(401, 'No autorizado'));
    }
    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return next(new ApiError(404, 'Usuario no encontrado'));
    }
    // 2) Verificar la contraseña actual
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || typeof confirmPassword !== 'string') {
      return next(new ApiError(400, 'Los campos de contraseña deben ser strings'));
    }
    
    if (!(await user.comparePassword(currentPassword))) {
      return next(new ApiError(401, 'Tu contraseña actual es incorrecta'));
    }

    // 3) Verificar que las nuevas contraseñas coincidan
    if (newPassword !== confirmPassword) {
      return next(new ApiError(400, 'Las contraseñas no coinciden'));
    }

    // 4) Actualizar la contraseña
    user.password = newPassword;
    await user.save();

    // 5) Generar nuevo token
    const token = generateToken({
      id: (user as any)._id.toString(),
      role: user.role as UserRole
    });

    res.status(200).json({
      status: 'success',
      token,
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error: any) {
    next(new ApiError(500, 'Error al actualizar la contraseña'));
  }

};

// @desc    Solicitar restablecimiento de contraseña
// @route   POST /api/v1/auth/forgot-password
// @access  Público
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1) Obtener usuario por email
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return next(new ApiError(404, 'No hay ningún usuario con ese correo electrónico'));
    }

    // 2) Generar el token de restablecimiento
    const resetToken = user.createPasswordResetToken();
    if (!resetToken) {
      return next(new ApiError(500, 'Error al generar el token de restablecimiento'));
    }

    await user.save({ validateBeforeSave: false });

    // 3) Enviar el correo electrónico
    try {
      const resetURL = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${user.passwordResetToken}`;
      
      await sendPasswordResetEmail({
        email: user.email,
        name: user.name,
        passwordResetToken: user.passwordResetToken
      } as { email: string; name: string; passwordResetToken: string });

      res.status(200).json({
        status: 'success',
        message: 'El token ha sido enviado al correo electrónico!'
      });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new ApiError(500, 'Hubo un error al enviar el correo electrónico. Por favor, inténtalo de nuevo más tarde.'));
    }
  } catch (error: any) {
    next(new ApiError(500, 'Error al procesar la solicitud'));
  }
};

// @desc    Restablecer contraseña
// @route   PATCH /api/v1/auth/reset-password/:token
// @access  Público
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1) Obtener usuario basado en el token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    });

    // 2) Si el token no ha expirado y hay un usuario, establecer la nueva contraseña
    if (!user) {
      return next(new ApiError(400, 'El token no es válido o ha expirado'));
    }

    // 3) Validar la nueva contraseña
    if (!req.body.password || !req.body.passwordConfirm) {
      return next(new ApiError(400, 'Por favor, proporcione una nueva contraseña y confirme la contraseña'));
    }

    if (req.body.password !== req.body.passwordConfirm) {
      return next(new ApiError(400, 'Las contraseñas no coinciden'));
    }

    // 4) Actualizar la contraseña y eliminar el token
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Usar un tipo simple para el usuario
    interface SimpleUser {
      _id: Types.ObjectId;
      role: UserRole;
    }
    
    const userDoc = user as unknown as SimpleUser;
    
    // 5) Iniciar sesión del usuario, enviar JWT
    const token = generateToken({
      id: userDoc._id.toString(),
      role: userDoc.role
    });

    res.status(200).json({
      status: 'success',
      token,
      message: 'Contraseña actualizada correctamente!'
    });
  } catch (error: any) {
    next(new ApiError(500, 'Error al restablecer la contraseña: ' + error.message));
  }
};

// @desc    Verificar correo electrónico
// @route   GET /api/v1/auth/verify-email/:token
export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1) Obtener usuario basado en el token
    const hashedToken = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });

    // 2) Si el token no ha expirado y hay un usuario, verificar el correo
    if (!user) {
      return next(new ApiError(400, 'El token es inválido o ha expirado'));
    }

    // 3) Marcar el correo como verificado
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    // 4) Iniciar sesión al usuario, enviar JWT
    const token = generateToken({
      id: (user as any)._id.toString(),
      role: (user as any).role as UserRole
    });

    res.status(200).json({
      status: 'success',
      token,
      message: 'Correo electrónico verificado correctamente'
    });
  } catch (error: any) {
    next(new ApiError(500, 'Error al verificar el correo electrónico'));
  }
};

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Obtener todos los usuarios (solo administradores)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, instructor, admin]
 *         description: Filtrar por rol de usuario
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Número de usuarios por página
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 results:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserProfile'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
export const getAllUsers = async (req: any, res: Response, next: NextFunction) => {
  try {
    const users = await User.find().select('-__v');
    
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (error: any) {
    next(new ApiError(500, 'Error al obtener los usuarios'));
  }
};

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Obtener un usuario por ID (solo administradores)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario encontrado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const getUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(new ApiError(404, 'No se encontró ningún usuario con ese ID'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error: any) {
    next(new ApiError(500, 'Error al obtener el usuario'));
  }
};

/**
 * @swagger
 * /api/v1/users/{id}:
 *   patch:
 *     summary: Actualizar usuario (solo administradores)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [student, instructor, admin]
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Usuario actualizado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!user) {
      return next(new ApiError(404, 'No se encontró ningún usuario con ese ID'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error: any) {
    next(new ApiError(500, 'Error al actualizar el usuario'));
  }
};

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     summary: Eliminar usuario (solo administradores)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: ID del usuario
 *     responses:
 *       204:
 *         description: Usuario eliminado exitosamente
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
export const deleteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return next(new ApiError(404, 'No se encontró ningún usuario con ese ID'));
    }

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error: any) {
    next(new ApiError(500, 'Error al eliminar el usuario'));
  }
};
