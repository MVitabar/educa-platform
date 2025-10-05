"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  Users,
  BarChart3,
  Calendar,
  MessageSquare,
  Bell,
  Clock,
  TrendingUp,
  Award,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import {
  instructorService,
  DashboardStats,
  Course,
  Session,
} from "@/lib/api/instructorService";
import Image from "next/image";

export default function InstructorDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>(() => ({
    // Required properties
    totalStudents: 0,
    totalCourses: 0,
    activeSessions: 0,
    totalEarnings: 0,
    monthlyEarnings: 0,
    pendingReviews: 0,
    upcomingSessions: 0,

    // Optional properties with default values
    activeCourses: 0,
    totalEnrollments: 0,
    totalHoursTaught: 0,
    upcomingSessionsCount: 0,
    monthlyRevenue: 0,
    completionRate: 0,
    averageRating: 0,
  }));
  const [recentCourses, setRecentCourses] = useState<Course[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<Session[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);

        // Fetch data in parallel
        const [statsData, coursesData, sessionsData] = await Promise.all([
          instructorService.getDashboardStats(),
          instructorService.getRecentCourses(),
          instructorService.getUpcomingSessions(3),
        ]);

        setStats(statsData);
        setRecentCourses(coursesData);
        setUpcomingSessions(sessionsData);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
        // Aquí podrías mostrar un mensaje de error al usuario
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Función para formatear moneda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Función para formatear fechas
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    };
    return new Date(dateString).toLocaleDateString("es-AR", options);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["instructor"]}>
      <div className="space-y-8 p-4 sm:p-6">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
              Panel del Instructor
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400">
              Resumen de tu actividad
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/instructor/messages"
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all duration-200 flex items-center space-x-2"
            >
              <MessageSquare size={18} />
              <span>Mensajes</span>
            </Link>
            <button
              className="p-2.5 rounded-full bg-white dark:bg-gray-700 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 relative"
              aria-label="Notificaciones"
            >
              <Bell size={20} className="text-gray-600 dark:text-gray-300" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </div>

        {/* Tarjetas de estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Tarjeta de Cursos Activos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Cursos Activos
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.activeCourses}
                  <span className="ml-2 text-sm font-medium text-green-600 dark:text-green-400">
                    +2 este mes
                  </span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <BookOpen size={24} />
              </div>
            </div>
          </div>

          {/* Tarjeta de Estudiantes */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Estudiantes
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.totalStudents}
                  <span className="ml-2 text-sm font-medium text-green-600 dark:text-green-400">
                    +15%
                  </span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <Users size={24} />
              </div>
            </div>
          </div>

          {/* Tarjeta de Ingresos */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Ingresos (último mes)
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatCurrency(stats.monthlyRevenue ?? 0)}
                  <span className="ml-2 text-sm font-medium text-green-600 dark:text-green-400">
                    +12%
                  </span>
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <TrendingUp size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Cursos recientes */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Mis Cursos
              </h2>
              <Link
                href="/instructor/courses"
                className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
              >
                Ver todos <ChevronRight size={16} className="ml-1" />
              </Link>
            </div>
            <div className="space-y-4">
              {recentCourses.map((course, index) => {
                // Generate a unique key for each course
                const uniqueKey = course.id
                  ? `course-${course.id}`
                  : `course-${index}-${Date.now()}`;

                return (
                  <div
                    key={uniqueKey}
                    className="group p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-all duration-200 hover:border-primary-100 dark:hover:border-primary-900/50"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                            {course.imageUrl ? (
                              <Image
                                src={course.imageUrl}
                                width={48}
                                height={48}
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                                {course.title.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                              {course.title}
                            </h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                              {typeof course.category === "string"
                                ? course.category
                                : course.category.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center mt-3 text-sm text-gray-500 dark:text-gray-400 space-x-4">
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1.5 flex-shrink-0" />
                            <span>{course.studentsCount} estudiantes</span>
                          </span>
                          {course.nextSession && (
                            <span className="flex items-center">
                              <Clock className="h-4 w-4 mr-1.5 flex-shrink-0" />
                              <span>{course.nextSession}</span>
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end ml-4">
                        <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                          {course.progress}% completado
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Próximas sesiones */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Próximas Sesiones
              </h2>
              <Link
                href="/instructor/schedule"
                className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
              >
                Ver calendario <ChevronRight size={16} className="ml-1" />
              </Link>
            </div>
            <div className="space-y-4">
              {upcomingSessions.map((session, index) => {
                // Generate a more robust unique key using available session properties
                const uniqueKey = `session-${session.id || 'id'}-${session.startTime || index}-${Date.now()}`;
                
                return (
                <div
                  key={uniqueKey}
                  className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:shadow-sm transition-all duration-200 hover:border-primary-100 dark:hover:border-primary-900/50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {typeof session.course === "string"
                          ? session.course
                          : session.course.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {session.title}
                      </p>
                      <div className="flex items-center mt-2 text-sm text-gray-500 dark:text-gray-400 space-x-4">
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1.5 flex-shrink-0" />
                          <span>{formatDate(session.startTime)}</span>
                        </span>
                        <span>{session.studentsEnrolled} estudiantes</span>
                      </div>
                    </div>
                    <a
                      href={session.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 text-sm bg-primary-100 hover:bg-primary-200 dark:bg-primary-900/30 dark:hover:bg-primary-800/50 text-primary-700 dark:text-primary-300 rounded-md transition-colors duration-200 whitespace-nowrap"
                    >
                      Unirse
                    </a>
                  </div>
                </div>
              );
              })}
            </div>
          </div>
        </div>

        {/* Estadísticas adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Tasa de finalización
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white">
                  {Math.round((stats.completionRate ?? 0) * 100)}%
                  <span className="ml-2 text-sm font-medium text-green-600 dark:text-green-400">
                    +5%
                  </span>
                </p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  vs. mes anterior
                </p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
                <Award size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  Valoración promedio
                </p>
                <div className="flex items-baseline mt-1">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {stats.averageRating
                      ? stats.averageRating.toFixed(1)
                      : "0.0"}
                    /5
                  </p>
                  <span className="ml-2 text-sm font-medium text-green-600 dark:text-green-400">
                    +0.2
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  basado en 128 reseñas
                </p>
              </div>
              <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <BarChart3 size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
