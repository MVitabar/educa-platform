"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  StarIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import Link from "next/link";
import Image from "next/image";
import { CourseResponse } from "@/types/course";

const InstructorCoursesPage = () => {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Obtener los cursos del instructor
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login?redirect=/instructor/courses");
          return;
        }

        setIsLoading(true);
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/dashboard/instructor/courses`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMessages: { [key: number]: string } = {
            401: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
            403: "No tienes permiso para ver estos cursos.",
            404: "No se encontraron cursos.",
            500: "Error en el servidor. Por favor, intenta más tarde.",
          };

          const errorMessage =
            errorData.message ||
            errorMessages[response.status] ||
            "Error al cargar los cursos";

          if (response.status !== 404) {
            toast.error(errorMessage);
          }

          if (response.status === 401) {
            router.push("/login");
          }

          setCourses([]);
          return;
        }

        const data = await response.json();
        console.log("Respuesta del servidor:", data);

        if (
          !data ||
          (Array.isArray(data) && data.length === 0) ||
          (typeof data === "object" && !data.courses && !data.data)
        ) {
          console.log("No se encontraron cursos o la respuesta está vacía");
          setCourses([]);
          return;
        }

        // Intentar diferentes estructuras de respuesta
        let coursesData = [];
        if (Array.isArray(data)) {
          coursesData = data;
        } else if (data.courses) {
          coursesData = data.courses;
        } else if (data.data && Array.isArray(data.data)) {
          coursesData = data.data;
        } else if (data.data && data.data.courses) {
          coursesData = data.data.courses;
        }

        console.log("Cursos extraídos:", coursesData);
        setCourses(coursesData || []);
      } catch (error) {
        console.error("Error al cargar los cursos:", error);
        toast.error(
          "Error de conexión. Por favor, verifica tu conexión e intenta nuevamente."
        );
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, [router]);
  const getRatingDisplay = (course: CourseResponse) => {
    if (
      !course.rating ||
      course.rating.average === undefined ||
      course.rating.count === undefined
    ) {
      return "Sin calificaciones";
    }
    return `${course.rating.average.toFixed(1)} (${course.rating.count})`;
  };

  const getTags = (tags?: string[]) => {
    if (!tags || !Array.isArray(tags)) return [];
    return tags;
  };
  // Eliminar un curso
  const handleDeleteCourse = async (courseId: string) => {
    if (
      !window.confirm(
        "¿Estás seguro de que deseas eliminar este curso? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }

    try {
      setIsDeleting(courseId);
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Error al eliminar el curso");
      }

      setCourses(courses.filter((course) => course._id !== courseId));
      toast.success("Curso eliminado correctamente");
    } catch (error) {
      console.error("Error al eliminar el curso:", error);
      toast.error("Error al eliminar el curso");
    } finally {
      setIsDeleting(null);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string | { $date: string } | undefined) => {
    if (!dateString) return "N/A";
    const date = typeof dateString === "string" ? dateString : dateString.$date;
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Obtener la URL de la imagen del curso
  const getImageUrl = (imagePath: string) => {
    if (!imagePath) return "/images/course-placeholder.jpg";
    if (imagePath.startsWith("http")) return imagePath;
    return `${process.env.NEXT_PUBLIC_API_URL}/uploads/${imagePath}`;
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mis Cursos
          </h1>
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
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Aún no tienes cursos
          </h3>
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
        <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {courses.map((course, index) => {
              // Create a more robust key that combines _id and index
              const uniqueKey = course?._id ? `course-${course._id}` : `course-${index}-${Date.now()}`;
              
              return (
                <li
                  key={uniqueKey}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <Image
                          className="h-20 w-32 rounded-md object-cover"
                          src={getImageUrl(course.image)}
                          alt={course.title}
                          width={128}
                          height={80}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                            {course.title}
                          </h3>
                          {course.isFeatured && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100">
                              Destacado
                            </span>
                          )}
                          {!course.isPublished && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                              Borrador
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span className="truncate">{course.category}</span>
                          <span className="mx-2">•</span>
                          <span>{course.level}</span>
                          <span className="mx-2">•</span>
                          <div className="flex items-center">
                            <StarIcon className="h-4 w-4 text-yellow-400" />
                            <span className="ml-1">
                              {getRatingDisplay(course)}
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {getTags(course.tags)
                            .slice(0, 3)
                            .map((tag, index) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                              >
                                {tag}
                              </span>
                            ))}
                          {getTags(course.tags).length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                              +{getTags(course.tags).length - 3} más
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-0 sm:ml-4 flex flex-col sm:items-end space-y-2">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <div>
                          Precio:{" "}
                          {course.isFree ? "Gratis" : `$${course.price}`}
                        </div>
                        <div>Actualizado: {formatDate(course.updatedAt)}</div>
                      </div>
                      <div className="flex space-x-2">
                        <Link
                          href={`/instructor/courses/${course._id}/edit`}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Editar
                        </Link>
                        <Link
                          href={`/courses/${course.slug}`}
                          target="_blank"
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
                        >
                          Ver
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDeleteCourse(course._id)}
                          disabled={isDeleting === course._id}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isDeleting === course._id ? (
                            "Eliminando..."
                          ) : (
                            <>
                              <TrashIcon className="h-4 w-4 mr-1" />
                              Eliminar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
              );
            })}

          </ul>
        </div>
      )}
    </div>
  );
};

export default InstructorCoursesPage;
