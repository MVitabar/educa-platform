import { Document, Model, Types } from 'mongoose';

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface IReviewMethods {
  // Mark review as helpful
  markHelpful(userId: Types.ObjectId | string): Promise<boolean>;
  // Report a review
  report(reason: string, userId: Types.ObjectId | string): Promise<boolean>;
  // Calculate average rating for a course
  static getAverageRating(courseId: Types.ObjectId | string): Promise<number>;
}

export interface IReview {
  // Core fields
  course: Types.ObjectId;
  student: Types.ObjectId;
  rating: number; // 1-5
  title: string;
  comment: string;
  status: ReviewStatus;
  
  // Metadata
  helpfulCount: number;
  reportedBy: Array<{
    user: Types.ObjectId;
    reason: string;
    createdAt: Date;
  }>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  
  // Virtuals
  readonly id: string;
  readonly isHelpful: boolean;
}

export interface IReviewModel extends Model<IReview, {}, IReviewMethods> {
  // Static methods
  findByCourse(courseId: Types.ObjectId | string): Promise<IReviewDocument[]>;
  findByStudent(studentId: Types.ObjectId | string): Promise<IReviewDocument[]>;
  findByStatus(status: ReviewStatus): Promise<IReviewDocument[]>;
  getCourseReviewsStats(courseId: Types.ObjectId | string): Promise<{
    average: number;
    count: number;
    ratingCounts: {
      1: number;
      2: number;
      3: number;
      4: number;
      5: number;
    };
  }>;
}

// Document type with methods
export type IReviewDocument = Document<unknown, {}, IReview> & 
  Omit<IReview, keyof Document> & 
  IReviewMethods & {
    _id: Types.ObjectId;
  };

// Input Types for API
export interface CreateReviewInput {
  course: string;
  rating: number;
  title: string;
  comment: string;
}

export interface UpdateReviewInput {
  id: string;
  rating?: number;
  title?: string;
  comment?: string;
  status?: ReviewStatus;
}

export interface ReviewQueryParams {
  courseId?: string;
  studentId?: string;
  status?: ReviewStatus;
  minRating?: number;
  maxRating?: number;
  sort?: string;
  limit?: number;
  page?: number;
}
