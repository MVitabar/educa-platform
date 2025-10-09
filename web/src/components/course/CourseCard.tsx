import { CourseResponse } from '@/types/course';
import Link from 'next/link';
import { StarIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';

export default function CourseCard({ course }: { course: CourseResponse }) {
  // Usar _id en lugar de slug para la URL
  const courseUrl = `/courses/${course._id}`;
  
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-neutral-200 dark:border-neutral-700 h-full flex flex-col">
      <Link href={courseUrl} className="block">
        <div className="relative h-48 w-full">
          {course.image ? (
            typeof course.image === 'string' ? (
              <Image
                src={course.image}
                alt={course.title}
                fill
                priority={true}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : 'url' in course.image ? (
              <Image
                src={course.image.url}
                alt={course.title}
                fill
                priority={true}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center">
                <span className="text-4xl font-bold text-primary-600 dark:text-white">
                  {course.title.charAt(0).toUpperCase()}
                </span>
              </div>
            )
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-neutral-700 dark:to-neutral-800 flex items-center justify-center">
              <span className="text-4xl font-bold text-primary-600 dark:text-white">
                {course.title.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="absolute top-3 right-3 bg-primary-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
            {course.level}
          </div>
        </div>
      </Link>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-center mb-3">
          <div className="flex mr-2" aria-label={`Calificación: ${course.rating?.average?.toFixed(1) || '0'} de 5 estrellas`}>
            {[...Array(5)].map((_, i) => (
              <StarIcon 
                key={i} 
                className={`h-5 w-5 ${i < Math.floor(course.rating?.average || 0) ? 'text-yellow-500' : 'text-neutral-300 dark:text-neutral-600'}`} 
                aria-hidden="true"
              />
            ))}
          </div>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {course.rating?.average ? `${course.rating.average.toFixed(1)} (${course.rating?.count || 0})` : 'Nuevo'}
          </span>
        </div>
        
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2 line-clamp-2">
          <Link href={courseUrl} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            {course.title}
          </Link>
        </h3>
        
        <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-4 line-clamp-2 flex-1">
          {course.description}
        </p>
        
        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">Precio: </span>
            <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
              {typeof course.price === 'number' ? `$${course.price.toFixed(2)}` : 'Gratis'}
            </span>
          </div>
          
          <Link 
            href={courseUrl}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 text-sm"
            aria-label={`Ver detalles del curso: ${course.title}`}
          >
            Ver detalles
          </Link>
        </div>
      </div>
    </div>
  );
}
