'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, GripVertical, BookOpenIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { SectionForm } from '@/components/forms/SectionForm';
import { LessonForm } from '@/components/forms/LessonForm';
import { Section, LessonInSection } from '@/types/section';
import { apiRequest } from '@/lib/api';

interface SectionFormValues {
  title: string;
  description?: string;
  isPublished: boolean;
  order: number;
}

interface LessonFormValues {
  title: string;
  description?: string;
  duration: number;
  isPublished: boolean;
  isPreview: boolean;
  videoUrl?: string;
  order: number;
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
        const data = await apiRequest<Section[]>(`/courses/${courseId}/sections`);
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

  const handleAddSection = async (newSection: Omit<SectionFormValues, 'order'>) => {
    try {
      const createdSection = await apiRequest<Section>(
        `/courses/${courseId}/sections`,
        {
          method: 'POST',
          body: JSON.stringify({
            ...newSection,
            course: courseId,
            order: sections.length > 0 ? Math.max(...sections.map(s => s.order)) + 1 : 0
          }),
        }
      );
      
      setSections(prevSections => [...prevSections, createdSection]);
      setIsSectionDialogOpen(false);
      toast.success('Sección creada exitosamente');
    } catch (error) {
      console.error('Error al crear la sección:', error);
      toast.error(error instanceof Error ? error.message : 'Error al crear la sección');
    }
  };

  // Función para agregar una lección
  // Función para agregar una lección
  const handleAddLesson = async (newLesson: Omit<LessonFormValues, 'order' | 'isPublished' | 'isPreview'>) => {
    if (!selectedSection) return;
    
    try {
      const section = sections.find(s => s._id === selectedSection);
      if (!section) {
        throw new Error('Sección no encontrada');
      }

      const createdLesson = await apiRequest<LessonInSection>(`/sections/${selectedSection}/lessons`, {
        method: 'POST',
        body: JSON.stringify({
          ...newLesson,
          sectionId: selectedSection,
          courseId: courseId,
          isPublished: false,
          isPreview: false,
          order: section.lessons?.length || 0
        }),
      });

      // Update the sections state to include the new lesson
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

      setIsLessonDialogOpen(false);
      toast.success('Lección creada exitosamente');
    } catch (error) {
      console.error('Error al crear la lección:', error);
      toast.error(error instanceof Error ? error.message : 'Error al crear la lección');
    }
  };

  // Función para eliminar una lección
  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta sección? Esto también eliminará todas las lecciones que contiene.')) {
      return;
    }

    try {
      await apiRequest(`/sections/${sectionId}`, {
        method: 'DELETE',
      });

      // Update local state to reflect the deletion
      setSections(prevSections => 
        prevSections.filter(section => section._id !== sectionId)
      );

      toast.success('Sección eliminada exitosamente');
    } catch (error) {
      console.error('Error al eliminar la sección:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar la sección');
    }
  };

  const handleDeleteLesson = async (sectionId: string, lessonId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta lección?')) {
      return;
    }

    try {
      await apiRequest(`/lessons/${lessonId}`, {
        method: 'DELETE',
      });

      // Update local state to reflect the deletion
      setSections(prevSections => 
        prevSections.map(section => {
          if (section._id === sectionId) {
            const updatedLessons = section.lessons?.filter(lesson => lesson._id !== lessonId) || [];
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
              isPublished: false,
              order: sections.length > 0 ? Math.max(...sections.map(s => s.order)) + 1 : 0
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
                  <CardDescription className="mt-1">
                    {section.description && (
                      <p className="text-sm text-muted-foreground">
                        {section.description}
                      </p>
                    )}
                  </CardDescription>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Lección</DialogTitle>
          </DialogHeader>
          <LessonForm 
            sectionId={selectedSection?.toString() || ''}
            onSuccess={handleAddLesson}
            onCancel={() => {
              setSelectedSection(null);
              setIsLessonDialogOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
