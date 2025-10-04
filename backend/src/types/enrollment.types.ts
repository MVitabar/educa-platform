import { Document, Model, Types } from 'mongoose';

export type EnrollmentStatus = 
  | 'pending'       // Enrollment created but payment not completed
  | 'active'        // Enrollment is active and in progress
  | 'completed'     // Course completed successfully
  | 'paused'        // Enrollment is temporarily paused
  | 'cancelled'     // Enrollment was cancelled
  | 'expired'       // Enrollment expired (trial or time-based access)
  | 'refunded';     // Enrollment was refunded

export type PaymentStatus = 
  | 'pending'       // Payment initiated but not completed
  | 'authorized'    // Payment authorized but not captured
  | 'paid'          // Payment completed successfully
  | 'failed'        // Payment failed
  | 'refunded'      // Payment was refunded
  | 'partially_refunded' // Partial refund was issued
  | 'voided';       // Payment was voided

export type BillingCycle = 
  | 'one_time'      // One-time payment
  | 'monthly'       // Monthly subscription
  | 'quarterly'     // Quarterly subscription
  | 'yearly';       // Annual subscription

export interface IPaymentInfo {
  // Payment Details
  amount: number;               // Amount in the smallest currency unit (e.g., cents)
  currency: string;             // ISO currency code (e.g., 'USD', 'EUR')
  paymentMethod: string;        // Payment method ID or type (e.g., 'credit_card', 'paypal')
  paymentProvider: string;      // Payment provider (e.g., 'stripe', 'paypal')
  transactionId?: string;       // External transaction ID
  invoiceId?: string;           // Invoice/receipt number
  
  // Status & Timing
  status: PaymentStatus;
  paidAt?: Date;                // When payment was completed
  refundedAt?: Date;            // When refund was issued
  nextBillingDate?: Date;       // For subscriptions
  
  // Subscription Details (if applicable)
  isSubscription: boolean;      // Whether this is a subscription
  billingCycle?: BillingCycle;  // Billing frequency
  trialPeriodDays?: number;     // Trial period in days
  trialEndsAt?: Date;           // When trial period ends
  
  // Metadata
  metadata?: Record<string, any>; // Additional payment metadata
  notes?: string;               // Internal notes about the payment
}

export interface IEnrollmentProgress {
  lesson: Types.ObjectId;      // Reference to the lesson
  completed: boolean;          // Whether the lesson is completed
  progress: number;            // Progress percentage for this lesson (0-100)
  lastAccessed: Date;          // Last time the user accessed this lesson
  completedAt?: Date;          // When the lesson was completed
  quizScore?: number;          // Quiz score if applicable
  quizAttempts: number;        // Number of quiz attempts
  notes?: string;             // User's notes for this lesson
}

export interface ICertificate {
  certificateId: string;      // Unique certificate identifier
  issuedAt: Date;             // When the certificate was issued
  downloadUrl: string;        // URL to download the certificate
  verificationCode: string;   // Unique code to verify the certificate
  metadata?: Record<string, any>; // Additional certificate data
}

export interface IEnrollmentMethods {
  // Progress Tracking
  updateProgress(lessonId: Types.ObjectId | string, progress: number): Promise<boolean>;
  completeLesson(lessonId: Types.ObjectId | string): Promise<boolean>;
  calculateOverallProgress(): Promise<number>;
  
  // Certificate Management
  generateCertificate(): Promise<ICertificate>;
  revokeCertificate(reason: string): Promise<boolean>;
  
  // Payment & Access
  hasAccess(): Promise<boolean>;
  requestRefund(reason: string): Promise<boolean>;
  cancelEnrollment(reason: string): Promise<boolean>;
  
  // Status Management
  markAsCompleted(): Promise<boolean>;
  pauseEnrollment(reason: string): Promise<boolean>;
  resumeEnrollment(): Promise<boolean>;
}

export interface IEnrollment extends Document, IEnrollmentMethods {
  // Relationships
  student: Types.ObjectId;     // Reference to User
  course: Types.ObjectId;      // Reference to Course
  
  // Enrollment Details
  enrollmentId: string;        // Public enrollment ID
  status: EnrollmentStatus;
  enrolledAt: Date;
  startsAt?: Date;             // When the enrollment becomes active
  endsAt?: Date;              // When the enrollment expires (for time-limited access)
  completedAt?: Date;         // When the course was completed
  lastAccessed?: Date;        // Last time the user accessed the course
  
  // Progress Tracking
  progress: number;           // Overall progress (0-100)
  completedLessons: Types.ObjectId[]; // References to completed lessons
  lessonProgress: IEnrollmentProgress[]; // Detailed progress per lesson
  
  // Certificate
  certificate?: ICertificate;
  
  // Payment Information
  payment: IPaymentInfo;
  
  // Metadata
  metadata?: Record<string, any>;
  notes?: string;             // Internal notes about the enrollment
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Virtuals
  readonly id: string;
  readonly isActive: boolean;
  readonly daysEnrolled: number;
  readonly completionRate: number;
  
  // Methods from IEnrollmentMethods are included via extension
}

export interface IEnrollmentModel extends Model<IEnrollment, {}, IEnrollmentMethods> {
  // Static Methods
  findByStudent(studentId: Types.ObjectId | string): Promise<IEnrollment[]>;
  findByCourse(courseId: Types.ObjectId | string): Promise<IEnrollment[]>;
  findByStatus(status: EnrollmentStatus): Promise<IEnrollment[]>;
  findActiveEnrollments(courseId?: Types.ObjectId | string): Promise<IEnrollment[]>;
  findCompletedEnrollments(courseId?: Types.ObjectId | string): Promise<IEnrollment[]>;
  
  // Analytics
  getEnrollmentStats(courseId?: Types.ObjectId | string): Promise<{
    total: number;
    active: number;
    completed: number;
    cancelled: number;
    averageProgress: number;
    completionRate: number;
  }>;
  
  // Batch Operations
  updateExpiredEnrollments(): Promise<number>;
  sendReminderEmails(daysBeforeExpiry: number): Promise<number>;
}

// Input Types for API
export type CreateEnrollmentInput = Omit<
  IEnrollment,
  | 'enrolledAt'
  | 'status'
  | 'progress'
  | 'completedLessons'
  | 'lessonProgress'
  | 'certificate'
  | 'createdAt'
  | 'updatedAt'
  | keyof Document
  | keyof IEnrollmentMethods
> & {
  student: string;
  course: string;
  payment: Omit<IPaymentInfo, 'paidAt' | 'status'> & {
    status?: PaymentStatus; // Make status optional with default
  };
  couponCode?: string;
};

export type UpdateEnrollmentInput = Partial<Omit<CreateEnrollmentInput, 'student' | 'course'>> & {
  id: string;
  status?: EnrollmentStatus;
  progress?: number;
  addCompletedLesson?: string; // Lesson ID to mark as completed
  removeCompletedLesson?: string; // Lesson ID to unmark as completed
  paymentStatus?: PaymentStatus; // Update just the payment status
};

export type EnrollmentQueryParams = {
  studentId?: string;
  courseId?: string;
  status?: EnrollmentStatus | EnrollmentStatus[];
  paymentStatus?: PaymentStatus;
  minProgress?: number;
  maxProgress?: number;
  startDate?: string; // ISO date string
  endDate?: string;   // ISO date string
  sort?: string;
  limit?: number;
  page?: number;
  include?: string[]; // e.g., ['student', 'course', 'certificate']
};

// For enrollment responses (with populated data)
export type EnrollmentResponse = Omit<IEnrollment, keyof IEnrollmentMethods> & {
  student?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  course?: {
    id: string;
    title: string;
    image?: string;
    instructor?: {
      id: string;
      name: string;
    };
  };
  certificate?: ICertificate & {
    isValid: boolean;
  };
  nextLesson?: {
    id: string;
    title: string;
    order: number;
  };
};
