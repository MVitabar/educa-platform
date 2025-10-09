'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil } from 'lucide-react';
import { apiRequest } from '@/lib/api';
import { LessonInSection } from '@/types/section';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { isYoutubeUrl } from '@/lib/videoUtils';

export default function LessonPage() {
  const router = useRouter();
  const params = useParams<{ id: string; sectionId: string; lessonId: string }>();
  const courseId = params?.id || '';
  const sectionId = params?.sectionId || '';
  const lessonId = params?.lessonId || '';
  
  const [lesson, setLesson] = useState<LessonInSection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchLesson = async () => {
      if (!lessonId || !courseId || !sectionId) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // The apiRequest function already adds /api/v1/ to the URL
        const response = await apiRequest<LessonInSection>(
          `courses/${courseId}/sections/${sectionId}/lessons/${lessonId}`, 
          {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
          }
        );

        if (!response) {
          throw new Error('No se recibieron datos de la lección');
        }
        
        setLesson(response);
      } catch (err) {
        console.error('Error fetching lesson:', err);
        
        // Type guard to check if error is an AxiosError
        const error = err as {
          response?: {
            status?: number;
            data?: {
              message?: string;
            };
          };
          message?: string;
        };
        
        // Handle different types of errors
        if (error.response?.status === 404) {
          setError('La lección no fue encontrada');
        } else if (error.response?.status === 403) {
          setError('No tienes permiso para ver esta lección');
        } else if (error.response?.data?.message) {
          setError(error.response.data.message);
        } else if (error.message) {
          setError(error.message);
        } else {
          setError('Ocurrió un error al cargar la lección. Por favor, inténtalo de nuevo más tarde.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLesson();
  }, [lessonId, courseId, sectionId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-700 mb-2">
            {error || 'Lección no encontrada'}
          </h2>
          <p className="text-red-600 mb-4">
            La lección que estás buscando no existe o no tienes permiso para verla.
          </p>
          <div className="flex justify-center gap-4">
            <Button 
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver atrás
            </Button>
            <Button
              variant="default"
              onClick={() => router.push(`/instructor/courses/${courseId}`)}
            >
              Ir al curso
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Find video block if it exists
  const videoBlock = lesson.contentBlocks?.find(block => block.type === 'video_link');
  const videoUrl = videoBlock?.content;

  return (
    <div className=" flex flex-col space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2"
            onClick={() => router.push(`/instructor/courses/${courseId}/sections/${sectionId}`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a la sección
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">{lesson.contentBlocks[0].content || 'Lección sin título'}</h1>
          {lesson.description && (
            <p className="text-muted-foreground">{lesson.description}</p>
          )}
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/instructor/courses/${courseId}/sections/${sectionId}/lessons/${lessonId}/edit`)}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Editar
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="">
          <Card>
            <CardHeader>
              <CardTitle>Contenido de la lección</CardTitle>
            </CardHeader>
            <CardContent>
              {videoUrl && isYoutubeUrl(videoUrl) && (
                <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100 mb-6">
                  <iframe
                    src={`https://www.youtube.com/embed/${getYoutubeVideoId(videoUrl)}`}
                    title={lesson.contentBlocks[0].content}
                    className="h-full w-full"
                    allowFullScreen
                  />
                </div>
              )}
              
             
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la lección</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Duración</h3>
                <p>{lesson.duration ? `${lesson.duration} minutos` : 'No especificada'}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Estado</h3>
                <Badge variant={lesson.isPublished ? 'default' : 'secondary'}>
                  {lesson.isPublished ? 'Publicada' : 'Borrador'}
                </Badge>
              </div>
              {lesson.createdAt && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Creada el</h3>
                  <p>{new Date(lesson.createdAt).toLocaleDateString()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper function to extract YouTube video ID from URL
function getYoutubeVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}
