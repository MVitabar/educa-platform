import { Document, Model, Types } from 'mongoose';

export type NotificationType = 
  | 'course_published'
  | 'course_enrolled'
  | 'course_completed'
  | 'lesson_completed'
  | 'announcement'
  | 'message'
  | 'system';

export type NotificationStatus = 'unread' | 'read' | 'archived';

export interface INotificationMethods {
  // Mark notification as read
  markAsRead(): Promise<boolean>;
  // Mark notification as unread
  markAsUnread(): Promise<boolean>;
  // Archive notification
  archive(): Promise<boolean>;
  // Check if notification is actionable
  isActionable(): boolean;
}

export interface INotification {
  // Core fields
  user: Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  
  // Optional references
  relatedCourse?: Types.ObjectId;
  relatedLesson?: Types.ObjectId;
  relatedUser?: Types.ObjectId;
  
  // Action data
  actionUrl?: string;
  actionText?: string;
  
  // Metadata
  isImportant: boolean;
  expiresAt?: Date;
  sentAt: Date;
  readAt?: Date;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Virtuals
  readonly id: string;
  readonly isRead: boolean;
  readonly isArchived: boolean;
  readonly isExpired: boolean;
}

export interface INotificationModel extends Model<INotification, {}, INotificationMethods> {
  // Static methods
  findByUser(
    userId: Types.ObjectId | string, 
    options?: {
      status?: NotificationStatus | 'all';
      limit?: number;
      skip?: number;
      type?: NotificationType;
      unreadOnly?: boolean;
    }
  ): Promise<INotificationDocument[]>;
  
  markAllAsRead(userId: Types.ObjectId | string): Promise<number>;
  
  createForUsers(
    userIds: (Types.ObjectId | string)[],
    notificationData: Omit<CreateNotificationInput, 'userId'>
  ): Promise<INotificationDocument[]>;
  
  createForCourse(
    courseId: Types.ObjectId | string,
    notificationData: Omit<CreateNotificationInput, 'userId' | 'relatedCourse'>
  ): Promise<number>;
  
  getUnreadCount(userId: Types.ObjectId | string): Promise<number>;
  
  cleanupExpired(): Promise<number>;
}

// Document type with methods
export type INotificationDocument = Document<unknown, {}, INotification> & 
  Omit<INotification, keyof Document> & 
  INotificationMethods & {
    _id: Types.ObjectId;
  };

// Input Types for API
export interface CreateNotificationInput {
  userId: string | Types.ObjectId;
  title: string;
  message: string;
  type: NotificationType;
  status?: NotificationStatus;
  relatedCourse?: string | Types.ObjectId;
  relatedLesson?: string | Types.ObjectId;
  relatedUser?: string | Types.ObjectId;
  actionUrl?: string;
  actionText?: string;
  isImportant?: boolean;
  expiresInDays?: number;
}

export interface UpdateNotificationInput {
  notificationId: string;
  status?: NotificationStatus;
  isImportant?: boolean;
  actionUrl?: string;
  actionText?: string;
}

export interface NotificationQueryParams {
  status?: NotificationStatus | 'all';
  type?: NotificationType;
  unreadOnly?: boolean;
  importantOnly?: boolean;
  limit?: number;
  page?: number;
  sort?: string;
}

// Types for notification preferences
export interface INotificationPreference {
  email: boolean;
  push: boolean;
  inApp: boolean;
}

export interface INotificationPreferences {
  course_published: INotificationPreference;
  course_enrolled: INotificationPreference;
  course_completed: INotificationPreference;
  lesson_completed: INotificationPreference;
  announcement: INotificationPreference;
  message: INotificationPreference;
  system: INotificationPreference;
}

// Default notification preferences
export const defaultNotificationPreferences: INotificationPreferences = {
  course_published: { email: true, push: true, inApp: true },
  course_enrolled: { email: true, push: true, inApp: true },
  course_completed: { email: true, push: true, inApp: true },
  lesson_completed: { email: false, push: true, inApp: true },
  announcement: { email: true, push: true, inApp: true },
  message: { email: true, push: true, inApp: true },
  system: { email: true, push: true, inApp: true }
};
