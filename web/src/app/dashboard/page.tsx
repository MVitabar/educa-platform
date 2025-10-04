'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('No se pudo cargar la información del usuario');
        }

        const responseData = await response.json();
        // Asegurarse de que estamos accediendo correctamente a los datos del usuario
        if (responseData.data && responseData.data.user) {
          setUser(responseData.data.user);
        } else {
          throw new Error('Formato de respuesta inesperado');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar el dashboard');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-custom-4 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando tu panel de control...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
            </div>
          </div>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-custom-4 hover:bg-custom-5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-4"
          >
            Volver al inicio de sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Panel de Control</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {user?.name} (
                {user?.role === 'student' 
                  ? 'Estudiante' 
                  : user?.role === 'instructor' 
                    ? 'Profesor' 
                    : user?.role || 'Usuario'}
              )
            </span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm text-custom-4 hover:text-custom-5 font-medium"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg h-96 flex items-center justify-center">
            <div className="text-center">
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
                  strokeWidth={2}
                  d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Bienvenido a tu panel de control</h3>
              <p className="mt-1 text-sm text-gray-500">
                {user?.role === 'student' 
                  ? 'Aquí podrás ver tus cursos, calificaciones y más.'
                  : 'Gestiona tus cursos, estudiantes y contenido educativo.'}
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-custom-4 hover:bg-custom-5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-custom-4"
                >
                  {user?.role === 'student' ? 'Ver mis cursos' : 'Gestionar cursos'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
