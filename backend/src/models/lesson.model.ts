import { Schema, model, Types, Document, Model } from 'mongoose';
import { ILesson, ILessonMethods, ILessonModel } from '../types/lesson.types';

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
const lessonSchema = new Schema<ILesson, ILessonModel, ILessonMethods>(
  {
    title: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'El contenido es obligatorio'],
    },
    duration: {
      // Duración en minutos
      type: Number,
      required: [true, 'La duración es obligatoria'],
      min: [1, 'La duración debe ser de al menos 1 minuto'],
    },
    videoUrl: String,
    resources: [
      {
        title: String,
        url: String,
        type: {
          type: String,
          enum: ['pdf', 'doc', 'zip', 'other'],
          default: 'other',
        },
      },
    ],
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'El curso es obligatorio'],
    },
    order: {
      type: Number,
      required: [true, 'El orden es obligatorio'],
      min: [1, 'El orden debe ser mayor a 0'],
    },
    isFree: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índice compuesto para garantizar que no haya lecciones duplicadas en el mismo orden dentro de un curso
lessonSchema.index({ course: 1, order: 1 }, { unique: true });

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

// Add static methods
lessonSchema.statics.findByCourse = async function(courseId: Types.ObjectId | string) {
  return this.find({ course: courseId, isPublished: true })
    .sort('order')
    .exec();
};

lessonSchema.statics.findBySection = async function(sectionId: Types.ObjectId | string) {
  return this.find({ section: sectionId, isPublished: true })
    .sort('order')
    .exec();
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
