'use client';

import { useForm, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { TypedFormField } from '@/components/ui/form-typed';
import { toast } from 'react-hot-toast';
import { FormProvider } from 'react-hook-form';
import { createSection, updateSection } from '@/services/sectionService';

const sectionFormSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(100, 'El título no puede tener más de 100 caracteres'),
  description: z.string().max(500, 'La descripción no puede tener más de 500 caracteres').optional(),
  isPublished: z.boolean().default(false),
  order: z.number().min(0, 'El orden no puede ser negativo'),
});

type SectionFormValues = {
    title: string;
    description?: string;
    isPublished: boolean;
    order: number;
}

interface SectionFormProps {
  courseId: string;
  initialData?: {
    _id?: string;
    title: string;
    description?: string;
    isPublished: boolean;
    order: number;
  };
  onSuccess: (data: SectionFormValues) => void;
  onCancel: () => void;
}

export function SectionForm({ 
  courseId, 
  initialData,
  onSuccess, 
  onCancel 
}: SectionFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!initialData?._id;

  const form = useForm<SectionFormValues>({
    resolver: zodResolver(sectionFormSchema) as Resolver<SectionFormValues>,
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      isPublished: initialData?.isPublished || false,
      order: initialData?.order || 0,
    },
  });

  const { handleSubmit } = form;

  const onSubmit: SubmitHandler<SectionFormValues> = async (data, event) => {
    // Prevent default form submission
    event?.preventDefault?.();
    
    // Prevent double submission
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      if (isEditing && initialData?._id) {
        // Actualizar sección existente
        await updateSection(courseId, initialData._id, data);
        toast.success('Sección actualizada correctamente');
        onSuccess(data);
      } else {
        // Crear nueva sección
        await createSection(courseId, data);
        // No llamamos a onSuccess aquí porque la lógica de éxito ya está en handleAddSection
      }
    } catch (error: unknown) {
      console.error('Error al guardar la sección:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar la sección';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(onSubmit)(e);
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="space-y-4">
          <TypedFormField<SectionFormValues>
            name="title"
            label="Título de la sección"
            placeholder="Ej: Introducción al curso"
            disabled={isLoading}
          />
          
          <TypedFormField<SectionFormValues>
            name="description"
            label="Descripción (opcional)"
            placeholder="Describe brevemente el contenido de esta sección"
            type="textarea"
            className="min-h-[100px]"
            disabled={isLoading}
          />
          
          <div className="rounded-lg border p-4">
            <TypedFormField<SectionFormValues>
              name="isPublished"
              label="Publicar sección"
              type="switch"
              description={
                form.watch('isPublished')
                  ? 'Esta sección será visible para los estudiantes.'
                  : 'Esta sección no será visible para los estudiantes.'
              }
              disabled={isLoading}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                {isEditing ? 'Actualizando...' : 'Creando...'}
              </>
            ) : isEditing ? (
              'Actualizar sección'
            ) : (
              'Crear sección'
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
