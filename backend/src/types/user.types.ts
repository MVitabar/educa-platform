import { Document, Model, Types } from 'mongoose';

export type UserRole = 'student' | 'instructor' | 'admin';

export interface IUserProfile {
  bio?: string;
  website?: string;
  location?: string;
  twitter?: string;
  linkedin?: string;
  github?: string;
  skills?: string[];
  education?: {
    degree: string;
    field: string;
    institution: string;
    year: number;
  }[];
  experience?: {
    title: string;
    company: string;
    location?: string;
    from: Date;
    to?: Date;
    current: boolean;
    description?: string;
  }[];
}

export interface INotificationSettings {
  email: {
    announcements: boolean;
    courseUpdates: boolean;
    promotional: boolean;
  };
  push: {
    announcements: boolean;
    courseUpdates: boolean;
    messages: boolean;
  };
}

export interface IUserMethods {
  // Authentication
  comparePassword(candidatePassword: string): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
  createPasswordResetToken(): string;
  createEmailVerificationToken(): string;
  
  // User Actions
  enrollInCourse(courseId: Types.ObjectId | string): Promise<boolean>;
  completeLesson(lessonId: Types.ObjectId | string): Promise<boolean>;
  updateProfile(updates: Partial<IUser>): Promise<IUser>;
  
  // Permissions
  hasRole(role: UserRole | UserRole[]): boolean;
  canEditCourse(courseId: Types.ObjectId | string): Promise<boolean>;
  canViewCourse(courseId: Types.ObjectId | string): Promise<boolean>;
}

// Type for the user document that includes MongoDB document properties
export type UserDocument = IUser & Document & {
  _id: Types.ObjectId;
  __v: number;
  // Add other document methods if needed
};

export interface IUser extends Document, IUserMethods {
  // Identification
  name: string;
  email: string;
  password: string;
  role: UserRole;
  
  // Profile
  username?: string;
  avatar?: string;
  coverImage?: string;
  profile?: IUserProfile;
  
  // Status
  isActive: boolean;
  isEmailVerified: boolean;
  lastLogin?: Date;
  loginCount: number;
  
  // Security
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  
  // Settings
  preferences?: {
    language: string;
    timezone: string;
    theme: 'light' | 'dark' | 'system';
    notifications: INotificationSettings;
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  
  // Virtuals
  readonly id: string;
  readonly fullName: string;
  
  // Methods from IUserMethods are included via extension
}

export interface IUserModel extends Model<IUser, {}, IUserMethods> {
  // Static Methods
  findByEmail(email: string): Promise<IUser | null>;
  findByUsername(username: string): Promise<IUser | null>;
  findInstructors(): Promise<IUser[]>;
  findStudents(): Promise<IUser[]>;
  search(query: string): Promise<IUser[]>;
  
  // Authentication
  verifyPasswordResetToken(token: string): Promise<IUser | null>;
  verifyEmailToken(token: string): Promise<IUser | null>;
}

// Input Types for API
export type CreateUserInput = Omit<
  IUser,
  | 'passwordChangedAt'
  | 'passwordResetToken'
  | 'passwordResetExpires'
  | 'emailVerificationToken'
  | 'emailVerificationExpires'
  | 'isEmailVerified'
  | 'isActive'
  | 'lastLogin'
  | 'loginCount'
  | 'createdAt'
  | 'updatedAt'
  | keyof Document
  | keyof IUserMethods
> & {
  password?: string;
  confirmPassword?: string;
};

export type UpdateUserInput = Partial<Omit<CreateUserInput, 'email' | 'role'>> & {
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
};

export type UpdateUserRoleInput = {
  role: UserRole;
  reason?: string;
};

export type UserQueryParams = {
  page?: number;
  limit?: number;
  sort?: string;
  role?: UserRole;
  search?: string;
  isActive?: boolean;
  isEmailVerified?: boolean;
};

// For user profile responses (sensitive data removed)
export type UserProfileResponse = Omit<
  IUser,
  | 'password'
  | 'passwordChangedAt'
  | 'passwordResetToken'
  | 'passwordResetExpires'
  | 'emailVerificationToken'
  | 'emailVerificationExpires'
  | 'loginCount'
  | keyof IUserMethods
> & {
  isFollowing?: boolean;
  isFollower?: boolean;
  stats?: {
    coursesCreated?: number;
    coursesEnrolled?: number;
    studentsTaught?: number;
    reviewsWritten?: number;
  };
};
