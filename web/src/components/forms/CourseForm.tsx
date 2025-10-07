'use client';

// Update imports to use named exports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FileUploadSimple } from '@/components/ui/file-upload-simple';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, X } from 'lucide-react';
import { type CourseLevel, type CourseResponse } from '@/types/course';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useState } from 'react';
import { uploadFile } from '@/services/upload.service';



// Define the form input type
interface CloudinaryImage {
  url: string;
  public_id: string;
  format: string;
  resource_type: 'image' | 'video' | 'raw';
  width?: number;
  height?: number;
  bytes: number;
}


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
    initialData.image 
      ? typeof initialData.image === 'string' 
        ? initialData.image 
        : 'url' in initialData.image 
          ? (initialData.image as CloudinaryImage).url 
          : null
      : null
  );
  const router = useRouter();

  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseSchema) as unknown as Resolver<CourseFormValues, object>,
    defaultValues: {
      title: initialData.title || '',
      description: initialData.description || '',
      category: initialData.category || '',
      price: initialData.price || 0,
      level: (initialData.level || 'beginner') as CourseLevel,
      isFree: initialData.isFree !== undefined ? initialData.isFree : false,
      requirements: initialData.requirements || [],
      learningOutcomes: initialData.learningOutcomes || [],
      isPublished: initialData.isPublished !== undefined ? initialData.isPublished : true,
      image: undefined
    },
    mode: 'onChange',
    reValidateMode: 'onChange'
  });

  // Handle image file selection and upload to Cloudinary
  const handleImageChange = async (file: File) => {
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato de archivo no soportado. Por favor, sube una imagen JPG, PNG o WebP.');
      return;
    }

    // Validate file size (5MB maximum)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error(`El archivo es demasiado grande. Tamaño máximo: ${maxSize / 1024 / 1024}MB`);
      return;
    }

    try {
      setIsLoading(true);
      // Show preview
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Upload to Cloudinary
      const response = await uploadFile(file);
      
      if (response.success) {
        // Store the Cloudinary response in the form
        setValue('image', response.data, { shouldValidate: true });
        toast.success('Imagen subida correctamente');
      }
    } catch (error) {
      console.error('Error al subir la imagen:', error);
      toast.error('Error al subir la imagen');
      setImagePreview(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const onSubmit: SubmitHandler<CourseFormValues> = async (formData: CourseFormValues) => {
    try {
      setIsLoading(true);
      
      // 0. Verificar autenticación primero
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        console.error('No se encontró el token de autenticación');
        const redirectPath = encodeURIComponent(window.location.pathname);
        window.location.href = `/login?redirect=${redirectPath}`;
        return;
      }
      
      // Verificar el token antes de continuar
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        console.log('Token payload:', tokenPayload);
        console.log('User ID from token:', tokenPayload.userId);
        console.log('User role from token:', tokenPayload.role);
      } catch (error) {
        console.error('Error al decodificar el token:', error);
      }
      
      // 1. Preparar los datos del formulario
      const data = {
        ...formData,
        price: formData.isFree ? 0 : (Number(formData.price) || 0),
        requirements: Array.isArray(formData.requirements) 
          ? formData.requirements.filter(Boolean).map((r: string) => r.trim()) 
          : [],
        learningOutcomes: Array.isArray(formData.learningOutcomes) 
          ? formData.learningOutcomes.filter(Boolean).map((lo: string) => lo.trim())
          : [],
        isFree: Boolean(formData.isFree),
        isPublished: Boolean(formData.isPublished)
      };
      
      // 1. Preparar los datos del formulario
      const courseData = {
        title: data.title?.trim() || '',
        description: data.description?.trim() || '',
        category: data.category?.trim() || '',
        price: data.isFree ? 0 : (Number(data.price) || 0),
        level: data.level || 'beginner',
        isFree: Boolean(data.isFree),
        requirements: Array.isArray(data.requirements) 
          ? data.requirements.filter(Boolean).map(r => r.trim()) 
          : [],
        learningOutcomes: Array.isArray(data.learningOutcomes) 
          ? data.learningOutcomes.filter(Boolean).map(lo => lo.trim())
          : [],
        isPublished: Boolean(data.isPublished),
        // Add image data if available
        ...(data.image && typeof data.image === 'object' && {
          image: {
            url: data.image.url,
            public_id: data.image.public_id,
            format: data.image.format,
            resource_type: data.image.resource_type,
            ...(data.image.width && { width: data.image.width }),
            ...(data.image.height && { height: data.image.height }),
            bytes: data.image.bytes
          }
        })
      };

      // 2. Validar campos requeridos
      const errors = [];
      if (!courseData.title) errors.push('El título es obligatorio');
      if (!courseData.description) errors.push('La descripción es obligatoria');
      if (!courseData.category) errors.push('La categoría es obligatoria');
      
      if (errors.length > 0) {
        throw new Error(errors.join('\n'));
      }
      if (isNaN(courseData.price)) errors.push('El precio debe ser un número válido');
      
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      // 3. Mostrar los datos en la consola para depuración
      console.log('Datos a enviar:', JSON.stringify(courseData, null, 2));
      
      const url = isEdit && initialData._id 
        ? `${process.env.NEXT_PUBLIC_API_URL}/courses/${initialData._id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/courses`;
      
      const method = isEdit ? 'PUT' : 'POST';
      
      // No verificamos la autenticación aquí, dejamos que el backend maneje la autenticación
      // Esto evita problemas si el endpoint de verificación falla
      console.log('Enviando solicitud de actualización del curso...');

      // 7. Preparar los datos para enviar
      const requestData = {
        ...courseData,
        // Asegurarse de que los arrays no sean undefined
        requirements: courseData.requirements || [],
        learningOutcomes: courseData.learningOutcomes || [],
        // Incluir la imagen si existe
        ...(data.image && typeof data.image === 'object' && {
          image: {
            url: data.image.url,
            public_id: data.image.public_id,
            format: data.image.format,
            resource_type: data.image.resource_type || 'image',
            ...(data.image.width && { width: data.image.width }),
            ...(data.image.height && { height: data.image.height }),
            bytes: data.image.bytes
          }
        })
      };
      
      console.log('Datos de la imagen a enviar:', requestData.image);

      // 8. Configurar las opciones de la petición
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Requested-With': 'XMLHttpRequest'
      };
      
      console.log('Token being sent:', token ? `${token.substring(0, 10)}...` : 'No token');

      const options: RequestInit = {
        method,
        headers,
        body: JSON.stringify(requestData),
        credentials: 'include' as RequestCredentials
      };
      
      console.log('Enviando solicitud al servidor...');
      console.log('URL:', url);
      console.log('Método:', method);
      console.log('Headers:', headers);
      console.log('Datos enviados:', requestData);

            // 9. Make the request
      const response = await fetch(url, options);

      // 10. Process the response
      const responseData = await response.json();
      console.log('Server response:', response.status, responseData);

      if (!response.ok) {
        // Si el error es de autenticación, limpiar el token y redirigir al login
        if (response.status === 401 || response.status === 403) {
          console.error('Error de autenticación, redirigiendo al login...');
          localStorage.removeItem('token'); // Limpiar token inválido
          const redirectPath = encodeURIComponent(window.location.pathname);
          window.location.href = `/login?redirect=${redirectPath}`;
          return;
        }
        
        // Para otros errores, mostrar el mensaje del servidor o un mensaje genérico
        const errorMessage = responseData.message || 'Error al guardar el curso';
        console.error('Error en la respuesta del servidor:', errorMessage);
        throw new Error(errorMessage);
      }

      // Verify the response has the expected format
      if (!responseData.data) {
        console.error('Unexpected response format:', responseData);
        throw new Error('El servidor devolvió una respuesta inesperada');
      }

      const createdCourse = responseData.data;
      console.log('Course created/updated:', createdCourse);
      
      toast.success(isEdit ? 'Curso actualizado correctamente' : 'Curso creado correctamente');
      
      if (onSuccess) {
        onSuccess(); // Pass the created course to the onSuccess callback
      } else if (!isEdit) {
        // Use the course ID from the response for redirection
        if (createdCourse._id) {
          router.push(`/instructor/courses/${createdCourse._id}`);
        } else {
          console.warn('No se pudo obtener el ID del curso de la respuesta');
          router.push('/instructor/courses');
        }
      }
    } catch (error) {
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

  const { register, formState: { errors }, setValue, getValues } = form;
  
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
            <FileUploadSimple
              onFileSelected={handleImageChange}
              previewUrl={imagePreview}
              accept="image/*"
              maxSize={5 * 1024 * 1024} // 5MB
              label="Arrastra y suelta la imagen del curso aquí, o haz clic para seleccionar"
              buttonText="Seleccionar imagen"
              className={errors.image ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : ''}
            />
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
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background px-8 h-11 text-sm font-medium transition-colors hover:bg-gray-50 hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border-gray-300 text-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          disabled={isLoading}
        >
          Cancelar
        </button>
        <button 
          type="submit"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary px-8 h-11 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary-600 hover:bg-primary-700 focus-visible:ring-primary-500"
          disabled={isLoading}
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
        </button>
      </div>
    </form>
  );
}

export default CourseForm;
