import { Schema, model, Types, Document, Model } from 'mongoose';
import { IReview, IReviewMethods, IReviewModel, ReviewStatus } from '../types/review.types';

// Type-safe model creation helper
function createModel<T, U extends Model<any>, M extends {}>(name: string, schema: Schema<T, U, M>): U {
  return model(name, schema) as unknown as U;
}

const reviewSchema = new Schema<IReview, IReviewModel, IReviewMethods>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'El curso es obligatorio'],
      index: true
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El estudiante es obligatorio'],
      index: true
    },
    rating: {
      type: Number,
      required: [true, 'La calificación es obligatoria'],
      min: [1, 'La calificación mínima es 1'],
      max: [5, 'La calificación máxima es 5']
    },
    title: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      maxlength: [100, 'El título no puede tener más de 100 caracteres']
    },
    comment: {
      type: String,
      required: [true, 'El comentario es obligatorio'],
      trim: true,
      maxlength: [1000, 'El comentario no puede tener más de 1000 caracteres']
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'rejected'],
        message: 'Estado de revisión no válido'
      },
      default: 'pending'
    },
    helpfulCount: {
      type: Number,
      default: 0,
      min: 0
    },
    reportedBy: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      reason: {
        type: String,
        required: true,
        trim: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }],
    approvedAt: Date
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
reviewSchema.index({ course: 1, student: 1 }, { unique: true });
reviewSchema.index({ status: 1, createdAt: -1 });

// Virtuals
reviewSchema.virtual('isHelpful').get(function(this: IReviewDocument) {
  return this.helpfulCount > 0;
});

// Static Methods
reviewSchema.statics.findByCourse = async function(courseId: Types.ObjectId | string) {
  return this.find({ 
    course: courseId,
    status: 'approved' 
  })
  .populate('student', 'name avatar')
  .sort({ createdAt: -1 })
  .lean();
};

reviewSchema.statics.findByStudent = async function(studentId: Types.ObjectId | string) {
  return this.find({ student: studentId })
    .populate('course', 'title image')
    .sort({ createdAt: -1 })
    .lean();
};

reviewSchema.statics.findByStatus = async function(status: ReviewStatus) {
  return this.find({ status })
    .populate('student', 'name email')
    .populate('course', 'title')
    .sort({ createdAt: -1 })
    .lean();
};

reviewSchema.statics.getAverageRating = async function(courseId: Types.ObjectId | string) {
  const result = await this.aggregate([
    {
      $match: { 
        course: new Types.ObjectId(courseId.toString()),
        status: 'approved'
      }
    },
    {
      $group: {
        _id: '$course',
        averageRating: { $avg: '$rating' },
        numReviews: { $sum: 1 },
        ratingCounts: {
          $push: {
            $cond: [
              { $and: [
                { $gte: ['$rating', 1] },
                { $lte: ['$rating', 5] }
              ]},
              { $toInt: '$rating' },
              null
            ]
          }
        }
      }
    }
  ]);

  if (result.length > 0) {
    const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    result[0].ratingCounts.forEach((rating: number) => {
      if (rating >= 1 && rating <= 5) {
        ratingCounts[rating as keyof typeof ratingCounts]++;
      }
    });

    return {
      average: parseFloat(result[0].averageRating.toFixed(1)),
      count: result[0].numReviews,
      ratingCounts
    };
  }

  return {
    average: 0,
    count: 0,
    ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };
};

// Instance Methods
reviewSchema.methods.markHelpful = async function(userId: Types.ObjectId | string): Promise<boolean> {
  // Implementation would check if user already marked as helpful
  this.helpfulCount += 1;
  await this.save();
  return true;
};

reviewSchema.methods.report = async function(
  reason: string, 
  userId: Types.ObjectId | string
): Promise<boolean> {
  // Check if user already reported
  const alreadyReported = this.reportedBy.some(
    (report: any) => report.user.toString() === userId.toString()
  );

  if (alreadyReported) {
    return false;
  }

  this.reportedBy.push({
    user: userId,
    reason,
    createdAt: new Date()
  });

  await this.save();
  return true;
};

// Middleware to update course rating stats when a review is saved
reviewSchema.post('save', async function(doc) {
  if (doc.status === 'approved') {
    const Course = this.model('Course');
    const stats = await (this.constructor as IReviewModel).getAverageRating(doc.course);
    
    await Course.findByIdAndUpdate(doc.course, {
      'rating.average': stats.average,
      'rating.count': stats.count
    });
  }
});

// Middleware to update course rating stats when a review is removed
reviewSchema.post('remove', async function(doc) {
  const Course = this.model('Course');
  const stats = await (this.constructor as IReviewModel).getAverageRating(doc.course);
  
  await Course.findByIdAndUpdate(doc.course, {
    'rating.average': stats.average,
    'rating.count': stats.count
  });
});

// Create and export the model
const Review = createModel<IReview, IReviewModel, IReviewMethods>('Review', reviewSchema);

export { Review };
