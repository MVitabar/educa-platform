'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getLessonsByCourse } from '@/lib/api/lessonService';
import { LessonWithProgress } from '@/types/lesson';

interface LessonNavigationProps {
  courseSlug: string;
  currentLessonId: string;
  courseId: string;
}

export default function LessonNavigation({ 
  courseSlug, 
  currentLessonId,
  courseId
}: LessonNavigationProps) {
  const [lessons, setLessons] = useState<LessonWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        const { data } = await getLessonsByCourse(courseId);
        setLessons(data);
      } catch (error) {
        console.error('Error fetching lessons:', error);
      } finally {
        setLoading(false);
      }
    };

    if (courseId) {
      fetchLessons();
    }
  }, [courseId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
        ))}
      </div>
    );
  }

  const currentIndex = lessons.findIndex(lesson => lesson._id === currentLessonId);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  // Agrupar lecciones por sección
  const sections = lessons.reduce<Record<string, { section: { _id: string; title: string }; lessons: LessonWithProgress[] }>>(
    (acc, lesson) => {
      const sectionId = lesson.section._id;
      if (!acc[sectionId]) {
        acc[sectionId] = {
          section: lesson.section,
          lessons: [],
        };
      }
      acc[sectionId].lessons.push(lesson);
      return acc;
    }, 
    {}
  );

  return (
    <nav className="space-y-4">
      <div className="space-y-2">
        {Object.values(sections).map(({ section, lessons: sectionLessons }) => (
          <div key={section._id} className="space-y-1">
            <h4 className="px-2 py-1 text-sm font-medium text-gray-500 dark:text-gray-400">
              {section.title}
            </h4>
            <ul className="space-y-1">
              {sectionLessons.map((lesson) => (
                <li key={lesson._id}>
                  <button
                    onClick={() => router.push(`/courses/${courseSlug}/learn/${lesson._id}`)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      lesson._id === currentLessonId
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    {lesson.title}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        {prevLesson && (
          <button
            onClick={() => router.push(`/courses/${courseSlug}/learn/${prevLesson._id}`)}
            className="w-full text-left p-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
          >
            ← Lección anterior: {prevLesson.title}
          </button>
        )}
        {nextLesson ? (
          <button
            onClick={() => router.push(`/courses/${courseSlug}/learn/${nextLesson._id}`)}
            className="w-full text-left p-3 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors"
          >
            Siguiente lección: {nextLesson.title} →
          </button>
        ) : (
          <button
            onClick={() => router.push(`/courses/${courseSlug}`)}
            className="w-full text-left p-3 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition-colors"
          >
            Completar curso ✓
          </button>
        )}
      </div>
    </nav>
  );
}
