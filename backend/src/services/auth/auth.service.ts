import jwt from 'jsonwebtoken';
import User from '../../models/user.model';
import { IUser, UserRole } from '../../types/user.types';
import { ApiError } from '../../utils/apiError';
import { Document, Types, Model } from 'mongoose';
import crypto from 'crypto';
import config from '../../config';

// Tipos para los tokens
export interface TokenPayload extends jwt.JwtPayload {
  id: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Tipo para el documento de usuario con métodos
type UserDocument = Document<unknown, {}, IUser> &
  IUser & {
    _id: Types.ObjectId;
    comparePassword(candidatePassword: string): Promise<boolean>;
    changedPasswordAfter(JWTTimestamp: number): boolean;
    createPasswordResetToken(): string;
    password?: string;
    save: () => Promise<UserDocument>;
  };

// Tipo para el usuario con contraseña
interface IUserWithPassword extends Omit<IUser, 'password'> {
  _id: Types.ObjectId;
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Interfaz extendida para incluir métodos de instancia
export interface UserModel extends Model<UserDocument> {
  register(userData: {
    name: string;
    email: string;
    password: string;
    passwordConfirm: string;
    role?: UserRole;
  }): Promise<{ user: UserDocument; token: string }>;
}

// Generar token JWT
export const generateToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
    algorithm: 'HS256',
  } as jwt.SignOptions);
};
// Verificar token JWT
export const verifyToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwtSecret) as TokenPayload;
  } catch (error) {
    throw new ApiError(401, 'Token inválido o expirado');
  }
};

// Registrar un nuevo usuario
export const register = async (userData: {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  role?: UserRole;
}) => {
  // Validar que las contraseñas coincidan
  if (userData.password !== userData.passwordConfirm) {
    throw new ApiError(400, 'Las contraseñas no coinciden');
  }

  // 1) Verificar si el usuario ya existe
  const existingUser = await User.findOne({ email: userData.email }) as UserDocument | null;
  if (existingUser) {
    throw new ApiError(400, 'El correo electrónico ya está en uso');
  }
  // 2) Crear el usuario - Usar un type assertion más específico
  const userDataToCreate = {
    name: userData.name,
    email: userData.email,
    password: userData.password,
    role: userData.role || 'student' as UserRole,
  };
  
  const user = (await User.create(userDataToCreate)) as unknown as UserDocument;

  // 3) Generar token
  const token = generateToken({ 
    id: user._id.toString(), 
    role: user.role 
  });

  return { user, token };
};
// Iniciar sesión
export const login = async (email: string, password: string) => {
  // Verificar si el usuario existe y la contraseña es correcta
  const user = await User.findOne({ email })
    .select('+password')
    .exec() as (IUser & { _id: Types.ObjectId, password: string, comparePassword: (candidatePassword: string) => Promise<boolean> }) | null;
  
  // Verificar si el usuario existe
  if (!user) {
    throw new ApiError(401, 'Credenciales inválidas');
  }
  
  // Verificar la contraseña
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new ApiError(401, 'Credenciales inválidas');
  }

  // Generar token JWT
  const token = jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '90d' } as jwt.SignOptions
  );

  // No devolver la contraseña en la respuesta
  const { password: _, ...userResponse } = user.toObject();

  return { 
    user: userResponse,
    token 
  };
};

// Obtener usuario actual
export const getMe = async (userId: string) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'Usuario no encontrado');
  }
  return user;
};

// Actualizar contraseña
export const updatePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
) => {
  const user = await User.findById(userId).select('+password');
  
  if (!user) {
    throw new ApiError(404, 'Usuario no encontrado');
  }

  // Verificar la contraseña actual
  if (!(await user.comparePassword(currentPassword))) {
    throw new ApiError(401, 'La contraseña actual es incorrecta');
  }

  // Actualizar la contraseña
  user.password = newPassword;
  user.passwordChangedAt = new Date();
  await user.save();

  // Generar nuevo token
  const token = generateToken({ id: (user as any)._id.toString(), role: user.role });

  return { user, token };
};

/**
 * Envía un correo electrónico con un enlace para restablecer la contraseña
 * @param email Correo electrónico del usuario
 * @returns Objeto con mensaje de éxito
 */
export const forgotPassword = async (email: string): Promise<{ message: string }> => {
  // 1) Buscar usuario por email
  const user = await User.findOne({ email });
  if (!user) {
    // No revelar si el email existe o no por seguridad
    return { message: 'Si el correo existe, se enviarán instrucciones de restablecimiento' };
  }

  // 2) Generar token de restablecimiento
  const resetToken = (user as any).createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Enviar email con el token (implementar lógica de envío de email)
  try {
    // Ejemplo de URL de restablecimiento (ajustar según tu frontend)
    const resetURL = `${config.clientUrl}/reset-password/${resetToken}`;
    
    // Aquí iría el código para enviar el email
    console.log(`Email de restablecimiento enviado a: ${email}`);
    console.log(`URL de restablecimiento: ${resetURL}`);
    
    // En producción, usar un servicio de email como Nodemailer
    // await sendEmail({
    //   email: user.email,
    //   subject: 'Tu token de restablecimiento de contraseña (válido por 10 minutos)',
    //   message: `¿Olvidaste tu contraseña? Envía una petición PATCH con tu nueva contraseña y confirmación a: ${resetURL}
    //   \nSi no olvidaste tu contraseña, por favor ignora este email.`
    // });
    
    return { message: 'Se han enviado las instrucciones de restablecimiento a tu correo' };
  } catch (error) {
    // Si hay un error al enviar el email, limpiar los campos de restablecimiento
    (user as any).passwordResetToken = undefined;
    (user as any).passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    throw new ApiError(
      500,
      'Hubo un error al enviar el email. Por favor inténtalo de nuevo más tarde.'
    );
  }
};


/**
 * Restablece la contraseña de un usuario utilizando un token de restablecimiento
 * @param token Token de restablecimiento de contraseña
 * @param newPassword Nueva contraseña
 * @returns Usuario actualizado y token de autenticación
 */
const resetPassword = async (token: string, newPassword: string) => {
  try {
    // 1) Get user based on the token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
    }) as IUser & { _id: Types.ObjectId };

    // 2) If token has not expired, and there is user, set the new password
    if (!user) {
      throw new ApiError(400, 'El token es inválido o ha expirado');
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property for the user
    // This is handled by a pre-save hook in the User model

    // 4) Log the user in, send JWT
    const tokenPayload: TokenPayload = {
      id: user._id.toString(),
      role: user.role
    };

    const authToken = generateToken(tokenPayload);

    // Remove password from output
    const userObj = user.toObject();
    const { password: _, ...userResponse } = userObj as any;
    const safeUserResponse = JSON.parse(JSON.stringify(userResponse)) as Omit<IUser, 'password'>;
    
    return { 
      user: safeUserResponse,
      token: authToken 
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, 'Error al restablecer la contraseña');
  }
};