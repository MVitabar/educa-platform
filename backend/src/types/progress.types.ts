import { Document, Model, Types } from 'mongoose';

export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';

export interface IProgressMethods {
  // Mark a lesson as completed
  completeLesson(lessonId: Types.ObjectId | string): Promise<boolean>;
  // Update progress for a lesson
  updateLessonProgress(lessonId: Types.ObjectId | string, progress: number): Promise<boolean>;
  // Calculate overall course progress
  calculateCourseProgress(): Promise<number>;
  // Check if a lesson is completed
  isLessonCompleted(lessonId: Types.ObjectId | string): boolean;
  // Get progress for a specific lesson
  getLessonProgress(lessonId: Types.ObjectId | string): number;
}

export interface IProgress {
  // Core fields
  user: Types.ObjectId;
  course: Types.ObjectId;
  
  // Progress tracking
  completedLessons: Array<{
    lesson: Types.ObjectId;
    completedAt: Date;
    lastAccessed: Date;
    progress: number; // 0 to 100
    status: ProgressStatus;
    timeSpent: number; // in seconds
    notes?: string;
  }>;
  
  // Overall progress
  progress: number; // 0 to 100
  status: ProgressStatus;
  totalLessons: number;
  completedLessonsCount: number;
  lastAccessed: Date;
  
  // Timestamps
  startedAt: Date;
  completedAt?: Date;
  updatedAt: Date;
  
  // Virtuals
  readonly id: string;
  readonly timeSpent: number; // Total time spent in seconds
  readonly completionRate: number; // 0 to 1
  readonly nextLesson?: Types.ObjectId;
  readonly lastLesson?: Types.ObjectId;
}

export interface IProgressModel extends Model<IProgress, {}, IProgressMethods> {
  // Static methods
  findByUser(userId: Types.ObjectId | string, courseId?: Types.ObjectId | string): Promise<IProgressDocument[]>;
  findByCourse(courseId: Types.ObjectId | string): Promise<IProgressDocument[]>;
  getOrCreate(userId: Types.ObjectId | string, courseId: Types.ObjectId | string): Promise<IProgressDocument>;
  getCourseStats(courseId: Types.ObjectId | string): Promise<{
    totalStudents: number;
    averageProgress: number;
    completionRate: number;
    averageTimeSpent: number;
    progressDistribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
  }>;
  getUserCourseProgress(userId: Types.ObjectId | string, courseId: Types.ObjectId | string): Promise<{
    progress: number;
    completedLessons: number;
    totalLessons: number;
    status: ProgressStatus;
    lastAccessed: Date;
    timeSpent: number;
  }>;
}

// Document type with methods
export type IProgressDocument = Document<unknown, {}, IProgress> & 
  Omit<IProgress, keyof Document> & 
  IProgressMethods & {
    _id: Types.ObjectId;
  };

// Input Types for API
export interface TrackProgressInput {
  courseId: string;
  lessonId: string;
  progress: number;
  status?: ProgressStatus;
  timeSpent?: number;
  notes?: string;
}

export interface CompleteLessonInput {
  courseId: string;
  lessonId: string;
  timeSpent?: number;
  notes?: string;
}

export interface ProgressQueryParams {
  userId?: string;
  courseId?: string;
  status?: ProgressStatus;
  minProgress?: number;
  maxProgress?: number;
  sort?: string;
  limit?: number;
  page?: number;
}

// Types for progress analytics
export interface ProgressStats {
  totalStudents: number;
  activeStudents: number;
  completedStudents: number;
  averageProgress: number;
  averageCompletionTime: number; // in days
  completionRate: number;
  progressDistribution: Array<{
    range: string;
    count: number;
    percentage: number;
  }>;
}

export interface UserProgressOverview {
  totalCourses: number;
  inProgress: number;
  completed: number;
  completionRate: number;
  totalTimeSpent: number; // in minutes
  recentCourses: Array<{
    course: {
      id: string;
      title: string;
      image?: string;
    };
    progress: number;
    lastAccessed: Date;
  }>;
}
