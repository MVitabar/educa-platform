import Image from 'next/image';
import { Check, Play, AlertTriangle, Clock, Users, Star, BookOpen, PlayCircle } from 'lucide-react';
import { getServerSession } from 'next-auth/next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import InstructorSection from '@/components/courses/InstructorSection';

// Import from the correct auth options location
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getCourseBySlug } from '@/lib/api/courseService';
import { formatPrice } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Define types locally since they're not available from @/types/course
type Section = {
  _id: string;
  title: string;
  lessons?: Array<{
    _id: string;
    title: string;
    description?: string;
    duration: number;
    videoUrl?: string;
    preview?: boolean;
    type: string;
    completed: boolean;
  }>;
};

type Course = {
  _id: string;
  title: string;
  description: string;
  image?: string | { url: string };
  price: number;
  level: string;
  rating?: number | {
    average?: number;
    count?: number;
  };
  reviewCount?: number;
  studentsCount?: number;
  lessonsCount?: number;
  duration?: number;
  category?: string;
  learningObjectives?: string[];
  certificateIncluded?: boolean;
  resourcesCount?: number;
  accessLifetime?: boolean;
  enrolled?: boolean;
  instructor?: CourseInstructor;
  sections?: CourseSection[];
  slug?: string;
};

type CourseInstructor = {
  _id: string;
  name: string;
  avatar?: string;
  title?: string;
  rating?: number;
  studentsCount?: number;
};

type CourseSection = {
  _id: string;
  title: string;
  lessons?: CourseLesson[];
};

type CourseLesson = {
  _id: string;
  title: string;
  duration: number;
  type: string;
  completed: boolean;
  preview?: boolean;
};

type LessonWithProgress = CourseLesson & {
  progress?: number;
};




interface PageProps {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}

// Uncomment and implement this function when needed
// async function getCourseSections(courseId: string, token: string) {
//   try {
//     const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/courses/${courseId}/sections`, {
//       headers: {
//         'Authorization': `Bearer ${token}`,
//         'Content-Type': 'application/json'
//       },
//       next: { revalidate: 60 } // Cache for 60 seconds
//     });
    
//     if (!response.ok) {
//       console.error('Error fetching sections:', await response.text());
//       return { data: [] };
//     }
    
//     return response.json();
//   } catch (error) {
//     console.error('Error fetching sections:', error);
//     return { data: [] };
//   }
// }

export default async function CoursePage({ params, searchParams: searchParamsProp }: PageProps) {
  // Get session and destructure params in parallel
  const [session, { slug }, searchParams] = await Promise.all([
    getServerSession(authOptions),
    Promise.resolve(params),
    Promise.resolve(searchParamsProp)
  ]);
  
  // Safely handle searchParams with proper type checking
  const callbackUrl = searchParams?.callbackUrl 
    ? Array.isArray(searchParams.callbackUrl) 
      ? searchParams.callbackUrl[0] 
      : searchParams.callbackUrl
    : `/courses/${slug}`;
    
  // This can be used to show a welcome message after login
  // const isRedirectAfterLogin = searchParams?.login === 'success';

  try {
    // Get course data with authentication if available
    const courseResponse = await getCourseBySlug(slug, session?.accessToken);
    const course = courseResponse as unknown as Course;
    const sections: Section[] = []; // Initialize empty sections array with type
    
    // Process course data with proper type safety
    const courseImage = typeof course?.image === 'string' ? course.image : 
                       (course?.image as { url: string })?.url || '';
    
    const ratingValue = typeof course?.rating === 'number' 
      ? course.rating 
      : (course?.rating as { average?: number })?.average || 0;
      
    const reviewCount = typeof course?.rating === 'object' 
      ? (course.rating as { count?: number })?.count || 0 
      : 0;
                       
    const duration = course?.duration || 0;
    const learningObjectives = course?.learningObjectives || [];
    // Resource count is not currently used in the UI
    // const _resourcesCount = (course?.resourcesCount as number) ?? 0;
    
    // Move the course not found check before using course
    if (!course) {
      notFound();
    }
    
    // Initialize instructor with proper type
    const instructor: CourseInstructor = course.instructor || {
      _id: '',
      name: 'Instructor no disponible',
      title: '',
      avatar: undefined,
      rating: 0,
      studentsCount: 0
    };

    // Initialize lessons array with proper type
    let lessons: LessonWithProgress[] = [];
    
    // Check if there are any sections with lessons
    const hasSections = sections.some((section) => (section.lessons?.length ?? 0) > 0);
    
    if (hasSections) {
      try {
        lessons = sections.flatMap((section) => 
          (section.lessons ?? []).map((lesson) => ({
            _id: lesson._id,
            title: lesson.title,
            description: lesson.description ?? '',
            contentBlocks: [],
            duration: lesson.duration ?? 0,
            videoUrl: '',
            resources: [],
            section: section.title,
            progress: 0,
            course: course._id,
            order: 0,
            isFree: false,
            isPreview: lesson.preview ?? false,
            isPublished: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            type: lesson.type ?? 'video',
            completed: lesson.completed ?? false
          }))
        );
      } catch (error) {
        console.error('Error processing lessons:', error);
        // Continue with empty lessons array if there's an error
      }
    }
    
    const totalDuration = Math.round(lessons.reduce((total: number, lesson: LessonWithProgress) => 
      total + (Number(lesson.duration) || 0), 0) / 60);
    
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Course header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="aspect-video bg-gray-200 dark:bg-gray-700 relative">
                {course.image ? (
                  <Image
                    src={courseImage}
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
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {course.category && (
                    <span className="px-3 py-1 text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300 rounded-full">
                      {course.category}
                    </span>
                  )}
                  {course.level && (
                    <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">
                      {course.level}
                    </span>
                  )}
                </div>
                
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {course.title}
                </h1>
                
                <p className="text-gray-700 dark:text-gray-300 mb-6">
                  {course.description}
                </p>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 mr-1" />
                    <span>
                      {ratingValue > 0 
                        ? `${ratingValue.toFixed(1)} (${reviewCount} reseña${reviewCount !== 1 ? 's' : ''})`
                        : 'Nuevo'
                      }
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{course.studentsCount || 0} estudiantes</span>
                  </div>
                  <div className="flex items-center">
                    <BookOpen className="w-4 h-4 mr-1" />
                    <span>{course.lessonsCount || 0} lecciones</span>
                  </div>
                  {course.duration && (
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{duration > 0 ? Math.round(duration * 10) / 10 : 0} horas de contenido</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Course content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold">Lo que aprenderás</h2>
                {learningObjectives.length > 0 ? (
                  <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {learningObjectives.map((objective: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">{objective}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    No hay objetivos de aprendizaje definidos para este curso.
                  </p>
                )}
              </div>
              
              {/* Lessons section - Only show if user is authenticated */}
              {session?.accessToken ? (
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Contenido del curso</h2>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {lessons.length} lecciones • {totalDuration} horas
                    </span>
                  </div>
                  
                  {lessons.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <div className="space-y-2">
                      {lessons.map((lesson: LessonWithProgress) => (
                        <div key={lesson._id} className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mr-3">
                              {lesson.completed ? (
                                <Check className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                              ) : (
                                <Play className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{lesson.title}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {lesson.duration} min • {lesson.type}
                              </p>
                            </div>
                            {lesson.preview && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200">
                                Vista previa
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <PlayCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Este curso aún no tiene lecciones disponibles.</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg m-4">
                  <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-2">
                    Inicia sesión para ver el contenido del curso
                  </h3>
                  <p className="text-blue-700 dark:text-blue-300 mb-4">
                    Regístrate o inicia sesión para acceder a todas las lecciones y recursos del curso.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link href={`/login?redirect=/courses/${slug}`}>
                      <Button className="w-full sm:w-auto">
                        Iniciar sesión
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="outline" className="w-full sm:w-auto">
                        Crear cuenta
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center">
                  {course.price > 0 ? formatPrice(course.price) : 'Gratis'}
                </CardTitle>
                <CardDescription className="text-center">
                  {course.accessLifetime ? 'Acceso de por vida' : 'Acceso limitado'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {session?.user ? (
                  <Button className="w-full" asChild>
                    <Link href={course.enrolled ? `/courses/${slug}/learn` : `/courses/${slug}/enroll`}>
                      {course.enrolled ? 'Continuar curso' : 'Inscribirse ahora'}
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full" asChild>
                    <Link href={`/login?redirect=/courses/${slug}`}>
                      Inscribirse ahora
                    </Link>
                  </Button>
                )}
                
                <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Acceso {course.accessLifetime ? 'de por vida' : 'por tiempo limitado'}</span>
                  </div>
                  {course.certificateIncluded && (
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Certificado de finalización</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                    <span>Acceso en dispositivos móviles</span>
                  </div>
                  {(course.resourcesCount ?? 0) > 0 && (
                    <div className="flex items-center">
                      <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>{course.resourcesCount} recurso{course.resourcesCount !== 1 ? 's' : ''} descargable{course.resourcesCount !== 1 ? 's' : ''}</span>
                    </div>
                  )}
                </div>
                
                <InstructorSection instructor={instructor} />
              </CardContent>
            </Card>
            
            {/* Share buttons */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparte este curso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon" className="flex-1" asChild>
                    <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/courses/${slug}`)}&text=${encodeURIComponent(`Estoy viendo el curso: ${course.title}`)}`} target="_blank" rel="noopener noreferrer">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                      </svg>
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" className="flex-1" asChild>
                    <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/courses/${slug}`)}`} target="_blank" rel="noopener noreferrer">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                      </svg>
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" className="flex-1" asChild>
                    <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/courses/${slug}`)}`} target="_blank" rel="noopener noreferrer">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                      </svg>
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Course Content Section */}
            {session?.accessToken ? (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Contenido del Curso</CardTitle>
                </CardHeader>
                <CardContent>
                  {sections.length > 0 ? (
                    <div className="space-y-6">
                      {sections.map((section: {
                        _id: string;
                        title: string;
                        lessons?: Array<{
                          _id: string;
                          title: string;
                          duration: number;
                          type: string;
                          completed: boolean;
                          preview?: boolean;
                        }>;
                      }) => (
                        <div key={section._id} className="border rounded-lg overflow-hidden">
                          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b">
                            <h3 className="font-medium">{section.title}</h3>
                          </div>
                          <div className="divide-y">
                            {section.lessons?.map((lesson: {
                              _id: string;
                              title: string;
                              duration: number;
                              type: string;
                              completed: boolean;
                              preview?: boolean;
                            }) => (
                              <div key={lesson._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                <div className="flex items-center">
                                  <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-full bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400 mr-3">
                                    {lesson.completed ? (
                                      <Check className="h-5 w-5" />
                                    ) : (
                                      <Play className="h-5 w-5" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{lesson.title}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {lesson.duration} min • {lesson.type}
                                    </p>
                                  </div>
                                  {lesson.preview && (
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                      Vista previa
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No hay secciones disponibles en este momento.
                    </div>
                  )}
                </CardContent>
              </Card>
          ) : (
            <div className="mt-6 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    <Link 
                      href={`/login?callbackUrl=${encodeURIComponent(`/courses/${slug}`)}`}
                      className="font-medium text-yellow-700 dark:text-yellow-200 hover:text-yellow-600 dark:hover:text-yellow-100 underline"
                    >
                      Inicia sesión
                    </Link>{' '}
                    para ver todo el contenido del curso y comenzar a aprender.
                  </p>
                </div>
              </div>
            </div>

          )}
          </div>
        </div>
      </div>
    );
  } catch (err) {
    console.error('Error loading course:', err);
    
    // Handle authentication error
    if (err instanceof Error && err.message.includes('Authentication required')) {
      return (
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Acceso Requerido</h1>
          <p className="mb-6">Debes iniciar sesión para ver este curso.</p>
          <Button asChild>
            <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}>
              Iniciar sesión
            </Link>
          </Button>
        </div>
      );
    }
    
    // For other errors, show 404
    notFound();
  }
}

