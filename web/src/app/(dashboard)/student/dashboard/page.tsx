'use client';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useState, useEffect, useCallback } from 'react';
import { BookOpen, BarChart, Clock, Award, MessageSquare, Bell, Calendar } from 'lucide-react';
import Image from 'next/image';
import studentService, { 
  DashboardStats, 
  EnrolledCourse, 
  RecentLesson
} from '@/lib/api/studentService';

type StatCard = {
  id: string;
  name: string;
  value: string | number;
  icon: React.ElementType;
  change?: string;
  changeType?: 'increase' | 'decrease';
  description?: string;
};

export default function StudentDashboard() {
  interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  }

  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [recentLessons, setRecentLessons] = useState<RecentLesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Iniciando carga de datos del dashboard...');
      
      // Obtener datos del perfil, estadísticas, cursos y tareas en paralelo
      const [profileData, statsData, coursesData, lessonsData] = await Promise.all([
        studentService.getStudentProfile(),
        studentService.getDashboardStats(),
        studentService.getEnrolledCourses(),
        studentService.getRecentLessons()
      ]);

      console.log('Datos recibidos del backend:', {
        profileData,
        statsData,
        coursesData,
        lessonsData
      });

      // Verificar si los datos son válidos
      if (!profileData || !statsData || !coursesData || !lessonsData) {
        console.warn('Algunos datos del backend están vacíos o son nulos');
      }

      setUser(profileData);
      setStats(statsData);
      setEnrolledCourses(coursesData);
      setRecentLessons(lessonsData);
      
      console.log('Datos actualizados en el estado');
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Error al cargar los datos del dashboard. Por favor, intente de nuevo más tarde.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData().catch((error) => {
      console.error('Error in fetchDashboardData:', error);
    });
  }, [fetchDashboardData]);

  // Datos para las tarjetas de estadísticas
  const statCards: StatCard[] = [
    { 
      id: 'enrolled', 
      name: 'Cursos Inscritos', 
      value: stats?.enrolledCourses?.toString() || '0',
      icon: BookOpen,
      description: 'Total de cursos'
    },
    { 
      id: 'in-progress',
      name: 'En Progreso', 
      value: stats?.coursesInProgress?.toString() || '0',
      icon: Clock,
      description: 'Cursos activos',
      change: stats?.coursesInProgress ? `${Math.floor(Math.random() * 5)}` : undefined,
      changeType: 'increase'
    },
    {
      id: 'completed',
      name: 'Completados',
      value: stats?.completedCourses?.toString() || '0',
      icon: Award,
      description: 'Cursos finalizados'
    },
    { 
      id: 'hours',
      name: 'Horas de Estudio', 
      value: stats?.totalHoursWatched?.toString() || '0',
      icon: BarChart,
      description: 'Total acumulado',
      change: stats?.totalHoursWatched ? `+${Math.floor(Math.random() * 5)}h` : undefined,
      changeType: 'increase'
    }
  ];

  
  if (isLoading) {
    return (
      <ProtectedRoute allowedRoles={['student']}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error) {
    return (
      <ProtectedRoute allowedRoles={['student']}>
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg p-6 text-center">
          <div className="text-red-600 dark:text-red-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 dark:text-red-200 mb-2">Error al cargar el dashboard</h3>
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors duration-200"
          >
            Reintentar
          </button>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['student']}>
      <div className="space-y-8">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Hola, {user?.name || user?.name || 'Estudiante'}
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2">
              <MessageSquare size={18} />
              <span>Mensajes</span>
            </button>
            <button className="p-2 rounded-full bg-white dark:bg-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200">
              <Bell size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => (
            <div key={stat.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                    {stat.value}
                    {stat.change && (
                      <span className={`ml-2 text-sm font-medium ${
                        stat.changeType === 'increase' 
                          ? 'text-green-600 dark:text-green-400' 
                          : 'text-red-600 dark:text-red-400'
                      }`}>
                        {stat.change}
                      </span>
                    )}
                  </p>
                  {stat.description && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{stat.description}</p>
                  )}
                </div>
                <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                  <stat.icon size={24} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cursos Inscritos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mis Cursos</h2>
              <button className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                Ver todos
              </button>
            </div>
            <div className="space-y-4">
              {enrolledCourses.length > 0 ? (
                enrolledCourses.slice(0, 3).map((enrollment) => (
                  <div key={enrollment.id} className="group p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">{enrollment.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Por {enrollment.instructor}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full" 
                            style={{ width: `${enrollment.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12 text-right">
                          {Math.round(enrollment.progress || 0)}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      Inscrito el: {new Date(enrollment.enrolledAt).toLocaleDateString('es-ES')}
                      {enrollment.completedAt && (
                        <span className="ml-2 text-green-600 dark:text-green-400">
                          Completado el {new Date(enrollment.completedAt).toLocaleDateString('es-ES')}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No estás inscrito en ningún curso</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Explora nuestros cursos y comienza a aprender algo nuevo hoy.
                  </p>
                  <div className="mt-6">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Explorar cursos
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Últimas Lecciones */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Últimas Lecciones</h2>
              <button className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
                Ver todas
              </button>
            </div>
            <div className="space-y-4">
              {recentLessons.length > 0 ? (
                recentLessons.map((lesson) => (
                  <div key={lesson.id} className="p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-shadow duration-200">
                    <div className="flex items-start space-x-4">
                      {lesson.thumbnail ? (
                        <div className="relative h-16 w-16 flex-shrink-0">
                          <Image 
                            src={lesson.thumbnail} 
                            alt={lesson.title}
                            fill
                            className="rounded-md object-cover"
                            sizes="64px"
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-md bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 flex-shrink-0">
                          <BookOpen size={24} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">{lesson.title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {lesson.course} • {Math.round(lesson.duration)} min
                        </p>
                        <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-primary-600 h-2 rounded-full" 
                            style={{ width: `${lesson.progress}%` }}
                            aria-valuenow={lesson.progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>{lesson.progress}% completado</span>
                          <span>Últ. vez: {new Date(lesson.lastAccessed).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay lecciones recientes</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Comienza un curso para ver tus lecciones recientes aquí.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sección de Actividad Reciente */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Actividad Reciente</h2>
            <button className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300">
              Ver todo el historial
            </button>
          </div>
          <div className="space-y-4">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity: { type: string; title: string; course: string; date: string }, index: number) => (
                <div key={index} className="flex items-start pb-4 border-b border-gray-100 dark:border-gray-700 last:border-0 last:pb-0 last:mb-0">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 mr-3">
                    {activity.type === 'lesson' ? (
                      <BookOpen size={20} />
                    ) : activity.type === 'quiz' ? (
                      <BarChart size={20} />
                    ) : (
                      <Award size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {activity.course} • {new Date(activity.date).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay actividad reciente</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Tu actividad aparecerá aquí cuando comiences a interactuar con los cursos.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
