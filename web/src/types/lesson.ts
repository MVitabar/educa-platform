export interface Resource {
  _id: string;
  title: string;
  url: string;
  type: 'pdf' | 'doc' | 'zip' | 'other';
}

export interface Section {
  _id: string;
  title: string;
  description?: string;
  order: number;
  course: string; // Course ID
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Lesson {
  _id: string;
  title: string;
  description?: string;
  content: string;
  duration: number; // en minutos
  videoUrl?: string;
  resources: Resource[];
  course: string; // Course ID
  section: Section; // Section ID y detalles
  order: number;
  isFree: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LessonWithProgress extends Omit<Lesson, 'section'> {
  section: {
    _id: string;
    title: string;
  };
  progress?: number; // 0-100
  completed?: boolean;
}

export interface CreateLessonInput {
  title: string;
  description?: string;
  content: string;
  duration: number;
  videoUrl?: string;
  order: number;
  isPreview: boolean;
  isPublished: boolean;
}

export interface LessonFormValues {
  title: string;
  description?: string;
  content: string;
  duration: number;
  videoUrl?: string;
  isPreview: boolean;
  isPublished: boolean;
  sectionId: string;
}
