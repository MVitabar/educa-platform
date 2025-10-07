// Tipos para las secciones y lecciones

export interface Resource {
  _id: string;
  title: string;
  url: string;
  type: 'file' | 'link' | 'video' | 'document';
}

export interface LessonInSection {
  _id: string;
  title: string;
  description?: string;
  content: string;
  duration: number;
  isPublished: boolean;
  isPreview: boolean;
  order: number;
  videoUrl?: string;
  resources?: Resource[];
  sectionId: string;
  courseId: string;
  createdAt: string;
  updatedAt: string;
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
  lessons: LessonInSection[];
  lessonCount: number;
  duration: number;
  isPreview: boolean;
  createdBy: string;
  updatedBy: string;
  publishedAt?: string;
}

export interface SectionWithLessons extends Omit<Section, 'lessons'> {
  lessons: Array<{
    _id: string;
    title: string;
    duration: number;
    isPublished: boolean;
    isPreview: boolean;
    order: number;
    videoUrl?: string;
  }>;
}

export interface SectionFormValues {
  title: string;
  description?: string;
  isPublished: boolean;
  order: number;
}

export interface CreateSectionInput {
  title: string;
  description?: string;
  course: string;
  order?: number;
  isPublished?: boolean;
}

export interface UpdateSectionInput {
  id: string;
  title?: string;
  description?: string;
  order?: number;
  isPublished?: boolean;
}

export interface ReorderSectionsInput {
  courseId: string;
  sections: Array<{
    id: string;
    order: number;
  }>;
}
