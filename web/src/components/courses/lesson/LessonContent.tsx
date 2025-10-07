import { Lesson } from '@/types/lesson';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import ResourceList from './ResourceList';

// Cargar el reproductor de video de forma dinámica para SSR
const VideoPlayer = dynamic(() => import('./player/VideoPlayer'), {
  ssr: false,
  loading: () => (
    <div className="aspect-w-16 aspect-h-9 bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg"></div>
  ),
});

// Cargar el visor de markdown de forma dinámica para SSR
const MarkdownViewer = dynamic(() => import('./player/MarkdownViewer'), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse"></div>
    </div>
  ),
});

interface LessonContentProps {
  lesson: Lesson;
}

export default function LessonContent({ lesson }: LessonContentProps) {
  return (
    <div className="space-y-6">
      {lesson.videoUrl && (
        <div className="aspect-w-16 aspect-h-9 rounded-lg overflow-hidden bg-black">
          <Suspense fallback={
            <div className="w-full h-full flex items-center justify-center bg-gray-900">
              <div className="text-white">Cargando video...</div>
            </div>
          }>
            <VideoPlayer src={lesson.videoUrl} />
          </Suspense>
        </div>
      )}

      <div className="prose dark:prose-invert max-w-none">
        <h1 className="text-2xl font-bold mb-4">{lesson.title}</h1>
        
        {lesson.description && (
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            {lesson.description}
          </p>
        )}

        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <Suspense fallback={
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 animate-pulse"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
            </div>
          }>
            <MarkdownViewer content={lesson.content} />
          </Suspense>
        </div>
      </div>

      {lesson.resources && lesson.resources.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Recursos de la lección</h3>
          <ResourceList resources={lesson.resources} />
        </div>
      )}
    </div>
  );
}
