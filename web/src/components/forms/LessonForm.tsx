'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/input';
import { 
  FormControl,
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';

// Define the form schema with required fields first
const lessonFormSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  duration: z.preprocess(
    (val) => typeof val === 'number' ? val : Number(val),
    z.number().min(1, 'La duración debe ser mayor a 0')
  ),
  order: z.preprocess(
    (val) => typeof val === 'number' ? val : Number(val),
    z.number().min(0, 'El orden no puede ser negativo')
  ),
  isPreview: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  description: z.string().default(''),
  content: z.string().default(''),
  videoUrl: z.string().url('URL de video inválida').or(z.literal('')).default('')
});

type LessonFormValues = z.infer<typeof lessonFormSchema>;

interface LessonFormProps {
  initialData?: Partial<LessonFormValues> & { _id?: string };
  onSuccess?: (data: LessonFormValues) => void;
  sectionId?: string;
  onCancel?: () => void;
}

export function LessonForm({ 
  initialData = {}, 
  onSuccess, 
  sectionId, 
  onCancel 
}: LessonFormProps) {
  const isEditing = !!initialData?._id;
  const [isLoading, setIsLoading] = useState(false);
  
  

  const defaultValues: LessonFormValues = {
    title: '',
    duration: 0,
    order: 0,
    isPreview: false,
    isPublished: false,
    description: '',
    content: '',
    videoUrl: '',
    ...initialData
  };

  const form = useForm({
    resolver: zodResolver(lessonFormSchema),
    defaultValues,
    mode: 'onChange',
  }) as unknown as UseFormReturn<LessonFormValues>;

  const onSubmit: SubmitHandler<LessonFormValues> = async (data) => {
    try {
      setIsLoading(true);
      
      const url = isEditing && initialData?._id 
        ? `/api/lessons/${initialData._id}`
        : `/api/sections/${sectionId}/lessons`;
      
      const response = await fetch(url, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`Error al ${isEditing ? 'editar' : 'crear'} la lección: ${response.statusText}`);
      }
      
      const result = await response.json();
      onSuccess?.(result);
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ocurrió un error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const isFormSubmitting = form.formState.isSubmitting || isLoading;

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título de la lección</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Ej: Introducción al curso"
                    disabled={isFormSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Add other form fields here */}
          
          <div className="flex items-center justify-end space-x-4">
            {onCancel && (
              <Button 
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isFormSubmitting}
              >
                Cancelar
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isFormSubmitting}
            >
              {isFormSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditing ? 'Actualizando...' : 'Creando...'}
                </>
              ) : isEditing ? (
                'Actualizar lección'
              ) : (
                'Crear lección'
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
