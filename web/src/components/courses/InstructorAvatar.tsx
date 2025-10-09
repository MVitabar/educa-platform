import Image from 'next/image';

interface CourseInstructor {
  _id: string;
  name: string;
  avatar?: string | { url: string };
  title?: string;
  rating?: number;
  studentsCount?: number;
}

interface InstructorAvatarProps {
  instructor?: CourseInstructor | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function InstructorAvatar({ 
  instructor, 
  size = 'md',
  className = '' 
}: InstructorAvatarProps) {
  if (!instructor) {
    return (
      <div className={`rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${
        size === 'sm' ? 'h-8 w-8' : 
        size === 'lg' ? 'h-12 w-12' : 
        'h-10 w-10'
      } ${className}`}>
        <span className="text-gray-600 dark:text-gray-300 font-medium">?</span>
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
          new URL(fullUrl); // Will throw if invalid
          return fullUrl;
        }
      }
    } catch {
      return null;
    }
    return null;
  };

  const avatarUrl = getAvatarUrl();
  const sizeClasses = size === 'sm' ? 'h-8 w-8 text-sm' : 
                     size === 'lg' ? 'h-12 w-12 text-lg' : 
                     'h-10 w-10';

  if (!avatarUrl) {
    return (
      <div className={`rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center ${sizeClasses} ${className}`}>
        <span className="text-primary-600 dark:text-primary-200 font-medium">
          {initials}
        </span>
      </div>
    );
  }

  return (
    <div className={`relative ${sizeClasses} ${className}`}>
      <Image
        src={avatarUrl}
        alt={`${instructorName}'s avatar`}
        width={size === 'sm' ? 32 : size === 'lg' ? 48 : 40}
        height={size === 'sm' ? 32 : size === 'lg' ? 48 : 40}
        className="rounded-full object-cover w-full h-full"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = target.nextElementSibling as HTMLElement;
          if (fallback) fallback.style.display = 'flex';
        }}
      />
      <div className="hidden absolute inset-0 rounded-full bg-primary-100 dark:bg-primary-900/30 items-center justify-center">
        <span className="text-primary-600 dark:text-primary-200 font-medium">
          {initials}
        </span>
      </div>
    </div>
  );
}
