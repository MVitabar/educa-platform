import { Document, Model, Types } from 'mongoose';

// Types for lesson content
export type ContentType = 'video' | 'text' | 'quiz' | 'assignment' | 'live' | 'download';

export type QuizQuestion = {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
  points: number;
};

export type Quiz = {
  title: string;
  description?: string;
  questions: QuizQuestion[];
  passingScore: number; // percentage
  timeLimit?: number; // in minutes
  maxAttempts?: number;
};

export type Assignment = {
  title: string;
  description: string;
  instructions: string;
  dueDate?: Date;
  points: number;
  submissionType: 'text' | 'file' | 'both';
  allowedFileTypes?: string[];
  maxFileSize?: number; // in MB
};

export interface IResource {
  id?: string;
  title: string;
  description?: string;
  url: string;
  type: 'pdf' | 'doc' | 'ppt' | 'zip' | 'image' | 'audio' | 'video' | 'other';
  size?: number; // in bytes
  duration?: number; // in seconds, for media files
  isDownloadable: boolean;
  isPreview: boolean;
}

export interface ILessonMethods {
  // Lesson completion
  markAsCompleted(userId: Types.ObjectId | string): Promise<boolean>;
  isCompletedByUser(userId: Types.ObjectId | string): Promise<boolean>;
  
  // Progress tracking
  getProgress(userId: Types.ObjectId | string): Promise<number>;
  
  // Resource management
  addResource(resource: Omit<IResource, 'id'>): Promise<IResource>;
  removeResource(resourceId: string): Promise<boolean>;
  
  // Content management
  updateContent(content: string, contentType: ContentType): Promise<boolean>;
  
  // Quiz methods
  submitQuizAnswers(userId: Types.ObjectId | string, answers: number[]): Promise<{
    score: number;
    passed: boolean;
    correctAnswers: number[];
  }>;
}

export interface ILesson extends Document, ILessonMethods {
  // Basic Information
  title: string;
  subtitle?: string;
  description: string;
  content: string;
  contentType: ContentType;
  
  // Media
  videoUrl?: string;
  thumbnailUrl?: string;
  duration: number; // in minutes
  
  // Course Relationship
  course: Types.ObjectId;
  section?: Types.ObjectId; // For grouping lessons into sections
  
  // Content
  resources: IResource[];
  quiz?: Quiz;
  assignment?: Assignment;
  
  // Metadata
  isFree: boolean;
  isPublished: boolean;
  isPreview: boolean; // Can be viewed without enrollment
  requiresCompletion: boolean; // If true, must complete before next lesson
  
  // Prerequisites
  prerequisites: Types.ObjectId[]; // Lessons that must be completed first
  
  // Statistics
  viewCount: number;
  completionCount: number;
  
  // Timestamps
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtuals
  readonly id: string;
  readonly nextLesson?: Types.ObjectId;
  readonly previousLesson?: Types.ObjectId;
  
  // Methods from ILessonMethods are included via extension
}

export interface ILessonModel extends Model<ILesson, object, ILessonMethods> {
  // Static Methods
  findByCourse(courseId: Types.ObjectId | string): Promise<ILesson[]>;
  findBySection(sectionId: Types.ObjectId | string): Promise<ILesson[]>;
  getCourseProgress(courseId: Types.ObjectId | string, userId: Types.ObjectId | string): Promise<number>;
  
  // Analytics
  getPopularLessons(limit?: number): Promise<ILesson[]>;
  getMostEngagingLessons(courseId: Types.ObjectId | string): Promise<ILesson[]>;
}

// Input Types for API
export type CreateLessonInput = Omit<
  ILesson,
  | 'course'
  | 'section'
  | 'prerequisites'
  | 'isPublished'
  | 'isPreview'
  | 'viewCount'
  | 'completionCount'
  | 'publishedAt'
  | 'createdAt'
  | 'updatedAt'
  | keyof Document
  | keyof ILessonMethods
> & {
  course: string;
  section?: string;
  prerequisites?: string[];
};

export type UpdateLessonInput = Partial<Omit<CreateLessonInput, 'course' | 'section'>> & {
  id: string;
  section?: string;
  addPrerequisites?: string[];
  removePrerequisites?: string[];
};

export type LessonQueryParams = {
  courseId?: string;
  sectionId?: string;
  isPublished?: boolean;
  isFree?: boolean;
  search?: string;
  sort?: string;
  limit?: number;
  page?: number;
};

// For lesson responses (with additional data)
export type LessonResponse = Omit<ILesson, keyof ILessonMethods> & {
  isCompleted?: boolean;
  progress?: number;
  nextLesson?: string;
  previousLesson?: string;
  canAccess: boolean;
};
