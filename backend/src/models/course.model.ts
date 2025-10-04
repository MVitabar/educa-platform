import { Schema, model, Types, Document, Model, HydratedDocument } from 'mongoose';
import { ICourse, ICourseMethods } from '../types/course.types';

// Define a simpler document type
type CourseDocument = Document<unknown, {}, ICourse> & ICourse & ICourseMethods;

// Define model interface with static methods
interface ICourseModel extends Model<ICourse, {}, ICourseMethods> {
  findByInstructor(instructorId: string | Types.ObjectId): Promise<CourseDocument[]>;
  findByCategory(category: string): Promise<CourseDocument[]>;
  search(query: string): Promise<CourseDocument[]>;
  getFeaturedCourses(limit?: number): Promise<CourseDocument[]>;
  getPopularCourses(limit?: number): Promise<CourseDocument[]>;
  getNewestCourses(limit?: number): Promise<CourseDocument[]>;
}

// Create schema without explicit generic types first
const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      maxlength: [100, 'El título no puede tener más de 100 caracteres'],
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [200, 'El subtítulo no puede tener más de 200 caracteres'],
    },
    description: {
      type: String,
      required: [true, 'La descripción es obligatoria'],
    },
    instructor: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El instructor es obligatorio'],
    },
    category: {
      type: String,
      required: [true, 'La categoría es obligatoria'],
      enum: {
        values: [
          'programming',
          'design',
          'business',
          'marketing',
          'languages',
          'music',
          'photography',
          'other',
        ],
        message: 'Categoría no válida',
      },
    },
    price: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    duration: {
      type: Number,
      min: [0, 'La duración no puede ser negativa'],
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    image: {
      type: String,
      default: 'default-course.jpg',
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: [0, 'La calificación no puede ser menor a 0'],
        max: [5, 'La calificación no puede ser mayor a 5'],
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    requirements: [String],
    learningOutcomes: [String],
    tags: [String],
    slug: {
      type: String,
      unique: true,
      lowercase: true
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Índices para mejorar el rendimiento de búsquedas
courseSchema.index({ title: 'text', description: 'text' });
courseSchema.index({ instructor: 1, isPublished: 1 });
courseSchema.index({ category: 1, isPublished: 1 });
courseSchema.index({ price: 1, isPublished: 1 });
courseSchema.index({ rating: -1, isPublished: 1 });

// Virtuals
courseSchema.virtual('lessons', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'course',
  justOne: false
});

courseSchema.virtual('enrollments', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'course',
  justOne: false
});

courseSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'course',
  justOne: false
});

courseSchema.virtual('totalStudents', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'course',
  count: true
});

courseSchema.virtual('totalLessons', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'course',
  count: true
});

// Instance Methods
courseSchema.methods.calculateAverageRating = async function(): Promise<void> {
  const Review = model('Review');
  const stats = await Review.aggregate([
    {
      $match: { course: this._id }
    },
    {
      $group: {
        _id: '$course',
        averageRating: { $avg: '$rating' },
        numOfReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    this.rating = {
      average: Math.round((stats[0].averageRating || 0) * 10) / 10,
      count: stats[0].numOfReviews || 0
    };
  } else {
    this.rating = {
      average: 0,
      count: 0
    };
  }

  await this.save();
};

// Instance Methods
courseSchema.methods.isInstructor = function(userId: string | Types.ObjectId): boolean {
  if (!this.instructor) return false;
  
  // Convert userId to string for comparison
  const userIdStr = userId instanceof Types.ObjectId ? userId.toString() : userId;
  
  try {
    // Handle different possible types of instructor field
    if (this.instructor instanceof Types.ObjectId) {
      return this.instructor.toString() === userIdStr;
    }
    
    // Handle case where instructor is a populated user document
    if (this.instructor && typeof this.instructor === 'object') {
      const instructor = this.instructor as { _id?: Types.ObjectId | string };
      if (instructor._id) {
        const instructorId = instructor._id instanceof Types.ObjectId 
          ? instructor._id.toString() 
          : instructor._id;
        return instructorId === userIdStr;
      }
    }
    
    // Handle case where instructor is a string
    if (typeof this.instructor === 'string') {
      return this.instructor === userIdStr;
    }
    
    return false;
  } catch (error) {
    console.error('Error in isInstructor:', error);
    return false;
  }
};

courseSchema.methods.isEnrolled = async function(userId: string | Types.ObjectId): Promise<boolean> {
  try {
    const Enrollment = model('Enrollment');
    const count = await Enrollment.countDocuments({
      course: this._id,
      student: userId,
      status: { $in: ['active', 'completed'] }
    }).exec();
    return count > 0;
  } catch (error) {
    console.error('Error checking enrollment status:', error);
    return false;
  }
};

courseSchema.methods.addStudent = async function(): Promise<CourseDocument> {
  this.studentsEnrolled = (this.studentsEnrolled || 0) + 1;
  return this.save() as unknown as Promise<CourseDocument>;
};

courseSchema.methods.updateRating = async function(newRating: number): Promise<CourseDocument> {
  const totalRatings = (this.rating?.count || 0) + 1;
  const currentAverage = this.rating?.average || 0;
  const newAverage = ((currentAverage * (totalRatings - 1)) + newRating) / totalRatings;
  
  this.rating = {
    average: parseFloat(newAverage.toFixed(1)),
    count: totalRatings
  };
  
  return this.save() as unknown as Promise<CourseDocument>;
};

// Add static methods to the schema
courseSchema.statics.findByInstructor = async function(instructorId: string | Types.ObjectId) {
  const courses = await this.find({ 
    instructor: instructorId, 
    isPublished: true 
  })
  .sort({ createdAt: -1 })
  .exec();
  return courses as unknown as CourseDocument[];
};

courseSchema.statics.findByCategory = async function(category: string) {
  const courses = await this.find({ category, isPublished: true })
    .sort({ 'rating.average': -1, createdAt: -1 })
    .exec();
  return courses as unknown as CourseDocument[];
};

courseSchema.statics.search = async function(query: string) {
  const courses = await this.find(
    { $text: { $search: query }, isPublished: true },
    { score: { $meta: 'textScore' } }
  )
  .sort({ score: { $meta: 'textScore' } })
  .exec();
  return courses as unknown as CourseDocument[];
};

courseSchema.statics.getFeaturedCourses = async function(limit: number = 10) {
  const courses = await this.find({ isFeatured: true, isPublished: true })
    .sort({ 'rating.average': -1, studentsEnrolled: -1 })
    .limit(limit)
    .exec();
  return courses as unknown as CourseDocument[];
};

courseSchema.statics.getPopularCourses = async function(limit: number = 10) {
  const courses = await this.find({ isPublished: true })
    .sort({ studentsEnrolled: -1, 'rating.average': -1 })
    .limit(limit)
    .exec();
  return courses as unknown as CourseDocument[];
};

courseSchema.statics.getNewestCourses = async function(limit: number = 10) {
  const courses = await this.find({ isPublished: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .exec();
  return courses as unknown as CourseDocument[];
};

// Middleware
courseSchema.pre('save', function(next) {
  if (this.isModified('title')) {
    // Use type assertion to allow setting the slug
    (this as any).slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
  next();
});

courseSchema.pre(/^find/, function(this: any, next) {
  this.populate({
    path: 'instructor',
    select: 'name email avatar role'
  });
  next();
});

// Create and export the model with type assertion
const Course = model('Course', courseSchema) as unknown as ICourseModel & Model<ICourse, {}, ICourseMethods>;

export default Course;
