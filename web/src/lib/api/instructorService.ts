import { apiClient } from './apiClient';

// Analytics types
export interface EnrollmentTrend {
  date: string;
  count: number;
}

export interface CompletionRate {
  completed: number;
  inProgress: number;
  notStarted: number;
}

export interface StudentActivity {
  date: string;
  activeStudents: number;
  completedLessons: number;
}

export interface RevenueData {
  month: string;
  amount: number;
  currency: string;
}

export interface CourseAnalytics {
  courseId: string;
  courseTitle: string;
  totalStudents: number;
  activeStudents: number;
  completionRate: number;
  averageProgress: number;
  totalRevenue: number;
  averageRating: number;
  ratingCount: number;
  enrollmentTrend: EnrollmentTrend[];
  completionRates: CompletionRate;
  studentActivity: StudentActivity[];
  revenueData: RevenueData[];
  lastUpdated: string;
}

// Student type
export interface Student {
  _id: string;
  id?: string;
  name: string;
  email: string;
  avatar?: string;
  enrolledAt: string;
  progress?: number;
  completedLessons?: number;
  totalLessons?: number;
}

// API response with data
export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data: T;
  status?: number;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Custom error class for API errors
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Category type for courses
export interface CourseCategory {
  _id: string;
  name: string;
  slug?: string;
  image?: string;
  icon?: string;
}

// Base interface for Course from API
export interface CourseBase {
  _id: string;
  title: string;
  description: string;
  instructor: string | { _id: string; name: string };
  category: string | { _id: string; name: string };
  price: number;
  imageUrl?: string;
  studentsCount?: number;
  progress?: number;
  nextSession?: string;
  rating?: number;
  totalHours?: number;
  level?: 'beginner' | 'intermediate' | 'advanced';
  isPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Extended interface for frontend with id alias
export interface Course extends Omit<CourseBase, '_id'> {
  id: string;
  _id?: string; // Keep _id as optional for backward compatibility
}

// Base interface for Session from API
export interface SessionBase {
  _id: string;
  course: string | { _id: string; title: string };
  title: string;
  description: string;
  startTime: string;
  endTime?: string; // Added missing endTime property
  duration: number; // en minutos
  type: 'live' | 'workshop' | 'qa';
  meetingLink?: string;
  studentsEnrolled: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

// Extended interface for frontend with id alias
export interface Session extends Omit<SessionBase, '_id'> {
  id: string;
  _id?: string; // Keep _id as optional for backward compatibility
  
  // Update course type to include id when it's an object
  course: string | { 
    _id: string;
    id: string;
    title: string; 
  };
}

export interface DashboardStats {
  // Required properties
  totalStudents: number;
  totalCourses: number;
  activeSessions: number;
  totalEarnings: number;
  monthlyEarnings: number;
  pendingReviews: number;
  upcomingSessions: number;
  
  // Optional properties
  activeCourses?: number;
  monthlyRevenue?: number;
  completionRate?: number;
  averageRating?: number;
  totalHoursTaught?: number;
  upcomingSessionsCount?: number;
  totalEnrollments?: number; // Added missing property
}

class InstructorService {
  // Default stats to return in case of error
  private getDefaultStats(): DashboardStats {
    return {
      totalStudents: 0,
      totalCourses: 0,
      activeSessions: 0,
      totalEarnings: 0,
      monthlyEarnings: 0,
      pendingReviews: 0,
      upcomingSessions: 0
    };
  }
  // Obtener estadísticas del dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      return await apiClient.get<DashboardStats>('/dashboard/instructor/stats') || this.getDefaultStats();
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching dashboard stats:', error.message);
      } else {
        console.error('Unknown error fetching dashboard stats');
      }
      return this.getDefaultStats();
    }
  }

  // Transforma un curso base a la interfaz Course
  private transformCourse(course: CourseBase): Course {
    const instructor = typeof course.instructor === 'string' 
      ? course.instructor 
      : course.instructor?._id ? { _id: course.instructor._id, name: course.instructor.name } 
        : { _id: '', name: '' };
    const category = typeof course.category === 'string' 
      ? course.category 
      : course.category?._id ? { _id: course.category._id, name: course.category.name } 
        : { _id: '', name: '' };

    return {
      id: course._id,
      title: course.title,
      description: course.description,
      instructor,
      category,
      price: course.price,
      imageUrl: course.imageUrl || '',
      studentsCount: course.studentsCount || 0,
      progress: course.progress || 0,
      nextSession: course.nextSession || '',
      rating: course.rating || 0,
      totalHours: course.totalHours || 0,
      level: course.level || 'beginner',
      isPublished: course.isPublished || false,
      createdAt: course.createdAt || new Date().toISOString(),
      updatedAt: course.updatedAt || new Date().toISOString()
    } as Course;
  }

  // Obtener cursos recientes del instructor
  async getRecentCourses(limit: number = 3): Promise<Course[]> {
    try {
      const response = await apiClient.get<CourseBase[]>(
        '/dashboard/instructor/courses/recent',
        { params: { limit } }
      );
      return Array.isArray(response) 
        ? response.map((course: CourseBase) => this.transformCourse(course))
        : [];
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching recent courses:', error.message);
      } else {
        console.error('Unknown error fetching recent courses');
      }
      return [];
    }
  }

  // Transforma una sesión base a la interfaz Session
  private transformSession(session: SessionBase): Session {
    const course = typeof session.course === 'string' 
      ? { _id: session.course, id: session.course, title: '' }
      : { 
          _id: session.course?._id || '', 
          id: session.course?._id || '', 
          title: session.course?.title || '' 
        };

    // Handle end time with type safety
    const startTime = new Date(session.startTime);
    const sessionWithEndTime = session as SessionBase & { endTime?: string };
    const endTime = sessionWithEndTime.endTime 
      ? new Date(sessionWithEndTime.endTime)
      : new Date(startTime.getTime() + (session.duration || 60) * 60000);

    return {
      id: session._id,
      _id: session._id,
      title: session.title,
      description: session.description || '',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      course,
      meetingUrl: session.meetingLink || '',
      status: session.status || 'scheduled',
      participants: [],
      duration: session.duration || 60,
      type: session.type || 'live',
      studentsEnrolled: session.studentsEnrolled || 0
    } as unknown as Session;
  }

  // Obtener próximas sesiones
  async getUpcomingSessions(limit: number = 5): Promise<Session[]> {
    try {
      const response = await apiClient.get<SessionBase[]>(
        '/dashboard/instructor/sessions/upcoming',
        { params: { limit } }
      );
      return Array.isArray(response)
        ? response.map((session: SessionBase) => this.transformSession(session))
        : [];
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching upcoming sessions:', error.message);
      } else {
        console.error('Unknown error fetching upcoming sessions');
      }
      return [];
    }
  }

  async getCourseStudents(
    courseId: string, 
    options: { page?: number; limit?: number } = {}
  ): Promise<{ students: Student[]; total: number }> {
    try {
      const { page = 1, limit = 10 } = options;
      return await apiClient.get<{ students: Student[]; total: number }>(
        `/instructor/courses/${courseId}/students`,
        { params: { page, limit } }
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching course students:', error.message);
      } else {
        console.error('Unknown error fetching course students');
      }
      return { students: [], total: 0 };
    }
  }

  // Obtener análisis de un curso
  async getCourseAnalytics(courseId: string): Promise<CourseAnalytics> {
    try {
      return await apiClient.get<CourseAnalytics>(
        '/instructor/analytics',
        { params: { courseId } }
      ) || this.getDefaultAnalytics(courseId);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error fetching course analytics:', error.message);
      } else {
        console.error('Unknown error fetching course analytics');
      }
      return this.getDefaultAnalytics(courseId);
    }
  }

  private getDefaultAnalytics(courseId: string): CourseAnalytics {
    return {
      courseId,
      courseTitle: '',
      totalStudents: 0,
      activeStudents: 0,
      completionRate: 0,
      averageProgress: 0,
      totalRevenue: 0,
      averageRating: 0,
      ratingCount: 0,
      enrollmentTrend: [],
      completionRates: { completed: 0, inProgress: 0, notStarted: 0 },
      studentActivity: [],
      revenueData: [],
      lastUpdated: new Date().toISOString()
    };
  }
}

export const instructorService = new InstructorService();
