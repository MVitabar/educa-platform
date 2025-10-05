'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Image from 'next/image';

interface Course {
  _id: string;
  id?: string;
  title: string;
  description: string;
  imageUrl?: string;
  price: number;
  isPublished: boolean;
  studentsCount: number;
  createdAt: string;
  updatedAt: string;
}

const InstructorCoursesPage = () => {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Obtener los cursos del instructor
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login?redirect=/instructor/courses');
          return;
        }

        setIsLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          // Mapeo de códigos de error a mensajes amigables
          const errorMessages: {[key: number]: string} = {
            401: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
            403: 'No tienes permiso para ver estos cursos.',
            404: 'No se encontraron cursos.',
            500: 'Error en el servidor. Por favor, intenta más tarde.'
          };
          
          const errorMessage = errorData.message || errorMessages[response.status] || 'Error al cargar los cursos';
          
          // Solo mostramos el toast si no es un 404 (que manejaremos en la UI)
          if (response.status !== 404) {
            toast.error(errorMessage);
          }
          
          // Si es 401, redirigir al login
          if (response.status === 401) {
            router.push('/login');
          }
          
          // En cualquier caso, establecemos un array vacío
          setCourses([]);
          return;
        }

        const data = await response.json();
        
        // Si no hay cursos, mostramos un array vacío
        if (!data || (Array.isArray(data) && data.length === 0) || 
            (typeof data === 'object' && (!data.courses || data.courses.length === 0))) {
          setCourses([]);
          return;
        }
        
        // Si hay datos, los asignamos al estado
        setCourses(Array.isArray(data) ? data : data.courses || []);
      } catch (error) {
        console.error('Error al cargar los cursos:', error);
        toast.error('Error de conexión. Por favor, verifica tu conexión e intenta nuevamente.');
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [router]);

  // Eliminar un curso
  const handleDeleteCourse = async (courseId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este curso? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      setIsDeleting(courseId);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar el curso');
      }

      // Actualizar la lista de cursos
      setCourses(courses.filter(course => course._id !== courseId));
      toast.success('Curso eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar el curso:', error);
      toast.error('Error al eliminar el curso');
    } finally {
      setIsDeleting(null);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mis Cursos</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Gestiona tus cursos y crea contenido para tus estudiantes.
          </p>
        </div>
        <Link
          href="/instructor/courses/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
          Nuevo Curso
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 shadow rounded-lg">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Aún no tienes cursos</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comienza creando tu primer curso para compartir tu conocimiento.
          </p>
          <div className="mt-6">
            <Link
              href="/instructor/courses/new"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Nuevo Curso
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {courses.map((course) => (
              <li key={course._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {course.imageUrl ? (
                        <Image
                          className="h-16 w-16 rounded-md object-cover"
                          src={course.imageUrl}
                          alt={course.title}
                        />
                      ) : (
                        <div className="h-16 w-16 rounded-md bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <span className="text-gray-400">
                            <svg
                              className="h-8 w-8"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                              />
                            </svg>
                          </span>
                        </div>
                      )}
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                            {course.title}
                          </h3>
                          {!course.isPublished && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              Borrador
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                          {course.description}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400">
                          <span>{course.studentsCount} estudiantes</span>
                          <span>•</span>
                          <span>Actualizado el {formatDate(course.updatedAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/courses/${course._id}`}
                        target="_blank"
                        className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
                      >
                        <EyeIcon className="-ml-1 mr-1.5 h-4 w-4" />
                        Ver
                      </Link>
                      <Link
                        href={`/instructor/courses/${course._id}/edit`}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-blue-900 dark:text-blue-100 dark:hover:bg-blue-800"
                      >
                        <PencilIcon className="-ml-1 mr-1.5 h-4 w-4" />
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDeleteCourse(course._id)}
                        disabled={isDeleting === course._id}
                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 dark:bg-red-900 dark:text-red-100 dark:hover:bg-red-800"
                      >
                        {isDeleting === course._id ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-1.5 h-4 w-4 text-red-700 dark:text-red-100" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Eliminando...
                          </>
                        ) : (
                          <>
                            <TrashIcon className="-ml-1 mr-1.5 h-4 w-4" />
                            Eliminar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// Envuelve el componente con el HOC de ruta protegida
export default function InstructorCoursesPageWrapper() {
  return (
    <ProtectedRoute allowedRoles={['instructor', 'admin']}>
      <InstructorCoursesPage />
    </ProtectedRoute>
  );
}
