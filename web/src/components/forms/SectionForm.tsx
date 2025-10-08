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
    order?: number;
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
      order: 0,
      title: initialData?.title || '',
      description: initialData?.description || '',
      isPublished: initialData?.isPublished || false,
    },
  });

  const onSubmit: SubmitHandler<SectionFormValues> = async (data, event) => {
    console.group('=== Form Submission Started ===');
    console.log('Form data:', JSON.stringify(data, null, 2));
    console.log('Is editing:', isEditing);
    console.log('Course ID:', courseId);
    
    // Prevent default form submission
    event?.preventDefault?.();
    
    // Prevent double submission
    if (isLoading) {
      console.warn('Form submission prevented: already in progress');
      console.groupEnd();
      return;
    }
    
    try {
      console.log('Setting loading state...');
      setIsLoading(true);
      
      let result;
      if (isEditing && initialData?._id) {
        console.log('=== Updating existing section ===');
        console.log('Section ID:', initialData._id);
        console.log('Update data:', data);
        
        result = await updateSection(courseId, initialData._id, data);
        
        console.log('Update successful, response:', result);
        toast.success('Sección actualizada correctamente');
      } else {
        console.log('=== Creating new section ===');
        console.log('Section data to create:', data);
        
        result = await createSection(courseId, data);
        
        console.log('Creation successful, response:', result);
        toast.success('Sección creada correctamente');
      }
      
      console.log('Calling onSuccess callback...');
      onSuccess(result || data);
      console.log('onSuccess callback completed');
      
    } catch (error: unknown) {
      console.error('=== ERROR DURING FORM SUBMISSION ===');
      console.error('Error details:', error);
      
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Error al guardar la sección';
      toast.error(errorMessage);
    } finally {
      console.log('Cleaning up...');
      setIsLoading(false);
      console.groupEnd();
    }
  };

  // Handle form submission
  const handleFormSubmit = (e: React.FormEvent) => {
    console.log('Form submit event triggered');
    e.preventDefault();
    
    // Manually trigger form submission
    form.handleSubmit(async (data) => {
      try {
        console.log('Form data to submit:', data);
        await onSubmit(data, e);
      } catch (error) {
        console.error('Error in form submission:', error);
      }
    })();
  };

  return (
    <FormProvider {...form}>
      <form 
        onSubmit={handleFormSubmit}
        className="space-y-6"
        noValidate
      >
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
          <Button 
            type="submit" 
            disabled={isLoading}
            className="min-w-[150px]"
          >
            {isLoading ? 'Guardando...' : isEditing ? 'Actualizar sección' : 'Crear sección'}
          </Button>
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={async () => {
              const formValues = form.getValues();
              const formState = form.formState;
              console.group('=== Form Debug Info ===');
              console.log('Form values:', formValues);
              console.log('Form state:', formState);
              console.log('Form errors:', form.formState.errors);
              const isValid = await form.trigger();
              console.log('Is form valid?', isValid);
              if (!isValid) {
                console.log('Validation errors:', form.formState.errors);
              }
              console.groupEnd();
            }}
            className="w-full text-xs"
          >
            Debug Form State
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
