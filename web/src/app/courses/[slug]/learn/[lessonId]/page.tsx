import { notFound, redirect } from 'next/navigation';
import { getLesson, getLessonsByCourse } from '@/lib/api/lessonService';
import { getCourseBySlug } from '@/lib/api/courseService';
import LessonContent from '@/components/courses/lesson/LessonContent';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { getSession } from '@/lib/auth';

export default async function LessonPage({ 
  params 
}: { 
  params: { slug: string; lessonId: string } 
}) {
  const session = await getSession();
  
  try {
    const [lesson, course] = await Promise.all([
      getLesson(params.lessonId),
      getCourseBySlug(params.slug)
    ]);

    if (!lesson || !course) {
      notFound();
    }

    // Redirigir si la lección no está publicada y el usuario no es el instructor
    const isInstructor = session?.user?.id === course.instructor._id;
    if (!lesson.isPublished && !isInstructor) {
      redirect(`/courses/${params.slug}`);
    }

    // Obtener todas las lecciones para la navegación
    const { data: lessons = [] } = await getLessonsByCourse(course._id);
    const currentIndex = lessons.findIndex(l => l._id === params.lessonId);
    const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;
    const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;

    return (
      <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        {/* Barra de navegación */}
        <header className="bg-white dark:bg-gray-800 shadow-sm">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href={`/courses/${params.slug}`} className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-lg font-medium text-gray-900 dark:text-white line-clamp-1">
                {course.title}
              </h1>
            </div>
              
            <div className="flex items-center space-x-2">
              {session?.user?.id === course.instructor._id && (
                <Link href={`/instructor/courses/${course._id}/lessons/${lesson._id}/edit`}>
                  <Button variant="outline" size="sm">
                    Editar lección
                  </Button>
                </Link>
              )}
              
              <Link href={`/courses/${params.slug}`}>
                <Button variant="outline" size="sm">
                  Volver al curso
                </Button>
              </Link>
              
              {nextLesson ? (
                <Link href={`/courses/${params.slug}/learn/${nextLesson._id}`}>
                  <Button size="sm">
                    Siguiente
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button disabled>
                  Última lección
                  <CheckCircle className="ml-2 h-4 w-4" />
                </Button>
              )}
              
              {!course.enrolled && (
                <Button asChild>
                  <Link href={`/courses/${course._id}/enroll`}>
                    Inscribirse al curso
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Contenido principal */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Información de la lección */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {lesson.title}
                </h2>
                
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                    <span>Duración: {Math.ceil(lesson.duration || 0)} min</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {lesson.isFree && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Gratis
                      </span>
                    )}
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      Por{' '}
                      <Link 
                        href={`/instructors/${course.instructor._id}`} 
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {course.instructor.name}
                      </Link>
                    </span>
                  </div>
                </div>

                <div className="prose dark:prose-invert max-w-none">
                  <LessonContent lesson={lesson} />

                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                    {prevLesson ? (
                      <Link 
                        href={`/courses/${params.slug}/learn/${prevLesson._id}`}
                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Lección anterior: {prevLesson.title}
                      </Link>
                    ) : (
                      <div></div>
                    )}
                    
                    {nextLesson ? (
                      <Link 
                        href={`/courses/${params.slug}/learn/${nextLesson._id}`}
                        className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 ml-auto"
                      >
                        Siguiente lección: {nextLesson.title}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    ) : (
                      <Link 
                        href={`/courses/${params.slug}/complete`}
                        className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                      >
                        Completar curso
                        <CheckCircle className="ml-2 h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error('Error loading lesson:', error);
    notFound();
  }
}
