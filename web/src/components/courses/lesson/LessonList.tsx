import Link from 'next/link';
import { LessonWithProgress } from '@/types/lesson';

interface LessonListProps {
  lessons: LessonWithProgress[];
  courseSlug: string;
}

export default function LessonList({ lessons, courseSlug }: LessonListProps) {
  // Agrupar lecciones por sección
  const lessonsBySection = lessons.reduce<Record<string, { section: { _id: string; title: string }; lessons: LessonWithProgress[] }>>((acc, lesson) => {
    const sectionId = lesson.section._id;
    if (!acc[sectionId]) {
      acc[sectionId] = {
        section: lesson.section,
        lessons: [],
      };
    }
    acc[sectionId].lessons.push(lesson);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.values(lessonsBySection).map(({ section, lessons: sectionLessons }) => (
        <div key={section._id} className="border rounded-lg overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 border-b">
            <h3 className="font-medium">{section.title}</h3>
          </div>
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {sectionLessons.map((lesson) => (
              <li key={lesson._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <Link 
                  href={`/courses/${courseSlug}/learn/${lesson._id}`}
                  className="flex items-center p-4"
                >
                  <div className="flex-shrink-0 mr-4">
                    {lesson.completed ? (
                      <span className="text-green-500">✓</span>
                    ) : (
                      <span className="text-gray-400">○</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{lesson.title}</h4>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{Math.ceil(lesson.duration)} min</span>
                      {!lesson.isFree && (
                        <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                          Premium
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4">
                    <span className="text-sm text-gray-500">▶</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
