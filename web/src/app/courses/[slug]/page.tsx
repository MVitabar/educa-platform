import { notFound, redirect } from 'next/navigation';
import Image from 'next/image';
import { getCourseBySlug } from '@/lib/api/courseService';
import { getLessonsByCourse } from '@/lib/api/lessonService';
import LessonList from '@/components/courses/lesson/LessonList';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

interface PageProps {
  params: { slug: string };
}

export default async function CoursePage({ params }: PageProps) {
  // Get the session on the server side
  const session = await getServerSession(authOptions);
  
  // Extract the slug from the parameters
  const slug = params?.slug;
  
  // Verify that the slug exists
  if (!slug) {
    console.error('No se proporcionó un slug para el curso');
    notFound();
  }

  try {
    // Use Promise.all to load the course and lessons in parallel
    const [courseResponse, lessonsResponse] = await Promise.all([
      getCourseBySlug(slug, session?.accessToken).catch(error => {
        console.error('Error loading course:', error);
        if (error.message.includes('No estás autenticado')) {
          // Redirect to login if not authenticated
          redirect('/login');
        }
        throw error;
      }),
      getLessonsByCourse(slug, session?.accessToken).catch(error => {
        console.error('Error loading lessons:', error);
        // Return empty array if lessons fail to load
        return { data: [] };
      })
    ]);

    const course = courseResponse;
    const lessons = Array.isArray(lessonsResponse?.data) ? lessonsResponse.data : [];

    // If the course is not found, show 404 page
    if (!course) {
      console.error(`No se encontró el curso con slug: ${slug}`);
      notFound();
    }
    
    console.log('Course data:', course);
    console.log('Lessons data:', lessons);

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Contenido principal */}
          <div className="lg:col-span-3 space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 relative">
                {course.image ? (
                  <Image
                    src={course.image}
                    alt={course.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 768px"
                    priority
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
                    <span className="text-4xl font-bold text-white">
                      {course.title.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {course.title}
                </h1>
                
                <div className="flex items-center space-x-2 mb-4">
                  <div className="flex items-center">
                    <span className="text-yellow-400">★</span>
                    <span className="ml-1 text-sm text-gray-600 dark:text-gray-300">
                      {course.rating ? course.rating.toFixed(1) : 'Nuevo'}
                    </span>
                  </div>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {course.studentsCount || 0} estudiantes
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {course.lessonsCount || 0} lecciones
                  </span>
                </div>

                <div className="prose dark:prose-invert max-w-none mb-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    {course.description}
                  </p>
                </div>

                <div className="mt-8">
                  <h2 className="text-xl font-semibold mb-4">Lo que aprenderás</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {course.learningOutcomes?.map((outcome, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <svg className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">{outcome}</span>
                      </div>
                    )) || (
                      <p className="text-gray-500 dark:text-gray-400">No hay objetivos de aprendizaje definidos.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de lecciones */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold">Contenido del curso</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {lessons.length} lecciones • {Math.round(lessons.reduce((acc, l) => acc + (l.duration || 0), 0) / 60)} horas
                </p>
              </div>
              <div className="p-6">
                <LessonList lessons={lessons} courseSlug={params.slug} />
              </div>
            </div>
          </div>

          {/* Barra lateral */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  {course.price > 0 ? formatPrice(course.price) : 'Gratis'}
                </CardTitle>
                <CardDescription>
                  Acceso de por vida
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Duración</span>
                    <span className="font-medium">
                      {Math.round(lessons.reduce((acc, l) => acc + (l.duration || 0), 0) / 60)} horas
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Lecciones</span>
                    <span className="font-medium">{lessons.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Nivel</span>
                    <Badge variant="outline">{course.level || 'Todos los niveles'}</Badge>
                  </div>
                </div>

                <div className="pt-4">
                  <Link href={`/courses/${params.slug}/learn/${lessons[0]?._id || ''}`} className="w-full">
                    <Button className="w-full" size="lg">
                      {course.enrolled ? 'Continuar aprendiendo' : 'Comenzar curso'}
                    </Button>
                  </Link>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col items-start space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center">
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Acceso de por vida
                </div>
                <div className="flex items-center">
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Certificado de finalización
                </div>
                <div className="flex items-center">
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                  Acceso en dispositivos móviles
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading course:', error);
    notFound();
  }
}
