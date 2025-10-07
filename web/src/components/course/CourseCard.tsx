import { CourseResponse } from '@/types/course';
import Link from 'next/link';
import { StarIcon } from '@heroicons/react/24/solid';
import Image from 'next/image';

export default function CourseCard({ course, isAuthenticated = false }: { course: CourseResponse; isAuthenticated?: boolean }) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-neutral-200 dark:border-neutral-700">
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
      
      <div className="p-5">
        <div className="flex items-center mb-3">
          <div className="flex" aria-label={`Calificación: ${course.rating?.average?.toFixed(1) || '0'} de 5 estrellas`}>
            {[...Array(5)].map((_, i) => (
              <StarIcon 
                key={i} 
                className={`h-5 w-5 ${i < Math.floor(course.rating?.average || 0) ? 'text-yellow-500' : 'text-neutral-300 dark:text-neutral-600'}`} 
                aria-hidden="true"
              />
            ))}
          </div>
          <span className="ml-2 text-sm text-neutral-700 dark:text-neutral-300">
            {course.rating?.average ? course.rating.average.toFixed(1) : 'Nuevo'}{' '}
            <span className="text-neutral-500 dark:text-neutral-400">
              ({course.rating?.count || 0} {course.rating?.count === 1 ? 'estudiante' : 'estudiantes'})
            </span>
          </span>
        </div>
        
        <h3 className="text-xl font-bold text-neutral-900 dark:text-white mb-2 line-clamp-2 h-16 leading-tight">
          {course.title}
        </h3>
        
        <p className="text-neutral-700 dark:text-neutral-300 text-sm mb-4 line-clamp-2 h-12 leading-relaxed">
          {course.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mb-4">
          {course.category && (
            <span 
              key={course.category}
              className="bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 text-xs font-medium px-2.5 py-1 rounded-full"
            >
              {course.category}
            </span>
          )}
        </div>
        
        <div className="flex justify-between items-center pt-3 border-t border-neutral-100 dark:border-neutral-700">
          <div>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">Desde </span>
            <span className="text-2xl font-bold text-neutral-900 dark:text-white">
              {typeof course.price === 'number' ? `$${course.price.toFixed(2)}` : 'Gratis'}
            </span>
          </div>
          
{isAuthenticated ? (
            <button 
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 text-sm sm:text-base"
              aria-label={`Inscribirse al curso: ${course.title}`}
            >
              Inscribirse
            </button>
          ) : (
            <Link 
              href={`/login?redirect=/courses/${course.slug}`}
              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 text-sm sm:text-base"
              aria-label="Iniciar sesión para ver detalles del curso"
            >
              Ver detalles
            </Link>
          )}
        </div>
    </div>

    </div>
  );
}
