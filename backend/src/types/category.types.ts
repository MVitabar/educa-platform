import { Document, Model, Types } from 'mongoose';

export interface ICategoryMethods {
  // Add category to favorites for a user
  addToFavorites(userId: Types.ObjectId | string): Promise<boolean>;
  // Check if category is in user's favorites
  isInFavorites(userId: Types.ObjectId | string): Promise<boolean>;
  // Get count of courses in this category
  getCourseCount(): Promise<number>;
}

export interface ICategory {
  // Core fields
  name: string;
  slug: string;
  description: string;
  image: string;
  icon: string;
  isActive: boolean;
  featured: boolean;
  parent: Types.ObjectId | null;
  
  // Metadata
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  
  // Virtuals
  readonly id: string;
  readonly coursesCount: number;
  readonly subcategories: ICategory[];
  readonly url: string;
}

export interface ICategoryModel extends Model<ICategory, {}, ICategoryMethods> {
  // Static methods
  findByName(name: string): Promise<ICategoryDocument[]>;
  findBySlug(slug: string): Promise<ICategoryDocument | null>;
  getFeaturedCategories(limit?: number): Promise<ICategoryDocument[]>;
  getPopularCategories(limit?: number): Promise<ICategoryDocument[]>;
  getCategoriesWithCourseCount(): Promise<Array<{
    category: ICategoryDocument;
    courseCount: number;
  }>>;
  getCategoryTree(): Promise<Array<ICategoryDocument & { children: ICategory[] }>>;
}

// Document type with methods
export type ICategoryDocument = Document<unknown, {}, ICategory> & 
  Omit<ICategory, keyof Document> & 
  ICategoryMethods & {
    _id: Types.ObjectId;
  };

// Input Types for API
export interface CreateCategoryInput {
  name: string;
  description?: string;
  image?: string;
  icon?: string;
  parent?: string;
  isActive?: boolean;
  featured?: boolean;
}

export interface UpdateCategoryInput {
  id: string;
  name?: string;
  description?: string;
  image?: string;
  icon?: string;
  parent?: string | null;
  isActive?: boolean;
  featured?: boolean;
}

export interface CategoryQueryParams {
  search?: string;
  featured?: boolean;
  isActive?: boolean;
  parent?: string;
  sort?: string;
  limit?: number;
  page?: number;
}
