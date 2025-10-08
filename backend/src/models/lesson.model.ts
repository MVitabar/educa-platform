import { Schema, model, Types, Document, Model } from 'mongoose';
import { ILesson, ILessonMethods, ILessonModel } from '../types/lesson.types';
import { generateLessonId } from '../utils/generateId';

// Type-safe model creation helper
function createModel<T, U extends Model<any>, M extends {}>(name: string, schema: Schema<T, U, M>): U {
  return model(name, schema) as unknown as U;
}

// Define the document type with methods
type LessonDocument = Document<unknown, {}, ILesson> & 
  Omit<ILesson, keyof Document> & 
  ILessonMethods & {
    _id: Types.ObjectId;
  };

// Create the schema with proper typing
const contentBlockSchema = new Schema<IContentBlock>({
  type: {
    type: String,
    enum: ['text', 'video', 'video_link', 'pdf', 'document'],
    required: [true, 'El tipo de contenido es obligatorio'],
  },
  content: {
    type: String,
    required: [true, 'El contenido es obligatorio'],
  },
  title: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  duration: {
    type: Number,
    min: 0,
  },
  thumbnailUrl: {
    type: String,
    trim: true,
  },
  fileSize: {
    type: Number,
    min: 0,
  },
  fileType: {
    type: String,
    trim: true,
  },
  order: {
    type: Number,
    required: [true, 'El orden es obligatorio'],
    min: 0,
  },
}, { _id: false });

const resourceSchema = new Schema<IResource>({
  title: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
  },
  url: {
    type: String,
    required: [true, 'La URL es obligatoria'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['document', 'link', 'file', 'pdf', 'video', 'audio', 'image'],
    required: [true, 'El tipo de recurso es obligatorio'],
  },
  description: {
    type: String,
    trim: true,
  },
  fileSize: {
    type: Number,
    min: 0,
  },
  mimeType: {
    type: String,
    trim: true,
  },
  thumbnailUrl: {
    type: String,
    trim: true,
  },
  duration: {
    type: Number,
    min: 0,
  },
}, { _id: false });

const lessonSchema = new Schema<ILesson, ILessonModel, ILessonMethods>(
  {
    _id: {
      type: String,
      default: function() {
        // @ts-ignore - this.section will be available at creation time
        return generateLessonId(this.section);
      }
    },
    description: {
      type: String,
      trim: true,
    },
    contentBlocks: [contentBlockSchema],
    duration: {
      type: Number,
      required: [true, 'La duración es obligatoria'],
      min: [0, 'La duración no puede ser negativa'],
    },
    resources: [resourceSchema],
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'El curso es obligatorio']
    },
    section: {
      type: String,
      ref: 'Section',
      required: [true, 'La sección es obligatoria']
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
    requiresCompletion: {
      type: Boolean,
      default: true,
    },
    prerequisites: [{
      type: Schema.Types.ObjectId,
    }],
    viewCount: {
      type: Number,
      default: 0,
    },
    completionCount: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El creador es obligatorio'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índices para optimizar las consultas
// 1. Índice para búsquedas por sección (usado en el listado de lecciones)
lessonSchema.index({ section: 1 });

// 2. Índice para búsquedas por curso (usado en el dashboard)
lessonSchema.index({ course: 1 });


// Middleware para actualizar el curso cuando se crea o elimina una lección
lessonSchema.post('save', async function (doc) {
  await this.model('Course').findByIdAndUpdate(doc.course, {
    $inc: { lessonCount: 1 },
  });
});

// Middleware para actualizar el curso cuando se elimina una lección
lessonSchema.post('deleteOne', { document: true, query: false }, async function (doc) {
  await this.model('Course').findByIdAndUpdate(doc.course, {
    $inc: { lessonCount: -1 },
  });
});

// Static Methods
lessonSchema.statics.findByCourse = async function(courseId: Types.ObjectId | string) {
  return this.find({ course: courseId })
    .populate('section', 'title')
    .exec();
};

lessonSchema.statics.findBySection = async function(sectionId: Types.ObjectId | string) {
  return this.find({ section: sectionId }).exec();
};

// Add instance methods
lessonSchema.methods.markAsCompleted = async function(userId: Types.ObjectId | string) {
  // Implementation for marking a lesson as completed
  return true;
};

lessonSchema.methods.isCompletedByUser = async function(userId: Types.ObjectId | string) {
  // Implementation to check if a lesson is completed by a user
  return false;
};

// Define the model type
type LessonModel = Model<ILesson, {}, ILessonMethods> & ILessonModel;

// Create and export the model using the type-safe function
const Lesson = createModel<ILesson, LessonModel, ILessonMethods>('Lesson', lessonSchema);
export { Lesson };
