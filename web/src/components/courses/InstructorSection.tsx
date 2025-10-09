import Image from 'next/image';

interface CourseInstructor {
  _id: string;
  name: string;
  avatar?: string | { url: string };
  title?: string;
  rating?: number;
  studentsCount?: number;
}

interface InstructorSectionProps {
  instructor?: CourseInstructor | null;
}

export default function InstructorSection({ instructor }: InstructorSectionProps) {
  if (!instructor) {
    return (
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h3 className="font-medium mb-2">Instructor</h3>
        <div className="text-gray-500">No instructor information available</div>
      </div>
    );
  }

  const instructorName = instructor.name || 'Instructor';
  const initials = instructorName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const getAvatarUrl = (): string | null => {
    if (!instructor?.avatar) return null;
    
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const avatar = instructor.avatar;
    
    try {
      if (typeof avatar === 'string') {
        if (avatar.startsWith('http')) return avatar;
        if (avatar.startsWith('/')) {
          const fullUrl = `${baseUrl}${avatar}`;
          new URL(fullUrl);
          return fullUrl;
        }
      }
    } catch {
      return null;
    }
    return null;
  };

  const avatarUrl = getAvatarUrl();

  return (
    <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
      <h3 className="font-medium mb-2">Instructor</h3>
      <div className="flex items-center space-x-3">
        <div className="relative h-10 w-10">
          {avatarUrl ? (
            <>
              <Image
                src={avatarUrl}
                alt={`${instructorName}'s avatar`}
                width={40}
                height={40}
                className="rounded-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="hidden absolute inset-0 h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 items-center justify-center">
                <span className="text-primary-600 dark:text-primary-200 font-medium">
                  {initials}
                </span>
              </div>
            </>
          ) : (
            <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span className="text-primary-600 dark:text-primary-200 font-medium">
                {initials}
              </span>
            </div>
          )}
        </div>
        <div>
          <h4 className="font-medium">{instructorName}</h4>
          {instructor.title && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {instructor.title}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
