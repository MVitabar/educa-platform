import { notFound } from 'next/navigation';
import { getCourseBySlug } from '@/lib/api/courseService';
import { getLessonsBySection } from '@/lib/api/lessonService';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Clock, Play, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { LessonWithProgress } from '@/types/lesson';

// Extender la interfaz Course para incluir las secciones
interface CourseWithSections extends Awaited<ReturnType<typeof getCourseBySlug>> {
  sections?: Array<{
    _id: string;
    title: string;
    description?: string;
  }>;
}

export default async function SectionLessonsPage({ 
  params 
}: { 
  params: { slug: string; sectionId: string } 
}) {
  try {
    const [course, lessons] = await Promise.all([
      getCourseBySlug(params.slug) as Promise<CourseWithSections>,
      getLessonsBySection(params.sectionId) as Promise<LessonWithProgress[]>
    ]);

    if (!course) {
      notFound();
    }

    // Encontrar la sección actual
    const section = course.sections?.find((s: { _id: string }) => s._id === params.sectionId);
    if (!section) {
      notFound();
    }

    // Calcular progreso de la sección
    const totalLessons = lessons.length;
    const completedLessons = lessons.filter((lesson: LessonWithProgress) => lesson.completed).length;
    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link 
            href={`/courses/${params.slug}/curriculum`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al currículum
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">{section.title}</h1>
          {section.description && (
            <p className="text-muted-foreground">{section.description}</p>
          )}
          
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium">
                Progreso: {completedLessons} de {totalLessons} lecciones
              </span>
              <span className="text-sm font-medium">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div 
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Lecciones</h2>
          
          <div className="grid gap-4">
            {lessons.map((lesson: LessonWithProgress) => (
              <Link 
                key={lesson._id}
                href={`/courses/${params.slug}/learn/${lesson._id}`}
                className="block"
              >
                <Card className="hover:border-primary/50 transition-colors">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {lesson.completed ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <Play className="w-5 h-5 text-muted-foreground" />
                        )}
                        {lesson.title}
                      </CardTitle>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="w-4 h-4 mr-1" />
                        {lesson.duration} min
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {lesson.description && (
                      <p className="text-muted-foreground text-sm">
                        {lesson.description}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error loading section:', error);
    notFound();
  }
}
