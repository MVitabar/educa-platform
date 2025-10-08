"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeft,
  GripVertical,
  PlayCircle,
} from "lucide-react";
import { getYoutubeThumbnail, isYoutubeUrl } from "@/lib/videoUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { LessonForm } from "@/components/forms/LessonForm";
import { LessonFormValues } from "@/types/lesson";
import { Section, LessonInSection } from "@/types/section";
import { apiRequest } from "@/lib/api";
import Image from "next/image";

export default function SectionLessonsPage() {
  const router = useRouter();
  const params = useParams<{ id: string; sectionId: string }>();
  const courseId = params?.id || "";
  const sectionId = params?.sectionId || "";

  const [section, setSection] = useState<Section | null>(null);
  const [lessons, setLessons] = useState<LessonInSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonInSection | null>(
    null
  );

  // Función para manejar el ID de la sección
  const getCleanSectionId = (id: string) => {
    // Si el ID sigue el patrón section_<courseId>_<sectionId>, devolvemos el ID completo
    if (id.startsWith("section_")) {
      return id; // Devolvemos el ID completo como está en la base de datos
    }
    return id; // Si no coincide el patrón, lo devolvemos tal cual
  };

  useEffect(() => {
    const loadSectionAndLessons = async () => {
      if (!sectionId || !courseId) return;

      try {
        setIsLoading(true);
        const cleanSectionId = getCleanSectionId(sectionId);

        // Cargar todas las secciones del curso incluyendo las lecciones
        const sectionsResponse = await apiRequest<Section[]>(
          `/courses/${courseId}/sections?includeLessons=true`
        );

        console.log("Datos recibidos del backend:", {
          sectionsResponse,
          cleanSectionId,
          sectionEncontrada: sectionsResponse.find(
            (s) => s._id === cleanSectionId
          ),
        });

        if (!Array.isArray(sectionsResponse)) {
          throw new Error("Error al cargar las secciones");
        }

        // Encontrar la sección específica
        const foundSection = sectionsResponse.find(
          (s) => s._id === cleanSectionId
        );

        if (!foundSection) {
          throw new Error("Sección no encontrada");
        }

        setSection(foundSection);

        // Establecer las lecciones de la sección
        setLessons(
          Array.isArray(foundSection.lessons) ? foundSection.lessons : []
        );
      } catch (error) {
        console.error("Error cargando la sección y lecciones:", error);
        toast.error("Error al cargar la información de la sección");
      } finally {
        setIsLoading(false);
      }
    };

    loadSectionAndLessons();
  }, [sectionId, courseId]);
  const handleAddLesson = async (formData: LessonFormValues) => {
    if (!sectionId) return;
  
    try {
      const cleanSectionId = getCleanSectionId(sectionId);
      
      // Prepare content blocks
      const contentBlocks = [];
      
      // Add title as first content block if it doesn't exist
      if (!formData.contentBlocks?.some(block => block.type === 'text')) {
        contentBlocks.push({
          type: 'text',
          content: formData.title || 'Nueva lección',
          order: 0
        });
      } else {
        contentBlocks.push(...(formData.contentBlocks || []));
      }
      
      // Add video block if videoUrl exists
      if (formData.videoUrl) {
        // Check if there's already a video block to update or add new one
        const videoBlockIndex = contentBlocks.findIndex(block => block.type === 'video_link');
        
        if (videoBlockIndex >= 0) {
          // Update existing video block
          contentBlocks[videoBlockIndex] = {
            ...contentBlocks[videoBlockIndex],
            content: formData.videoUrl,
            title: `Video: ${formData.title || 'Nuevo video'}`,
            duration: formData.duration || 0
          };
        } else {
          // Add new video block
          contentBlocks.push({
            type: 'video_link',
            content: formData.videoUrl,
            title: `Video: ${formData.title || 'Nuevo video'}`,
            duration: formData.duration || 0,
            order: contentBlocks.length
          });
        }
      }
      
      // Transform form data to match the expected API format
      const lessonData = {
        ...formData,
        sectionId: cleanSectionId,
        courseId,
        contentBlocks
      };
  
      console.log('Creating lesson with data:', {
        endpoint: `sections/${cleanSectionId}/lessons`,
        sectionId: cleanSectionId,
        courseId,
        lessonData
      });

      const response = await apiRequest<{ data: LessonInSection }>(
        `courses/${courseId}/sections/${cleanSectionId}/lessons`,
        {
          method: 'POST',
          body: JSON.stringify(lessonData),
        }
      );
      
      console.log('Lesson created successfully:', response);
      
      // Close the dialog and show success message
      setIsLessonDialogOpen(false);
      toast.success("Lección creada correctamente");
      
      // Reload the section data to show the new lesson
      const loadSectionAndLessons = async () => {
        try {
          const sectionsResponse = await apiRequest<Section[]>(
            `/courses/${courseId}/sections?includeLessons=true`
          );
          
          if (Array.isArray(sectionsResponse)) {
            const foundSection = sectionsResponse.find(
              (s) => s._id === cleanSectionId
            );
            
            if (foundSection) {
              setSection(foundSection);
              setLessons(Array.isArray(foundSection.lessons) ? foundSection.lessons : []);
            }
          }
        } catch (error) {
          console.error("Error reloading section data:", error);
          toast.error("Error al actualizar la lista de lecciones");
        }
      };
      
      await loadSectionAndLessons();
    } catch (error) {
      console.error("Error creating lesson:", error);
      if (error instanceof Error) {
        console.error('Error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
      toast.error("Error al crear la lección");
    }
  };
  
  // Similar update for handleUpdateLesson
  const handleUpdateLesson = async (formData: LessonFormValues) => {
    if (!selectedLesson || !sectionId) return;
  
    try {
      const cleanSectionId = getCleanSectionId(sectionId);
      
      const lessonData = {
        ...formData,
        sectionId: cleanSectionId,
        courseId,
        // Ensure contentBlocks is properly formatted
        contentBlocks: formData.contentBlocks || [{
          type: 'text',
          content: formData.title || 'Lección actualizada',
          order: 0
        }]
      };
  
      const response = await apiRequest<{ data: LessonInSection }>(
        `lessons/${selectedLesson._id}`,
        {
          method: 'PUT',
          body: JSON.stringify(lessonData),
        }
      );
  
      if (response.data) {
        setLessons(prev =>
          prev.map(lesson =>
            lesson._id === response.data?._id
              ? (response.data as LessonInSection)
              : lesson
          )
        );
      }
  
      setIsLessonDialogOpen(false);
      setSelectedLesson(null);
      toast.success("Lección actualizada correctamente");
    } catch (error) {
      console.error("Error updating lesson:", error);
      toast.error("Error al actualizar la lección");
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    try {
      await apiRequest(`lessons/${lessonId}`, {
        method: "DELETE",
      });

      setLessons((prev: LessonInSection[]) =>
        prev.filter((lesson) => lesson._id !== lessonId)
      );

      toast.success("Lección eliminada exitosamente");
    } catch (error) {
      console.error("Error al eliminar la lección:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Sección no encontrada</h2>
        <Button variant="link" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al currículum
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2"
            onClick={() =>
              router.push(`/instructor/courses/${courseId}/curriculum`)
            }
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al currículum
          </Button>
          <h2 className="text-2xl font-bold tracking-tight">{section.title}</h2>
          {section.description && (
            <p className="text-muted-foreground">{section.description}</p>
          )}
        </div>
        <Button
          onClick={() => {
            setSelectedLesson(null);
            setIsLessonDialogOpen(true);
          }}
          className="ml-auto"
        >
          <PlusIcon className="mr-2 h-4 w-4" />
          Agregar lección
        </Button>
      </div>

      <div className="space-y-4">
        {lessons.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">
              No hay lecciones en esta sección
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsLessonDialogOpen(true)}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Agregar tu primera lección
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {lessons.map((lesson: LessonInSection) => (
              <Card
                key={lesson._id}
                className="hover:shadow-md transition-shadow overflow-hidden"
              >
                <CardContent className="p-0">
                  <div className="flex">
                    {/* Thumbnail section */}
                    {(() => {
                      // Buscar el bloque de contenido que sea un video
                      const videoBlock = lesson.contentBlocks?.find(block => block.type === 'video_link');
                      const videoUrl = videoBlock?.content;
                      
                      if (!videoUrl || !isYoutubeUrl(videoUrl)) {
                        return (
                          <div className="w-40 h-24 flex-shrink-0 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <PlayCircle className="h-8 w-8 text-gray-400" />
                          </div>
                        );
                      }
                      
                      const thumbnailUrl = getYoutubeThumbnail(videoUrl);
                      
                      return (
                        <div className="w-40 h-24 flex-shrink-0 bg-gray-100 dark:bg-gray-800 overflow-hidden">
                          {thumbnailUrl && (
                            <Image
                              src={thumbnailUrl}
                              alt="Miniatura del video"
                              width={160}
                              height={96}
                              className="w-full h-full object-cover"
                              unoptimized={true} // Add this to allow loading from external domains
                            />
                          )}
                        </div>
                      );
                    })()}
                    
                    <div className="flex-1 p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-move flex-shrink-0" />
                        <div>
                          <h3 className="font-medium">
                            {lesson.contentBlocks?.[0]?.content || 'Lección sin título'}
                          </h3>
                          {lesson.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {lesson.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <p className="text-sm text-muted-foreground whitespace-nowrap">
                          {lesson.duration
                            ? `${Math.ceil(lesson.duration)} min`
                            : "Sin duración"}
                        </p>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedLesson(lesson);
                              setIsLessonDialogOpen(true);
                            }}
                            className="h-8 w-8"
                          >
                            <PencilIcon className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLesson(lesson._id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <TrashIcon className="h-4 w-4" />
                            <span className="sr-only">Eliminar</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {selectedLesson ? "Editar lección" : "Agregar nueva lección"}
            </DialogTitle>
            <DialogDescription>
              {selectedLesson
                ? "Modifica los datos de la lección"
                : "Completa los datos para crear una nueva lección"}
            </DialogDescription>
          </DialogHeader>
          <LessonForm
            initialData={selectedLesson ? { ...selectedLesson, _id: selectedLesson._id } : undefined}
            onSuccess={async (data) => {
              try {
                if (selectedLesson) {
                  await handleUpdateLesson(data);
                } else {
                  await handleAddLesson(data);
                }
                setIsLessonDialogOpen(false);
              } catch (error) {
                console.error('Error saving lesson:', error);
              }
            }}
            onCancel={() => setIsLessonDialogOpen(false)}
            sectionId={sectionId}
            courseId={courseId}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
