'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, GripVertical, BookOpenIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SectionForm } from '@/components/forms/SectionForm';
import { LessonForm } from '@/components/forms/LessonForm';
import { Section, LessonInSection } from '@/types/section';
import { apiRequest } from '@/lib/api';

interface SectionFormValues {
  title: string;
  description?: string;
  isPublished: boolean;
}

interface LessonFormValues {
  title: string;
  description?: string;
  duration: number;
  isPublished: boolean;
  isPreview: boolean;
  videoUrl?: string;
}

export default function CurriculumPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Cargar secciones del curso
  useEffect(() => {
    const loadSections = async () => {
      try {
        const data = await apiRequest<Section[]>(`/courses/${courseId}/sections?includeLessons=true`);
        setSections(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('Error cargando secciones:', error);
        
        // No mostrar error si es por falta de autenticación, ya que se redirigirá
        if (error instanceof Error && error.message === 'No authentication token found') {
          return;
        }
        
        // Manejar el caso cuando no hay secciones (404)
        if (error instanceof Error && error.message.includes('404')) {
          console.log('No se encontraron secciones para este curso');
          setSections([]);
        } else {
          // Mostrar otros errores
          toast.error(
            error instanceof Error 
              ? error.message 
              : 'Error al cargar el currículum'
          );
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    // Solo intentar cargar las secciones si hay un courseId
    if (courseId) {
      loadSections();
    } else {
      setIsLoading(false);
    }
  }, [courseId]);


  const handleAddSection = useCallback(async (newSection: Omit<SectionFormValues, 'order'>) => {
    console.log('=== Creando nueva sección ===');
    console.log('Datos de la sección:', newSection);
    
    try {
      // Crear la sección
      console.log('Enviando solicitud POST a /sections');
      const response = await apiRequest<{ data: Section }>(
        `courses/${courseId}/sections`,
        {
          method: 'POST',
          body: JSON.stringify(newSection)
        }
      );
      
      console.log('Sección creada con éxito:', response.data);
      
      // Agregar la nueva sección al estado
      setSections(prevSections => [...prevSections, response.data]);
      
      // Cerrar el diálogo
      setIsSectionDialogOpen(false);
      
      // Mostrar mensaje de éxito
      toast.success('Sección creada correctamente');
    } catch (error) {
      console.error('Error al crear la sección:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al crear la sección';
      toast.error(errorMessage);
      throw error; // Re-lanzar el error para que pueda ser manejado por el formulario
    }
  }, [courseId]); // Add dependency array with courseId

  const handleAddLesson = async (newLesson: Omit<LessonFormValues, 'sectionId'>) => {
    if (!selectedSection) return;
    
    try {
      // Format the lesson data to match the backend expectations
      const lessonData = {
        title: newLesson.title,
        description: newLesson.description || '',
        duration: newLesson.duration || 0,
        isPublished: newLesson.isPublished,
        isPreview: newLesson.isPreview,
        sectionId: selectedSection,
        courseId,
        // Convert the content into a contentBlocks array
        contentBlocks: [
          {
            type: 'text',
            content: newLesson.content || '',
            order: 0
          }
        ]
      };

      const createdLesson = await apiRequest<LessonInSection>(
        `lessons`,
        {
          method: 'POST',
          body: JSON.stringify(lessonData)
        }
      );

      // Actualizar la sección con la nueva lección
      setSections(prevSections => 
        prevSections.map(section => {
          if (section._id === selectedSection) {
            const updatedLessons = [...(section.lessons || []), createdLesson];
            return {
              ...section,
              lessons: updatedLessons,
              lessonCount: updatedLessons.length,
              duration: updatedLessons.reduce((total, lesson) => total + (lesson.duration || 0), 0)
            };
          }
          return section;
        })
      );

      toast.success('Lección eliminada exitosamente');
    } catch (error) {
      console.error('Error al eliminar la lección:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar la lección');
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Currículum del curso</h2>
          <p className="text-muted-foreground">
            Organiza el contenido de tu curso en secciones y lecciones
          </p>
        </div>
        <Button onClick={() => setIsSectionDialogOpen(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Agregar sección
        </Button>
      </div>

      {/* Diálogo para agregar/editar sección */}
      <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Sección</DialogTitle>
          </DialogHeader>
          <SectionForm
            courseId={courseId as string}
            onSuccess={handleAddSection}
            onCancel={() => setIsSectionDialogOpen(false)}
            initialData={{
              title: '',
              description: '',
              isPublished: false
            }}
          />
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : sections.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <BookOpenIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium">No hay secciones</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Comienza agregando una sección a tu curso.
            </p>
            <div className="mt-6">
              <Button onClick={() => setIsSectionDialogOpen(true)}>
                <PlusIcon className="h-4 w-4 mr-2" />
                Agregar sección
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {sections.map((section) => (
              <Card key={section._id.toString()}>
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      {!section.isPublished && (
                        <Badge variant="outline" className="text-xs">
                          Borrador
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedSection(section._id);
                          setIsLessonDialogOpen(true);
                        }}
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Lección
                      </Button>
                      <Button variant="ghost" size="sm">
                        <PencilIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteSection(section._id)}
                      >
                        <TrashIcon className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {section.description && (
                    <CardDescription className="mt-1 text-sm text-muted-foreground">
                      {section.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {!section.lessons || section.lessons.length === 0 ? (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No hay lecciones en esta sección
                      </div>
                    ) : (
                      section.lessons.map((lesson) => (
                        <div
                          key={lesson._id.toString()}
                          className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{lesson.title}</span>
                                {lesson.isPreview && (
                                  <Badge variant="outline" className="text-xs">
                                    Vista Previa
                                  </Badge>
                                )}
                                {!lesson.isPublished && (
                                  <Badge variant="outline" className="text-xs">
                                    Borrador
                                  </Badge>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {lesson.duration} min • Lección
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLesson(section._id, lesson._id)}
                            >
                              <TrashIcon className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Diálogo para agregar/editar lección */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              {selectedSection ? 'Editar Lección' : 'Nueva Lección'}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              {selectedSection ? 'Actualiza los detalles de la lección' : 'Completa los campos para crear una nueva lección'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <LessonForm 
              sectionId={selectedSection?.toString() || ''}
              courseId={courseId}
              onSuccess={handleAddLesson}
              onCancel={() => {
                setSelectedSection(null);
                setIsLessonDialogOpen(false);
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
