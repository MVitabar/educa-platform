import { Document, Model, Types } from 'mongoose';

export interface ISectionMethods {
  // Add lesson to section
  addLesson(lessonId: Types.ObjectId | string, position?: number): Promise<boolean>;
  // Remove lesson from section
  removeLesson(lessonId: Types.ObjectId | string): Promise<boolean>;
  // Reorder lessons in section
  reorderLessons(lessonIds: (Types.ObjectId | string)[]): Promise<boolean>;
  // Get section duration in minutes
  getDuration(): Promise<number>;
}

export interface ISection {
  // Core fields
  title: string;
  description?: string;
  course: Types.ObjectId;
  order: number;
  isPublished: boolean;
  
  // Metadata
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  publishedAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Virtuals
  readonly id: string;
  readonly lessons: Types.Array<Types.ObjectId>;
  readonly duration: number;
  readonly lessonCount: number;
  readonly isPreview: boolean;
}

export interface ISectionModel extends Model<ISection, {}, ISectionMethods> {
  // Static methods
  findByCourse(courseId: Types.ObjectId | string): Promise<ISectionDocument[]>;
  findPublishedByCourse(courseId: Types.ObjectId | string): Promise<ISectionDocument[]>;
  getNextOrder(courseId: Types.ObjectId | string): Promise<number>;
  getCourseSectionsWithLessons(courseId: Types.ObjectId | string): Promise<ISectionWithLessons[]>;
  reorderSections(courseId: Types.ObjectId | string, sectionIds: (Types.ObjectId | string)[]): Promise<boolean>;
}

// Document type with methods
export type ISectionDocument = Document<unknown, {}, ISection> & 
  Omit<ISection, keyof Document> & 
  ISectionMethods & {
    _id: Types.ObjectId;
  };

// Extended interfaces for populated data
export interface ISectionWithLessons extends Omit<ISection, 'lessons'> {
  lessons: Array<{
    _id: Types.ObjectId;
    title: string;
    duration: number;
    isPublished: boolean;
    isPreview: boolean;
    order: number;
    videoUrl?: string;
  }>;
}

// Input Types for API
export interface CreateSectionInput {
  course: string;
  title: string;
  description?: string;
  isPublished?: boolean;
  order?: number;
}

export interface UpdateSectionInput {
  id: string;
  title?: string;
  description?: string;
  isPublished?: boolean;
  order?: number;
}

export interface ReorderSectionsInput {
  courseId: string;
  sections: Array<{
    id: string;
    order: number;
  }>;
}

export interface SectionQueryParams {
  courseId?: string;
  isPublished?: boolean;
  sort?: string;
  limit?: number;
  page?: number;
}
