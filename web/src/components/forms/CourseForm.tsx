'use client';

// Update imports to use named exports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { SubmitHandler, useForm, Resolver } from 'react-hook-form';
import { z } from 'zod';
import { Loader2, Plus, X } from 'lucide-react';
import { type CourseLevel, type CourseResponse } from '@/types/course';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';



// Define the form input type
type CourseFormInput = {
  title: string;
  description: string;
  category: string;
  price: number;
  level: CourseLevel;
  image?: File;
  isFree: boolean;
  requirements: string[];
  learningOutcomes: string[];
  isPublished: boolean;
};

// Define the schema with proper types
const courseSchema = z.object({
  title: z.string().min(5, 'El título debe tener al menos 5 caracteres'),
  description: z.string().min(20, 'La descripción debe tener al menos 20 caracteres'),
  category: z.string().min(1, 'Selecciona una categoría'),
  price: z.number().min(0, 'El precio no puede ser negativo'),
  level: z.enum(['beginner', 'intermediate', 'advanced']) as unknown as z.ZodType<CourseLevel>,
  image: z.any().optional(), // Using any for file input compatibility
  isFree: z.boolean().default(false),
  requirements: z.array(z.string().min(1, 'El requisito no puede estar vacío')).default([]),
  learningOutcomes: z.array(z.string().min(1, 'El objetivo de aprendizaje no puede estar vacío')).default([]),
  isPublished: z.boolean().default(false),
});

// Export the form values type
export type CourseFormValues = z.infer<typeof courseSchema>;

interface CourseFormProps {
  initialData?: Partial<CourseResponse>;
  isEdit?: boolean;
  onSuccess?: () => void;
}

const CourseForm: React.FC<CourseFormProps> = ({ 
  initialData = {},
  isEdit = false,
  onSuccess
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData.imageUrl || null
  );
  const router = useRouter();

  // Form values type is now defined above

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    getValues,
  } = useForm<CourseFormInput, object, CourseFormValues>({
    resolver: zodResolver(courseSchema) as unknown as Resolver<CourseFormValues, object>,
    defaultValues: {
      title: initialData.title || '',
      description: initialData.description || '',
      category: initialData.category || '',
      price: initialData.price || 0,
      level: (initialData.level || 'beginner') as CourseLevel,
      isFree: initialData.isFree || false,
      requirements: initialData.requirements || [],
      learningOutcomes: initialData.learningOutcomes || [],
      isPublished: initialData.isPublished || false,
      image: undefined
    }
  });

  // Handle image file selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Por favor, sube una imagen en formato JPG, PNG o WebP');
      return;
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('La imagen no puede pesar más de 5MB');
      return;
    }
    
    // Using type assertion for file upload
    setValue('image', file as unknown as File, { shouldValidate: true });
    setImagePreview(URL.createObjectURL(file));
  };

  // Handle form submission
  const onSubmit: SubmitHandler<CourseFormValues> = async (data: CourseFormValues) => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      
      // Handle form data with proper type checking
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        
        const stringKey = String(key);
        
        if (stringKey === 'image' && value instanceof File) {
          formData.append('image', value);
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (item) {
              formData.append(`${stringKey}[${index}]`, String(item));
            }
          });
        } else if (typeof value === 'boolean' || typeof value === 'number') {
          formData.append(stringKey, String(value));
        } else if (typeof value === 'string') {
          formData.append(stringKey, value);
        }
      });

      const url = isEdit && initialData._id 
        ? `${process.env.NEXT_PUBLIC_API_URL}/courses/${initialData._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/courses`;
      
      const method = isEdit ? 'PUT' : 'POST';
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al guardar el curso');
      }

      const result = await response.json();
      toast.success(isEdit ? 'Curso actualizado correctamente' : 'Curso creado correctamente');
      
      if (onSuccess) {
        onSuccess();
      } else if (!isEdit) {
        router.push(`/instructor/courses/${result.data._id}`);
      }
    } catch (error: Error | unknown) {
      console.error('Error saving course:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Error al guardar el curso');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions for dynamic fields
  const addRequirement = () => {
    const current = getValues('requirements') || [];
    setValue('requirements', [...current, ''], { shouldValidate: true });
  };

  const removeRequirement = (index: number) => {
    const current = getValues('requirements') || [];
    const updated = current.filter((_item: string, i: number) => i !== index);
    setValue('requirements', updated, { shouldValidate: true });
  };

  const addLearningOutcome = () => {
    const current = getValues('learningOutcomes') || [];
    setValue('learningOutcomes', [...current, ''], { shouldValidate: true });
  };

  const removeLearningOutcome = (index: number) => {
    const current = getValues('learningOutcomes') || [];
    const updated = current.filter((_item: string, i: number) => i !== index);
    setValue('learningOutcomes', updated, { shouldValidate: true });
  };

  const updateArrayField = (field: 'requirements' | 'learningOutcomes', index: number, value: string) => {
    const current = getValues(field) as string[] || [];
    const updated = [...current];
    updated[index] = value;
    setValue(field, updated as string[], { shouldValidate: true });
  };

  // Mock categories - replace with your actual categories from API
  const categories = [
    { _id: 'web', name: 'Desarrollo Web' },
    { _id: 'mobile', name: 'Desarrollo Móvil' },
    { _id: 'data', name: 'Ciencia de Datos' },
    { _id: 'business', name: 'Negocios' },
    { _id: 'design', name: 'Diseño' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Sección de Información Básica */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="space-y-1 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Información Básica</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Información principal que aparecerá en la página del curso</p>
        </div>
        
        {/* Título */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="title" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Título del Curso <span className="text-red-500">*</span>
            </Label>
            <span className="text-xs text-gray-500">
              {getValues('title')?.length || 0}/100
            </span>
          </div>
          <Input
            id="title"
            type="text"
            placeholder="Ej: Aprende React desde cero"
            className={`h-11 ${errors.title ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            {...register('title')}
            disabled={isLoading}
            maxLength={100}
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-500">{errors.title.message as string}</p>
          )}
        </div>

        {/* Descripción */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Descripción <span className="text-red-500">*</span>
            </Label>
            <span className="text-xs text-gray-500">
              {getValues('description')?.length || 0}/500
            </span>
          </div>
          <Textarea
            id="description"
            rows={5}
            placeholder="Describe detalladamente de qué trata tu curso y qué aprenderán los estudiantes..."
            className={`min-h-[120px] ${errors.description ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
            {...register('description')}
            disabled={isLoading}
            maxLength={500}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-500">{errors.description.message as string}</p>
          )}
        </div>

        {/* Categoría y Nivel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Categoría <span className="text-red-500">*</span>
            </Label>
            <Select
              onValueChange={(value) => setValue('category', value, { shouldValidate: true })}
              value={getValues('category')}
              disabled={isLoading}
            >
              <SelectTrigger className={`h-11 ${errors.category ? 'border-red-500 focus:ring-red-500' : ''}`}>
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-500">{errors.category.message as string}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="level" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Nivel del Curso <span className="text-red-500">*</span>
            </Label>
            <Select
              onValueChange={(value: CourseLevel) => setValue('level', value, { shouldValidate: true })}
              value={getValues('level')}
              disabled={isLoading}
            >
              <SelectTrigger className={`h-11 ${errors.level ? 'border-red-500 focus:ring-red-500' : ''}`}>
                <SelectValue placeholder="Selecciona un nivel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner" className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                  <span>Principiante</span>
                </SelectItem>
                <SelectItem value="intermediate" className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                  <span>Intermedio</span>
                </SelectItem>
                <SelectItem value="advanced" className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span>Avanzado</span>
                </SelectItem>
              </SelectContent>
            </Select>
            {errors.level && (
              <p className="mt-1 text-sm text-red-500">{errors.level.message as string}</p>
            )}
          </div>
        </div>

        {/* Precio */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="price" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Precio del Curso <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center space-x-2">
              <Switch
                id="isFree"
                checked={getValues('isFree')}
                onCheckedChange={(checked) => {
                  setValue('isFree', checked, { shouldValidate: true });
                  if (checked) {
                    setValue('price', 0, { shouldValidate: true });
                  }
                }}
                disabled={isLoading}
                className="data-[state=checked]:bg-primary-500"
              />
              <Label htmlFor="isFree" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {getValues('isFree') ? 'Gratuito' : 'De pago'}
              </Label>
            </div>
          </div>
          {!getValues('isFree') ? (
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">$</span>
              </div>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                disabled={isLoading}
                className={`h-11 pl-8 ${errors.price ? 'border-red-500 focus-visible:ring-red-500' : ''}`}
                {...register('price', { valueAsNumber: true })}
              />
            </div>
          ) : (
            <div className="h-11 flex items-center px-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-md">
              Este curso será gratuito para todos los estudiantes
            </div>
          )}
          {errors.price && (
            <p className="mt-1 text-sm text-red-500">{errors.price.message as string}</p>
          )}
        </div>

        {/* Imagen del Curso */}
        <div className="space-y-2 mb-6">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Imagen del Curso <span className="text-red-500">*</span>
          </Label>
          <div className="mt-1">
            <label
              htmlFor="image-upload"
              className={`flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                errors.image 
                  ? 'border-red-500 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20' 
                  : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/70'
              }`}
            >
              {imagePreview ? (
                <div className="relative w-full h-48 md:h-64 rounded-lg overflow-hidden group">
                  <Image
                    src={imagePreview}
                    alt="Vista previa de la imagen del curso"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-medium px-4 py-2 bg-black/50 rounded-md">Cambiar imagen</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                  <svg
                    className="w-10 h-10 mb-3 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    ></path>
                  </svg>
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Haz clic para subir</span> o arrastra una imagen
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    PNG, JPG o WebP (máx. 5MB)
                  </p>
                </div>
              )}
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
                disabled={isLoading}
              />
            </label>
            {errors.image && (
              <p className="mt-1 text-sm text-red-500">{errors.image.message as string}</p>
            )}
          </div>
        </div>
      </div>

      {/* Sección de Requisitos */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="space-y-1 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Requisitos del Curso</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Lista los conocimientos o habilidades previas que los estudiantes deben tener para este curso.
          </p>
        </div>
        
        <div className="space-y-3">
          {getValues('requirements')?.length > 0 ? (
            getValues('requirements')?.map((req, index) => (
              <div key={index} className="flex items-center space-x-2 group">
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    value={req}
                    onChange={(e) => updateArrayField('requirements', index, e.target.value)}
                    placeholder="Ej: Conocimientos básicos de programación"
                    className={`h-10 pl-8 ${errors.requirements?.[index] ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">•</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRequirement(index)}
                  className="h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No hay requisitos añadidos aún
              </p>
            </div>
          )}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addRequirement}
            className="mt-2 text-sm"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-1.5" /> Agregar requisito
          </Button>
          {errors.requirements && (
            <p className="mt-1 text-sm text-red-500">{errors.requirements.message as string}</p>
          )}
        </div>
      </div>

      {/* Sección de Objetivos de Aprendizaje */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="space-y-1 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Lo que aprenderán los estudiantes</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Enumera los objetivos de aprendizaje clave que los estudiantes alcanzarán al completar este curso.
          </p>
        </div>
        
        <div className="space-y-3">
          {getValues('learningOutcomes')?.length > 0 ? (
            getValues('learningOutcomes')?.map((outcome, index) => (
              <div key={index} className="flex items-center space-x-2 group">
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    value={outcome}
                    onChange={(e) => updateArrayField('learningOutcomes', index, e.target.value)}
                    placeholder="Ej: Crear una aplicación web completa con React"
                    className={`h-10 pl-8 ${errors.learningOutcomes?.[index] ? 'border-red-500' : ''}`}
                    disabled={isLoading}
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary-500">✓</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeLearningOutcome(index)}
                  className="h-10 w-10 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                  disabled={isLoading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-6 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No hay objetivos de aprendizaje añadidos aún
              </p>
            </div>
          )}
          
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addLearningOutcome}
            className="mt-2 text-sm"
            disabled={isLoading}
          >
            <Plus className="h-4 w-4 mr-1.5" /> Agregar objetivo de aprendizaje
          </Button>
          {errors.learningOutcomes && (
            <p className="mt-1 text-sm text-red-500">{errors.learningOutcomes.message as string}</p>
          )}
        </div>
      </div>

      {/* Sección de Publicación */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Publicación</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {getValues('isPublished')
                ? 'Tu curso será visible para los estudiantes.'
                : 'Tu curso será guardado como borrador y no será visible hasta que lo publiques.'}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {getValues('isPublished') ? 'Publicado' : 'Borrador'}
            </span>
            <Switch
              id="isPublished"
              checked={getValues('isPublished')}
              onCheckedChange={(checked) => {
                setValue('isPublished', checked, { shouldValidate: true });
              }}
              className="data-[state=checked]:bg-green-500"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
          className="h-11 px-6"
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="h-11 px-8 bg-primary-600 hover:bg-primary-700 focus-visible:ring-primary-500"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEdit ? 'Guardando cambios...' : 'Creando curso...'}
            </>
          ) : isEdit ? (
            'Guardar cambios'
          ) : (
            'Crear curso'
          )}
        </Button>
      </div>
    </form>
  );
};

export default CourseForm;