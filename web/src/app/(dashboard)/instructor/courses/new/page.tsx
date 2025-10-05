'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import  CourseForm  from '@/components/forms/CourseForm';
import { Loader2 } from 'lucide-react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

// Componente para la página de creación de cursos
const NewCoursePage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Verificar si el usuario es un instructor
  useEffect(() => {
    const checkUserRole = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login?redirect=/instructor/courses/new');
          return;
        }

        // Verificar el rol del usuario
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('Error al verificar el usuario:', {
            status: response.status,
            statusText: response.statusText,
            errorData
          });
          throw new Error(errorData.message || 'No autorizado');
        }

        const userData = await response.json();
        const user = userData.data?.user || userData.data || userData;
        
        // Verificar si el usuario es un instructor o admin
        if (user.role !== 'instructor' && user.role !== 'admin') {
          toast.error('Solo los instructores pueden crear cursos');
          router.push('/dashboard');
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Error al verificar el rol del usuario:', error);
        toast.error('Error al verificar la autenticación');
        router.push('/login?redirect=/instructor/courses/new');
      } finally {
        setIsLoading(false);
      }
    };

    checkUserRole();
  }, [router]);

  // Función para manejar el envío exitoso del formulario
  const handleFormSubmitSuccess = () => {
    toast.success('Curso creado exitosamente');
    router.push('/instructor/courses');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Crear Nuevo Curso
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Completa la información básica de tu curso para comenzar.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="px-6 py-8">
          <CourseForm onSuccess={handleFormSubmitSuccess} />
        </div>
      </div>
    </div>
  );
};

// Envuelve el componente con el HOC de ruta protegida
export default function NewCoursePageWrapper() {
  return (
    <ProtectedRoute allowedRoles={['instructor', 'admin']}>
      <NewCoursePage />
    </ProtectedRoute>
  );
}
