import { getAccessToken } from '@/lib/auth';
import { Section, SectionFormValues } from '@/types/section';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
console.log('API URL:', API_URL); // Debug log

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

// Helper for API requests
const apiRequest = async <T>(
  url: string, 
  options: RequestInit = {}
): Promise<T> => {
  console.group(`=== API Request: ${options.method || 'GET'} ${url} ===`);
  
  try {
    console.log('Fetching access token...');
    const token = await getAccessToken();
    
    if (!token) {
      const error = new Error('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
      console.error('Authentication error:', error.message);
      throw error;
    }
    
    console.log('Token retrieved successfully');
    
    const requestUrl = `${API_URL}${url}`;
    console.log('Request URL:', requestUrl);
    console.log('Request options:', {
      method: options.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer [TOKEN_REDACTED]',
        ...(options.headers || {})
      },
      body: options.body ? JSON.parse(options.body as string) : undefined
    });
    
    console.log('Sending request...');
    const startTime = Date.now();
    const response = await fetch(requestUrl, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {}),
      },
      credentials: 'include',
    });
    
    const endTime = Date.now();
    console.log(`Request completed in ${endTime - startTime}ms`);
    console.log('Response status:', response.status, response.statusText);

    // Handle 401 Unauthorized
    if (response.status === 401) {
      console.warn('Authentication required - redirecting to login');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('La sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }

    console.log('Parsing response...');
    let data: ApiResponse<T>;
    try {
      data = await response.json();
      console.log('Response data:', data);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      data = {
        success: false,
        message: 'Error al procesar la respuesta del servidor'
      };
    }

    if (!response.ok || !data.success) {
      const errorMessage = data.message || `Error en la solicitud: ${response.status} ${response.statusText}`;
      console.error('Request failed:', errorMessage);
      throw new Error(errorMessage);
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof Error) {
      console.error('API Error:', error.message);
      throw error;
    }
    throw new Error('Ocurrió un error inesperado');
  }
};
/**
 * Get all sections for a course
 * @param courseId - ID of the course
 * @returns Promise with array of sections
 */
export const getSectionsByCourse = async (courseId: string): Promise<Section[]> => {
  return apiRequest<Section[]>(`/courses/${courseId}/sections`, {
    method: 'GET',
  });
};

/**
 * Create a new section
 * @param courseId - ID of the course
 * @param data - Section data
 * @returns Promise with the created section
 */
export const createSection = async (
  courseId: string,
  data: SectionFormValues
): Promise<Section> => {
  console.log('Creating section with data:', { courseId, data });
  const result = await apiRequest<Section>(`/courses/${courseId}/sections`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  console.log('Section created successfully:', result);
  return result;
};

/**
 * Update a section
 * @param courseId - ID of the course
 * @param sectionId - ID of the section to update
 * @param data - Updated section data
 * @returns Promise with the updated section
 */
export const updateSection = async (
  courseId: string,
  sectionId: string,
  data: Partial<SectionFormValues>
): Promise<Section> => {
  return apiRequest<Section>(`/courses/${courseId}/sections/${sectionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Delete a section
 * @param courseId - ID of the course
 * @param sectionId - ID of the section to delete
 * @returns Promise that resolves when the section is deleted
 */
export const deleteSection = async (
  courseId: string,
  sectionId: string
): Promise<void> => {
  return apiRequest<void>(`/courses/${courseId}/sections/${sectionId}`, {
    method: 'DELETE',
  });
};

/**
 * Reorder sections
 * @param courseId - ID of the course
 * @param sections - Array of sections with their new order
 * @returns Promise that resolves when sections are reordered
 */
export const reorderSections = async (
  courseId: string,
  sections: Array<{ id: string; order: number }>
): Promise<void> => {
  return apiRequest<void>(`/courses/${courseId}/sections/reorder`, {
    method: 'PATCH',
    body: JSON.stringify({ sections }),
  });
};
