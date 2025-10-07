import { notFound } from 'next/navigation';
import { getCourseBySlug } from '@/lib/api/courseService';
import { getLessonsByCourse } from '@/lib/api/lessonService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, Play } from 'lucide-react';
import Link from 'next/link';

// Crear un componente Progress local temporal
function Progress({ value, className = '' }: { value: number; className?: string }) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 ${className}`}>
      <div 
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export default async function CourseCurriculumPage({ 
  params 
}: { 
  params: { slug: string } 
}) {
  try {
    const [course, { data: lessons }] = await Promise.all([
      getCourseBySlug(params.slug),
      getLessonsByCourse(params.slug)
    ]);

    if (!course) {
      notFound();
    }

    // Calcular el progreso total del curso
    const totalLessons = lessons.length;
    const completedLessons = lessons.filter(lesson => lesson.completed).length;
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Agrupar lecciones por sección
    const sections = lessons.reduce<Record<string, { title: string; lessons: typeof lessons }>>((acc, lesson) => {
      const sectionId = lesson.section._id;
      if (!acc[sectionId]) {
        acc[sectionId] = {
          title: lesson.section.title,
          lessons: []
        };
      }
      acc[sectionId].lessons.push(lesson);
      return acc;
    }, {});

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link 
            href={`/courses/${params.slug}`} 
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al curso
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                Contenido del curso: {course.title}
              </h1>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                Explora todas las lecciones disponibles en este curso
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {completedLessons} de {totalLessons} lecciones completadas
              </span>
              <div className="w-32">
                <Progress value={progress} className="h-2" />
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">
                {progress}%
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {Object.entries(sections).map(([sectionId, { title, lessons: sectionLessons }]) => (
            <Card key={sectionId} className="overflow-hidden">
              <CardHeader className="bg-gray-50 dark:bg-gray-800 px-6 py-4">
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {sectionLessons.map((lesson, index) => (
                    <li key={lesson._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <div className="flex items-center p-4">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 mr-4">
                          {lesson.completed ? (
                            <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                              <svg className="h-4 w-4 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                              {index + 1}
                            </span>
                          )}
                        </div>
                        
                        <div className="min-w-0 flex-1">
                          <h3 className={`text-sm font-medium ${lesson.completed ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-white'}`}>
                            {lesson.title}
                          </h3>
                          <div className="flex items-center mt-1 text-xs text-gray-500 dark:text-gray-400">
                            <Clock className="h-3.5 w-3.5 mr-1" />
                            <span>{Math.ceil(lesson.duration)} min</span>
                            {!lesson.isFree && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                Premium
                              </span>
                            )}
                            {lesson.videoUrl && (
                              <span className="ml-2 inline-flex items-center text-xs text-gray-500 dark:text-gray-400">
                                <Play className="h-3 w-3 mr-1" />
                                Video
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          <Link 
                            href={`/courses/${params.slug}/learn/${lesson._id}`}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            {lesson.completed ? 'Ver de nuevo' : 'Comenzar'}
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">¿Listo para comenzar?</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Empieza con la primera lección y avanza a tu propio ritmo.
              </p>
            </div>
            {lessons.length > 0 && (
              <Link 
                href={`/courses/${params.slug}/learn/${lessons[0]._id}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Play className="-ml-1 mr-2 h-4 w-4" />
                {progress === 0 ? 'Comenzar curso' : 'Continuar aprendiendo'}
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading course curriculum:', error);
    notFound();
  }
}
