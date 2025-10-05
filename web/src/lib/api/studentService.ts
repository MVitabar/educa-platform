// web/src/lib/api/studentService.ts
import apiClient from './apiClient';

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  joinDate: string;
  lastActive: string;
  bio?: string;
  skills?: string[];
}

export interface DashboardStats {
  enrolledCourses: number;
  completedCourses: number;
  coursesInProgress: number;
  totalHoursWatched: number;
  completionRate: number;
  recentActivity: Array<{
    type: 'lesson' | 'quiz' | 'assignment';
    title: string;
    course: string;
    date: string;
  }>;
}

export interface EnrolledCourse {
  id: string;
  title: string;
  description: string;
  image: string;
  instructor: string;
  progress: number;
  completed: boolean;
  enrolledAt: string;
  lastAccessed?: string;
  completedAt?: string;
}

export interface RecentLesson {
  id: string;
  title: string;
  course: string;
  courseId: string;
  duration: number;
  progress: number;
  lastAccessed: string;
  thumbnail?: string;
  completed: boolean;
}

class StudentService {
  async getStudentProfile(): Promise<StudentProfile> {
    try {
      // First try the current user endpoint, then fall back to the dashboard
      try {
        const response = await apiClient.get<{ data: StudentProfile }>('/auth/me');
        return response.data;
      } catch (fallbackError) {
        console.log('Falling back to /me/dashboard endpoint', fallbackError);
        const response = await apiClient.get<{ data: StudentProfile }>('/me/dashboard');
        return response.data;
      }
    } catch (error) {
      console.error('Error al obtener el perfil del estudiante:', error);
      // Try to get basic user info from localStorage as fallback
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          return JSON.parse(userData);
        } catch (e) {
          console.error('Error parsing user data from localStorage:', e);
        }
      }
      throw error;
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get dashboard summary from the backend
      const response = await apiClient.get<DashboardStats>('/api/dashboard/me/dashboard');
      return response;
    } catch (error) {
      console.error('Error al obtener las estadísticas del dashboard:', error);
      // Fallback to default data if the API call fails
      console.warn('Using fallback dashboard data due to API error');
      return {
        enrolledCourses: 0,
        completedCourses: 0,
        coursesInProgress: 0,
        totalHoursWatched: 0,
        completionRate: 0,
        recentActivity: []
      };
    }
  }

  async getEnrolledCourses(params: {
    status?: 'all' | 'in-progress' | 'completed' | 'not-started';
    limit?: number;
    sort?: 'recent' | 'title' | 'progress';
  } = {}): Promise<EnrolledCourse[]> {
    try {
      let endpoint = '/api/dashboard/me/courses/active';
      
      if (params.status === 'completed') {
        endpoint = '/api/dashboard/me/courses/completed';
      } else if (params.status === 'all') {
        // If 'all' is requested, fetch both active and completed courses
        const [activeCourses, completedCourses] = await Promise.all([
          apiClient.get<EnrolledCourse[]>('/api/dashboard/me/courses/active').catch(() => []),
          apiClient.get<EnrolledCourse[]>('/api/dashboard/me/courses/completed').catch(() => [])
        ]);
        
        // Combine and deduplicate courses
        const allCourses = [...(Array.isArray(activeCourses) ? activeCourses : []),
                          ...(Array.isArray(completedCourses) ? completedCourses : [])];
        
        // Apply sorting if specified
        if (params.sort) {
          return this.sortCourses(allCourses, params.sort);
        }
        return allCourses;
      }
      
      const response = await apiClient.get<EnrolledCourse[]>(endpoint);
      let courses = Array.isArray(response) ? response : [];
      
      // Apply sorting if specified
      if (params.sort) {
        courses = this.sortCourses(courses, params.sort);
      }
      
      // Apply limit if specified
      if (params.limit) {
        return courses.slice(0, params.limit);
      }
      
      return courses;
    } catch (error) {
      console.error('Error al obtener los cursos del estudiante:', error);
      return [];
    }
  }
  
  private sortCourses(courses: EnrolledCourse[], sortBy: string): EnrolledCourse[] {
    return [...courses].sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'progress':
          return b.progress - a.progress;
        default:
          return 0;
      }
    });
  }

  async getRecentLessons(limit: number = 5): Promise<RecentLesson[]> {
    try {
      const response = await apiClient.get<Array<{
        id: string;
        title: string;
        course: string;
        courseId: string;
        dueDate: string;
        type: 'lesson' | 'quiz' | 'assignment';
        duration?: number;
        progress?: number;
        thumbnail?: string;
      }>>('/api/dashboard/me/upcoming-deadlines', {
        params: { limit }
      });

      return (Array.isArray(response) ? response : []).map(item => ({
        id: item.id,
        title: item.title,
        course: item.course,
        courseId: item.courseId,
        duration: item.duration || 0,
        progress: item.progress || 0,
        lastAccessed: item.dueDate,
        completed: false,
        thumbnail: item.thumbnail
      }));
    } catch (error) {
      console.error('Error al obtener las lecciones recientes:', error);
      return [];
    }
  }
}
const studentService = new StudentService();
export default studentService;