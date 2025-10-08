'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { PlusIcon, PencilIcon, TrashIcon, BookOpenIcon, GripVertical, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SectionForm } from '@/components/forms/SectionForm';
import { LessonForm } from '@/components/forms/LessonForm';
import { LessonInSection, Section, SectionFormValues } from '@/types/section';
import { LessonFormValues } from '@/types/lesson';
import { createSection } from '@/services/sectionService';
import { apiRequest } from '@/lib/api';


interface ErrorResponseData {
  message?: string;
  error?: string;
  statusCode?: number;
  [key: string]: unknown;
}

interface ErrorWithResponse extends Error {
  response?: {
    status: number;
    data: ErrorResponseData;
  };
  request?: XMLHttpRequest;
}


export default function CurriculumPage() {
  const { id: courseId } = useParams<{ id: string }>();
  const router = useRouter();
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  
  const handleSectionClick = (sectionId: string) => {
    router.push(`/instructor/courses/${courseId}/sections/${sectionId}`);
  };

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
      setIsLoading(false);
    }
  }, [courseId]);


  const handleAddSection = useCallback(async (newSection: SectionFormValues | Section) => {
    console.log('=== Iniciando manejo de sección ===');
    console.log('Datos de la sección recibidos:', newSection);
    
    try {
      // Si ya es un objeto Section (viene del formulario con _id)
      if ('_id' in newSection) {
        console.log('Sección ya procesada, actualizando estado local');
        setSections(prevSections => [...prevSections, newSection]);
        setIsSectionDialogOpen(false);
        return newSection;
      }
      
      // Si es un SectionFormValues (caso de respaldo)
      if (!courseId) {
        throw new Error('No se encontró el ID del curso');
      }
      
      console.log('Creando nueva sección a través del servicio...');
      
      // Usar el servicio para crear la sección
      const createdSection = await createSection(courseId, newSection);
      
      if (!createdSection) {
        throw new Error('No se pudo crear la sección');
      }
      
      console.log('Sección creada con éxito:', createdSection);
      
      // Agregar la nueva sección al estado
      setSections(prevSections => [...prevSections, createdSection]);
      
      // Cerrar el diálogo
      setIsSectionDialogOpen(false);
      
      // Mostrar mensaje de éxito
      toast.success(`Sección "${createdSection.title}" creada correctamente`);
      
      return createdSection;
    } catch (error: unknown) {
      const err = error as ErrorWithResponse;
      console.error('Error detallado al crear la sección:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
        response: err.response
      });
      
      let errorMessage = 'Error al crear la sección';
      
      // Manejar diferentes tipos de errores
      if (err.response) {
        // Error de respuesta del servidor (4xx, 5xx)
        const { status, data } = err.response;
        console.error(`Error del servidor (${status}):`, data);
        
        if (status === 400) {
          errorMessage = data.message || 'Datos de la sección inválidos';
        } else if (status === 401) {
          errorMessage = 'No autorizado. Por favor, inicia sesión nuevamente.';
        } else if (status === 403) {
          errorMessage = 'No tienes permiso para crear secciones en este curso';
        } else if (status === 404) {
          errorMessage = 'Curso no encontrado';
        } else if (status >= 500) {
          errorMessage = 'Error del servidor. Por favor, inténtalo de nuevo más tarde.';
        }
      } else if (err.request) {
        // La solicitud fue hecha pero no hubo respuesta
        console.error('No se recibió respuesta del servidor:', err.request);
        errorMessage = 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
      } else {
        // Error al configurar la solicitud
        const errorMsg = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error al configurar la solicitud:', errorMsg);
        errorMessage = `Error: ${errorMsg}`;
      }
      
      toast.error(errorMessage);
      throw new Error(errorMessage);
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
            content: newLesson.title || '',
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
  const handleDeleteSection = async (courseId: string, sectionId: string) => {
    // Find the section to get its title for the confirmation message
    const section = sections.find(s => s._id === sectionId);
    const sectionTitle = section?.title || 'esta sección';
    
    // Show confirmation dialog
    if (!confirm(`¿Estás seguro de que deseas eliminar la sección "${sectionTitle}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    
    try {
      // Use the apiRequest utility which handles the base URL and authentication
      await apiRequest(`courses/${courseId}/sections/${sectionId}`, {
        method: 'DELETE'
      });

      // Remove the section from the UI
      setSections(prevSections => 
        prevSections.filter(section => section._id !== sectionId)
      );
      
      toast.success(`Sección "${sectionTitle}" eliminada exitosamente`);
    } catch (error) {
      console.error('Error al eliminar la sección:', error);
      toast.error(error instanceof Error ? error.message : 'Error al eliminar la sección');
      throw error;
    }
  };
  const handleDeleteLesson = async (sectionId: string, lessonId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta lección? Esta acción no se puede deshacer.')) {
      return;
    }
  
    try {
      if (!lessonId) {
        throw new Error('ID de lección inválido');
      }
  
      // Use the full lesson ID instead of extracting just the last part
      await apiRequest(`lessons/${lessonId}`, { 
        method: 'DELETE' 
      });
      
      // Rest of the function remains the same
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
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar la lección';
      toast.error(errorMessage);
      
      // Refresh the sections to ensure consistency
      try {
        const response = await apiRequest<Section[]>(`courses/${courseId}/sections?includeLessons=true`);
        setSections(Array.isArray(response) ? response : []);
      } catch (refreshError) {
        console.error('Error al actualizar las secciones:', refreshError);
      }
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
              <Card 
                key={section._id.toString()}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleSectionClick(section._id.toString())}
              >
                <CardHeader className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <CardTitle className="text-lg">{section.title}</CardTitle>
                          {!section.isPublished && (
                            <Badge variant="outline" className="text-xs">
                              Borrador
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {section.lessons?.length || 0} {section.lessons?.length === 1 ? 'lección' : 'lecciones'}
                        </div>
                      </div>
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
                        onClick={() => handleDeleteSection(courseId, section._id)}
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
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-muted-foreground">
                      {section.lessons?.length || 0} {section.lessons?.length === 1 ? 'lección' : 'lecciones'}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSection(section._id);
                          setIsLessonDialogOpen(true);
                        }}
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Agregar lección
                      </Button>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Diálogo para agregar/editar sección */}
      <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-900">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
              Nueva Sección
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
              Agrega una nueva sección para organizar tus lecciones
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <SectionForm
              courseId={courseId}
              onSuccess={(newSection) => {
                handleAddSection(newSection);
                setIsSectionDialogOpen(false);
              }}
              onCancel={() => setIsSectionDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

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
