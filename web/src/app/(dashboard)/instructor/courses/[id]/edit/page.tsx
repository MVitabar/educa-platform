'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'react-hot-toast';
import CourseForm from '@/components/forms/CourseForm';
import { CourseResponse } from '@/types/course';

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;
  const [initialData, setInitialData] = useState<Partial<CourseResponse>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Cargar los datos del curso
  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;
      
      try {
        setIsLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login?redirect=/instructor/courses');
          return;
        }

        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/courses/${courseId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Error al cargar el curso');
        }

        const responseData = await response.json();
        
        // Extraer los datos de la respuesta
        const courseData = responseData.data || responseData;
        
        // Asegurarse de que los datos tengan el formato correcto
        const formattedData = {
          ...courseData,
          // Asegurar que los arrays no sean undefined
          requirements: courseData.requirements || [],
          learningOutcomes: courseData.learningOutcomes || [],
          // Asegurar que el precio sea un número
          price: Number(courseData.price) || 0,
          // Asegurar que los booleanos tengan un valor por defecto
          isFree: courseData.isFree !== undefined ? Boolean(courseData.isFree) : false,
          isPublished: courseData.isPublished !== undefined ? Boolean(courseData.isPublished) : true
        };
        
        console.log('Datos del curso cargados:', formattedData);
        setInitialData(formattedData);
      } catch (error) {
        console.error('Error al cargar el curso:', error);
        toast.error('Error al cargar el curso');
        router.push('/instructor/courses');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [courseId, router]);

  const handleSuccess = () => {
    toast.success('Curso actualizado correctamente');
    router.push('/instructor/courses');
  };

  if (isLoading || Object.keys(initialData).length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Editar Curso</h1>
      <CourseForm 
        initialData={initialData}
        isEdit={true}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
