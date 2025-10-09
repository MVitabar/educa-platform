import apiClient from './apiClient';

// Tipos para los datos de los cursos
export interface Course {
  _id: string;
  id?: string; // Para compatibilidad con código existente
  title: string;
  slug: string;
  description: string;
  price: number;
  image: string;
  instructor: {
    _id: string;
    id?: string; // Para compatibilidad con código existente
    name: string;
    avatar?: string;
  };
  rating?: number;
  average?: number; // Puntuación promedio
  studentsCount: number;
  totalLessons: number;
  duration: number; // in minutes
  level: 'beginner' | 'intermediate' | 'advanced';
  category: {
    _id: string;
    name: string;
  };
  learningOutcomes?: string[]; // Resultados de aprendizaje
  enrolled?: boolean; // Si el usuario actual está inscrito
  lessonsCount?: number; // Número total de lecciones
  createdAt: string;
  updatedAt: string;
}

export interface CourseWithProgress extends Course {
  progress: number; // 0-100
  lastAccessed?: string; // ISO date
  completed: boolean;
}

// Obtener un curso por su slug
export const getCourseBySlug = async (slug: string, token?: string): Promise<Course> => {
  const headers: Record<string, string> = {};
  
  // Add auth token if provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    // Try authenticated endpoint first if token is available
    if (token) {
      try {
        const response = await apiClient.axiosInstance.request<{ data: Course } | Course>({
          method: 'get',
          url: `/courses/slug/${slug}`,
          headers,
          validateStatus: (status: number) => status < 500
        });
        
        if (response.status >= 200 && response.status < 300) {
          const responseData = response.data;
          return (responseData as { data?: Course }).data || responseData as Course;
        }
      } catch (authError) {
        console.warn('Error fetching from authenticated endpoint, falling back to public:', authError);
      }
    }

    // Fall back to public endpoint
    try {
      const publicResponse = await apiClient.axiosInstance.request<{ data: Course[] } | Course[]>({
        method: 'get',
        url: '/courses',
        params: { 
          status: 'published',
          slug,
          isPublic: 'true',
          limit: 1
        },
        headers: {}
      });

      // Process public response
      const processPublicResponse = (data: Course[] | { data: Course | Course[] } | null | undefined): Course | undefined => {
        if (!data) return undefined;
        
        // Handle array response
        if (Array.isArray(data)) {
          return data[0]; // Return first match
        }
        
        // Handle { data: Course[] } or { data: Course }
        if (data && typeof data === 'object' && 'data' in data) {
          const responseData = data.data;
          return Array.isArray(responseData) ? responseData[0] : responseData;
        }
        
        return undefined;
      };

      const publicCourse = processPublicResponse(publicResponse.data);
      if (publicCourse) {
        return publicCourse;
      }
    } catch (publicError) {
      console.error('Error fetching from public endpoint:', publicError);
      throw new Error('No se pudo cargar el curso. Por favor, inténtalo de nuevo más tarde.');
    }
    
    // If we get here, the course was not found
    throw new Error('Curso no encontrado');
    
  } catch (error) {
    console.error('Error al obtener el curso:', error);
    throw error instanceof Error ? error : new Error('Error al cargar el curso');
  }
};

// Obtener cursos populares
export const getPopularCourses = async (limit = 6): Promise<Course[]> => {
  return apiClient.get<{ data: Course[] }>(`/courses/popular?limit=${limit}`).then(res => res.data);
};

// Obtener cursos por categoría
export const getCoursesByCategory = async (categoryId: string): Promise<Course[]> => {
  return apiClient.get<{ data: Course[] }>(`/courses?category=${categoryId}`).then(res => res.data);
};

// Buscar cursos
export const searchCourses = async (query: string): Promise<Course[]> => {
  return apiClient.get<{ data: Course[] }>(`/courses/search?q=${encodeURIComponent(query)}`).then(res => res.data);
};

// Obtener cursos del instructor
export const getInstructorCourses = async (instructorId: string): Promise<CourseWithProgress[]> => {
  return apiClient.get<{ data: CourseWithProgress[] }>(`/courses/instructor/${instructorId}`).then(res => res.data);
};

// Inscribirse a un curso
export const enrollInCourse = async (courseId: string): Promise<{ success: boolean; message?: string }> => {
  return apiClient.post<{ success: boolean; message?: string }>(`/courses/${courseId}/enroll`);
};
