import { Document, Model, Types } from 'mongoose';
import { IUser } from './user.types';
import { ICategory } from './category.types';

export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';

export interface IRating {
  average: number;
  count: number;
}

export interface IResource {
  title: string;
  url: string;
  type: 'pdf' | 'doc' | 'zip' | 'other';
}

export interface ICourseMethods {
  calculateAverageRating(): Promise<void>;
  isInstructor(userId: string | Types.ObjectId): boolean;
  isEnrolled(userId: string | Types.ObjectId): Promise<boolean>;
  getProgress(userId: string | Types.ObjectId): Promise<number>;
  addStudent(): Promise<ICourse>;
  updateRating(newRating: number): Promise<ICourse>;
}

export interface ICourse extends Document {
  // Basic Information
  title: string;
  subtitle?: string;
  description: string;
  instructor: Types.ObjectId | IUser;
  
  // Course Details
  price: number;
  duration: number; // in hours
  level: CourseLevel;
  category: Types.ObjectId | ICategory;
  image?: string;
  
  // Status & Metadata
  isPublished: boolean;
  isFeatured: boolean;
  isApproved: boolean;
  
  // Statistics
  rating: IRating;
  studentsEnrolled: number;
  lessonCount: number;
  
  // Content
  requirements: string[];
  learningOutcomes: string[];
  tags: string[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
  
  // Virtuals
  readonly id?: string;
  readonly slug: string;
  
  // Methods
  toJSON(): any;
  toObject(): any;
}

export interface ICourseModel extends Model<ICourse, {}, ICourseMethods> {
  // Static Methods
  findByInstructor(instructorId: string | Types.ObjectId): Promise<ICourse[]>;
  findByCategory(category: string): Promise<ICourse[]>;
  search(query: string): Promise<ICourse[]>;
  getFeaturedCourses(limit?: number): Promise<ICourse[]>;
  getPopularCourses(limit?: number): Promise<ICourse[]>;
  getNewestCourses(limit?: number): Promise<ICourse[]>;
}

// Input Types for API
export type CreateCourseInput = Omit<
  ICourse,
  | 'instructor'
  | 'rating'
  | 'isPublished'
  | 'isFeatured'
  | 'isApproved'
  | 'studentsEnrolled'
  | 'lessonCount'
  | 'createdAt'
  | 'updatedAt'
  | 'publishedAt'
  | keyof Document
> & {
  instructor: string;
};

export type UpdateCourseInput = Partial<CreateCourseInput>;
