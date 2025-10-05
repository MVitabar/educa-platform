// Tipos para el dashboard del estudiante
export interface StudentDashboardStats {
  enrolledCourses: number;
  completedCourses: number;
  coursesInProgress: number;
  totalHoursWatched: number;
  completionRate: number;
  recentActivity: Array<{
    type: 'lesson' | 'quiz' | 'assignment';
    title: string;
    course: string;
    date: string; // ISO date
  }>;
}

export interface EnrolledCourse {
  id: string;
  title: string;
  description: string;
  image: string;
  instructor: string;
  progress: number; // 0-100
  completed: boolean;
  enrolledAt: string; // ISO date
  lastAccessed?: string; // ISO date
  completedAt?: string;  // ISO date
}

export interface RecentLesson {
  id: string;
  title: string;
  course: string;
  courseId: string;
  duration: number; // in minutes
  progress: number; // 0-100
  lastAccessed: string; // ISO date
  thumbnail?: string; // URL to image
  completed: boolean;
}

// Tipos para el dashboard del instructor
export interface InstructorDashboardStats {
  totalStudents: number;
  activeStudents: number; // Active in last 30 days
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  totalEarnings: number;
  monthlyEarnings: Array<{
    month: string; // "YYYY-MM"
    amount: number;
  }>;
  topCourses: Array<{
    id: string;
    title: string;
    enrollments: number;
    revenue: number;
    rating?: number; // 1-5
  }>;
}

export interface InstructorCourse {
  id: string;
  title: string;
  description: string;
  image: string;
  status: 'draft' | 'published' | 'archived';
  price: number;
  enrollments: number;
  revenue: number;
  rating?: number; // 1-5
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
}

export interface InstructorReview {
  id: string;
  courseId: string;
  courseTitle: string;
  studentName: string;
  studentAvatar?: string;
  rating: number; // 1-5
  comment?: string;
  createdAt: string; // ISO date
}

export interface StudentProgress {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  enrolledAt: string; // ISO date
  lastActive?: string; // ISO date
  progress: number; // 0-100
  completed: boolean;
  completedAt?: string; // ISO date
}
