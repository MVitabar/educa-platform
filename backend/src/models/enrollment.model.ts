import { Schema, model, Types, Document, Model } from 'mongoose';
import { IEnrollment, IEnrollmentMethods, IEnrollmentModel, EnrollmentStatus, PaymentStatus } from '../types/enrollment.types';

// Type-safe model creation helper
function createModel<T, U extends Model<any>, M extends {}>(name: string, schema: Schema<T, U, M>): U {
  return model(name, schema) as unknown as U;
}

// Define the document type with methods
type EnrollmentDocument = Document<unknown, {}, IEnrollment> & 
  Omit<IEnrollment, keyof Document> & 
  IEnrollmentMethods & {
    _id: Types.ObjectId;
  };

const enrollmentSchema = new Schema<IEnrollment, IEnrollmentModel, IEnrollmentMethods>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El estudiante es obligatorio'],
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'El curso es obligatorio'],
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    lastAccessed: Date,
    status: {
      type: String,
      enum: ['active', 'completed', 'dropped'],
      default: 'active',
    },
    payment: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD',
      },
      paymentMethod: String,
      transactionId: String,
      status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'refunded'],
        default: 'pending',
      },
      paidAt: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índice compuesto para evitar inscripciones duplicadas
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true });

// Índice para búsquedas comunes
enrollmentSchema.index({ student: 1, status: 1 });
enrollmentSchema.index({ course: 1, status: 1 });

// Middleware para actualizar el contador de estudiantes en el curso
enrollmentSchema.post('save', async function (doc) {
  const Course = this.model('Course');
  await Course.findByIdAndUpdate(doc.course, { $inc: { studentCount: 1 } });
});

// Middleware para actualizar el contador de estudiantes cuando se cancela una inscripción
enrollmentSchema.post('deleteOne', { document: true, query: false }, async function (doc) {
  const Course = this.model('Course');
  await Course.findByIdAndUpdate(doc.course, { $inc: { studentCount: -1 } });
});

// Add static methods
enrollmentSchema.statics.findByStudent = async function(studentId: Types.ObjectId | string) {
  return this.find({ student: studentId })
    .populate('course', 'title image instructor')
    .sort('-enrolledAt')
    .exec();
};

enrollmentSchema.statics.findByCourse = async function(courseId: Types.ObjectId | string) {
  return this.find({ course: courseId })
    .populate('student', 'name email avatar')
    .sort('-enrolledAt')
    .exec();
};

enrollmentSchema.statics.findByStatus = async function(status: EnrollmentStatus) {
  return this.find({ status })
    .populate('student', 'name email')
    .populate('course', 'title')
    .exec();
};

// Add instance methods
enrollmentSchema.methods.updateProgress = async function(lessonId: Types.ObjectId | string, progress: number): Promise<boolean> {
  // Implementation for updating lesson progress
  return true;
};

enrollmentSchema.methods.completeLesson = async function(lessonId: Types.ObjectId | string): Promise<boolean> {
  // Implementation for marking a lesson as completed
  return true;
};

enrollmentSchema.methods.calculateOverallProgress = async function(): Promise<number> {
  // Implementation for calculating overall course progress
  return 0;
};

// Create and export the model using the type-safe function
const Enrollment = createModel<IEnrollment, IEnrollmentModel, IEnrollmentMethods>('Enrollment', enrollmentSchema);

export { Enrollment };
