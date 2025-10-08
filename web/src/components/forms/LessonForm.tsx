'use client';
import { useState } from 'react';
import { useForm, type SubmitHandler, FormProvider, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  FormControl,
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Define the form schema with required fields first
const lessonFormSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().default(''),
  content: z.string().min(1, 'El contenido es requerido'),
  duration: z.preprocess(
    (val) => (val ? Number(val) : 0),
    z.number().min(1, 'La duración debe ser mayor a 0')
  ),
  videoUrl: z.string().url('URL de video inválida').or(z.literal('')).optional(),
  isPreview: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  sectionId: z.string()
});

type LessonFormValues = z.infer<typeof lessonFormSchema>;

interface LessonFormProps {
  onSuccess?: (data: LessonFormValues) => void;
  sectionId: string;
  courseId: string;
  onCancel?: () => void;
  initialData?: Partial<LessonFormValues> & { _id?: string };
}

// Form fields component that uses useFormContext
function LessonFormFields() {
  const { control } = useFormContext<LessonFormValues>();
  
  return (
    <div className="space-y-6">
      {/* Sección de información básica */}
      <div className="space-y-4">
        <div className="space-y-4">
          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Título *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Título de la lección"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
      
      {/* Sección de contenido */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200">Contenido</h3>
        <div className="space-y-4 pl-4 border-l-2 border-gray-100 dark:border-gray-700">
          <FormField
            control={control}
            name="content"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Contenido *</FormLabel>
                <FormControl>
                  <textarea
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Contenido detallado de la lección..."
                    {...field}
                    rows={5}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
      
      {/* Sección de configuración */}
      <div className="space-y-4">
        <div className="space-y-4">
          {/* Campo de duración */}
          <FormField
            control={control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">Duración (minutos) *</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Ej: 30"
                    min="1"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Campo de URL de video */}
      <FormField
        control={control}
        name="videoUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">URL del video (opcional)</FormLabel>
            <FormControl>
              <Input
                placeholder="https://ejemplo.com/video"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
          <div className="pt-2">
            <FormField
              control={control}
              name="isPublished"
              render={({ field }) => (
                <FormItem className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-3">
                    <FormControl>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={field.value}
                        onClick={() => {
                          const newValue = !field.value;
                          field.onChange(newValue);
                        }}
                        className={cn(
                          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
                          field.value ? "bg-green-600" : "bg-gray-200 dark:bg-gray-700"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                            field.value ? "translate-x-6" : "translate-x-1"
                          )}
                        />
                      </button>
                    </FormControl>
                    <FormLabel className="!m-0 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {field.value ? 'Publicada' : 'Borrador'}
                    </FormLabel>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {field.value 
                      ? 'La lección será visible para los estudiantes' 
                      : 'La lección solo será visible para ti'}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export function LessonForm(props: LessonFormProps) {
  const { 
    initialData = {},
    sectionId,
    courseId,
    onCancel,
    onSuccess
  } = props;
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof lessonFormSchema>>({
    resolver: zodResolver(lessonFormSchema),
    defaultValues: {
      title: initialData.title || '',
      description: initialData.description || '',
      content: initialData.content || '',
      duration: initialData.duration || 0,
      videoUrl: initialData.videoUrl || '',
      order: initialData.order || 0,
      isPreview: initialData.isPreview || false,
      isPublished: initialData.isPublished || false,
      sectionId: sectionId || initialData.sectionId || ''
    }
  });

  const onSubmit: SubmitHandler<LessonFormValues> = async (formData) => {
    const data = {
      ...formData,
      sectionId: sectionId,
      courseId: courseId
    };
    
    try {
      setIsLoading(true);
      
      // Here you would typically make an API call to create/update the lesson
      console.log('Form submitted:', data);
      
      // Show success message
      toast.success(initialData._id ? 'Lección actualizada' : 'Lección creada');
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(data);
      }
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast.error(`Error al guardar la lección: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 -mr-2">
          <LessonFormFields />
        </div>
        
        {/* Form Footer */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="text-gray-600 dark:text-gray-300"
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading} className="bg-primary-500 hover:bg-primary-600 text-white">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData._id ? 'Actualizar' : 'Crear'} lección
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}