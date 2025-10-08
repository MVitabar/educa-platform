import { Document, Model, Types } from 'mongoose';

// Types for lesson content
export type ContentType = 'text' | 'video' | 'video_link' | 'pdf' | 'document' | 'quiz' | 'assignment' | 'live' | 'download';

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
  allowedFileTypes?: string[];
  maxFileSize?: number; // in MB
};

export interface IResource {
  title: string;
  url: string;
  type: 'document' | 'link' | 'file' | 'pdf' | 'video' | 'audio' | 'image';
  description?: string;
  fileSize?: number; // in bytes
  mimeType?: string; // MIME type of the file
  thumbnailUrl?: string; // For video/image previews
  duration?: number; // For audio/video content in seconds
}

export interface IContentBlock {
  type: ContentType;
  content: string; // Could be text content, video URL, or file path
  title?: string;
  description?: string;
  duration?: number; // in minutes, for video content
  thumbnailUrl?: string; // For video previews
  fileSize?: number; // in bytes, for file uploads
  fileType?: string; // MIME type of the file
  order: number; // To maintain the order of content blocks
}

export interface ILessonBase extends Document {
  // Mongoose document properties
  _id: Types.ObjectId;
  id: string;
  __v?: number;
  
  // Your custom properties
  title: string;
  description?: string;
  contentBlocks: IContentBlock[];
  duration: number;
  resources: IResource[];
  course: Types.ObjectId;
  section: Types.ObjectId;
  isFree: boolean;
  isPublished: boolean;
  isPreview: boolean;
  requiresCompletion: boolean;
  prerequisites: Types.ObjectId[];
  viewCount: number;
  completionCount: number;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Virtuals
  nextLesson?: Types.ObjectId;
  previousLesson?: Types.ObjectId;
}

export interface ILessonMethods {
  // Add any document methods here
  markAsCompleted(userId: Types.ObjectId | string): Promise<boolean>;
  isCompletedByUser(userId: Types.ObjectId | string): Promise<boolean>;
  getCompletionPercentage(userId: Types.ObjectId | string): Promise<number>;
  addResource(resource: Omit<IResource, 'id'>): Promise<IResource>;
  removeResource(resourceId: string): Promise<boolean>;
}

export type ILesson = ILessonBase & ILessonMethods;

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
