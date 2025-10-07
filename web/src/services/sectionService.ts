import { getAccessToken } from '@/lib/auth';
import { Section, SectionFormValues } from '@/types/section';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

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
  try {
    const token = await getAccessToken();
    
    if (!token) {
      throw new Error('No se encontró el token de autenticación. Por favor, inicia sesión nuevamente.');
    }
    
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
      credentials: 'include',
    });

    // Si recibimos un 401, el token es inválido o expiró
    if (response.status === 401) {
      // Limpiar la sesión para forzar un nuevo inicio de sesión
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      throw new Error('La sesión ha expirado. Por favor, inicia sesión nuevamente.');
    }

    const data: ApiResponse<T> = await response.json().catch(() => ({
      success: false,
      message: 'Error al procesar la respuesta del servidor'
    }));

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Error en la solicitud al servidor');
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
  return apiRequest<Section>(`/courses/${courseId}/sections`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
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
