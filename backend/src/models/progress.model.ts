import { Schema, model, Types, Document, Model } from 'mongoose';
import { 
  IProgress, 
  IProgressMethods, 
  IProgressModel, 
  ProgressStatus,
  TrackProgressInput,
  CompleteLessonInput
} from '../types/progress.types';

// Type-safe model creation helper
function createModel<T, U extends Model<any>, M extends {}>(name: string, schema: Schema<T, U, M>): U {
  return model(name, schema) as unknown as U;
}

const progressSchema = new Schema<IProgress, IProgressModel, IProgressMethods>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario es obligatorio'],
      index: true
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'El curso es obligatorio'],
      index: true
    },
    completedLessons: [{
      lesson: {
        type: Schema.Types.ObjectId,
        ref: 'Lesson',
        required: [true, 'La lección es obligatoria']
      },
      completedAt: {
        type: Date,
        default: null
      },
      lastAccessed: {
        type: Date,
        default: Date.now
      },
      progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
      },
      status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed'],
        default: 'not_started'
      },
      timeSpent: {
        type: Number, // in seconds
        min: 0,
        default: 0
      },
      notes: {
        type: String,
        trim: true,
        maxlength: [1000, 'Las notas no pueden tener más de 1000 caracteres']
      }
    }],
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    },
    totalLessons: {
      type: Number,
      default: 0,
      min: 0
    },
    completedLessonsCount: {
      type: Number,
      default: 0,
      min: 0
    },
    lastAccessed: {
      type: Date,
      default: Date.now
    },
    startedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
progressSchema.index({ user: 1, course: 1 }, { unique: true });
progressSchema.index({ status: 1 });
progressSchema.index({ progress: 1 });
progressSchema.index({ 'completedLessons.lesson': 1 });

// Virtuals
progressSchema.virtual('timeSpent').get(function(this: IProgressDocument) {
  return this.completedLessons.reduce((total, lesson) => total + (lesson.timeSpent || 0), 0);
});

progressSchema.virtual('completionRate').get(function(this: IProgressDocument) {
  return this.totalLessons > 0 ? this.completedLessonsCount / this.totalLessons : 0;
});

progressSchema.virtual('nextLesson', {
  ref: 'Lesson',
  localField: 'course',
  foreignField: 'course',
  justOne: true,
  options: {
    match: { 
      _id: { $nin: this?.completedLessons?.map((l: any) => l.lesson) || [] } 
    },
    sort: { order: 1 },
    limit: 1
  }
});

progressSchema.virtual('lastLesson', {
  ref: 'Lesson',
  localField: 'completedLessons.lesson',
  foreignField: '_id',
  justOne: true,
  options: {
    sort: { 'completedLessons.lastAccessed': -1 },
    limit: 1
  }
});

// Static Methods
progressSchema.statics.findByUser = async function(
  userId: Types.ObjectId | string,
  courseId?: Types.ObjectId | string
) {
  const query: any = { user: userId };
  if (courseId) {
    query.course = courseId;
  }
  
  return this.find(query)
    .populate('course', 'title image instructor')
    .sort({ updatedAt: -1 });
};

progressSchema.statics.findByCourse = async function(courseId: Types.ObjectId | string) {
  return this.find({ course: courseId })
    .populate('user', 'name email avatar')
    .sort({ progress: -1, updatedAt: -1 });
};

progressSchema.statics.getOrCreate = async function(
  userId: Types.ObjectId | string,
  courseId: Types.ObjectId | string
) {
  const Course = this.model('Course');
  
  // Get total lessons count for the course
  const course = await Course.findById(courseId).select('lessons').lean();
  const totalLessons = course?.lessons?.length || 0;
  
  // Try to find existing progress
  let progress = await this.findOne({ user: userId, course: courseId });
  
  // If no progress exists, create a new one
  if (!progress) {
    progress = new this({
      user: userId,
      course: courseId,
      totalLessons,
      completedLessonsCount: 0,
      progress: 0,
      status: 'not_started',
      startedAt: new Date(),
      lastAccessed: new Date()
    });
    
    await progress.save();
  } else if (progress.totalLessons !== totalLessons) {
    // Update total lessons count if it has changed
    progress.totalLessons = totalLessons;
    await progress.save();
  }
  
  return progress;
};

progressSchema.statics.getCourseStats = async function(courseId: Types.ObjectId | string) {
  const stats = await this.aggregate([
    { $match: { course: new Types.ObjectId(courseId.toString()) } },
    {
      $group: {
        _id: null,
        totalStudents: { $sum: 1 },
        averageProgress: { $avg: '$progress' },
        completedStudents: {
          $sum: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        },
        totalTimeSpent: { $sum: { $sum: '$completedLessons.timeSpent' } }
      }
    },
    {
      $project: {
        _id: 0,
        totalStudents: 1,
        averageProgress: { $round: [{ $ifNull: ['$averageProgress', 0] }, 2] },
        completionRate: {
          $cond: [
            { $eq: ['$totalStudents', 0] },
            0,
            { $divide: ['$completedStudents', '$totalStudents'] }
          ]
        },
        averageTimeSpent: {
          $cond: [
            { $eq: ['$totalStudents', 0] },
            0,
            { $divide: [{ $ifNull: ['$totalTimeSpent', 0] }, '$totalStudents'] }
          ]
        }
      }
    }
  ]);

  // Add progress distribution
  const distribution = await this.aggregate([
    { $match: { course: new Types.ObjectId(courseId.toString()) } },
    {
      $bucket: {
        groupBy: '$progress',
        boundaries: [0, 25, 50, 75, 100],
        default: 'other',
        output: {
          count: { $sum: 1 }
        }
      }
    },
    {
      $project: {
        range: {
          $switch: {
            branches: [
              { case: { $eq: ['$_id', 0] }, then: '0-24%' },
              { case: { $eq: ['$_id', 25] }, then: '25-49%' },
              { case: { $eq: ['$_id', 50] }, then: '50-74%' },
              { case: { $eq: ['$_id', 75] }, then: '75-99%' },
              { case: { $eq: ['$_id', 100] }, then: '100%' },
              { case: { $eq: ['$_id', 'other'] }, then: 'other' }
            ],
            default: 'unknown'
          }
        },
        count: 1,
        _id: 0
      }
    },
    { $sort: { range: 1 } }
  ]);

  // Calculate percentages
  const total = stats[0]?.totalStudents || 0;
  const progressDistribution = distribution.map(item => ({
    range: item.range,
    count: item.count,
    percentage: total > 0 ? parseFloat((item.count / total * 100).toFixed(2)) : 0
  }));

  return {
    totalStudents: stats[0]?.totalStudents || 0,
    averageProgress: stats[0]?.averageProgress || 0,
    completionRate: stats[0]?.completionRate || 0,
    averageTimeSpent: stats[0]?.averageTimeSpent || 0,
    progressDistribution
  };
};

progressSchema.statics.getUserCourseProgress = async function(
  userId: Types.ObjectId | string,
  courseId: Types.ObjectId | string
) {
  const progress = await this.findOne({ user: userId, course: courseId })
    .select('progress completedLessonsCount totalLessons status lastAccessed')
    .lean();

  if (!progress) {
    // If no progress exists, return default values
    const Course = this.model('Course');
    const course = await Course.findById(courseId).select('lessons').lean();
    const totalLessons = course?.lessons?.length || 0;
    
    return {
      progress: 0,
      completedLessons: 0,
      totalLessons,
      status: 'not_started',
      lastAccessed: new Date(),
      timeSpent: 0
    };
  }

  // Calculate time spent from completed lessons
  const timeSpent = progress.completedLessons?.reduce(
    (total: number, lesson: any) => total + (lesson.timeSpent || 0),
    0
  ) || 0;

  return {
    progress: progress.progress || 0,
    completedLessons: progress.completedLessonsCount || 0,
    totalLessons: progress.totalLessons || 0,
    status: progress.status || 'not_started',
    lastAccessed: progress.lastAccessed || new Date(),
    timeSpent
  };
};

// Instance Methods
progressSchema.methods.completeLesson = async function(
  lessonId: Types.ObjectId | string
): Promise<boolean> {
  const now = new Date();
  const lessonIndex = this.completedLessons.findIndex(
    (item: any) => item.lesson.toString() === lessonId.toString()
  );

  if (lessonIndex >= 0) {
    // Update existing lesson progress
    this.completedLessons[lessonIndex].status = 'completed';
    this.completedLessons[lessonIndex].progress = 100;
    this.completedLessons[lessonIndex].completedAt = now;
    this.completedLessons[lessonIndex].lastAccessed = now;
  } else {
    // Add new completed lesson
    this.completedLessons.push({
      lesson: lessonId,
      status: 'completed',
      progress: 100,
      completedAt: now,
      lastAccessed: now,
      timeSpent: 0
    });
    this.completedLessonsCount += 1;
  }

  // Update overall progress
  await this.calculateCourseProgress();
  this.lastAccessed = now;
  
  await this.save();
  return true;
};

progressSchema.methods.updateLessonProgress = async function(
  lessonId: Types.ObjectId | string,
  progress: number
): Promise<boolean> {
  // Ensure progress is between 0 and 100
  const validatedProgress = Math.max(0, Math.min(100, progress));
  const now = new Date();
  
  const lessonIndex = this.completedLessons.findIndex(
    (item: any) => item.lesson.toString() === lessonId.toString()
  );

  if (lessonIndex >= 0) {
    // Update existing lesson progress
    this.completedLessons[lessonIndex].progress = validatedProgress;
    this.completedLessons[lessonIndex].status = 
      validatedProgress >= 90 ? 'completed' : 'in_progress';
    this.completedLessons[lessonIndex].lastAccessed = now;
    
    if (validatedProgress >= 90 && !this.completedLessons[lessonIndex].completedAt) {
      this.completedLessons[lessonIndex].completedAt = now;
    }
  } else {
    // Add new lesson progress
    this.completedLessons.push({
      lesson: lessonId,
      status: validatedProgress >= 90 ? 'completed' : 'in_progress',
      progress: validatedProgress,
      lastAccessed: now,
      completedAt: validatedProgress >= 90 ? now : null,
      timeSpent: 0
    });
    
    if (validatedProgress >= 90) {
      this.completedLessonsCount += 1;
    }
  }

  // Update overall progress
  await this.calculateCourseProgress();
  this.lastAccessed = now;
  
  await this.save();
  return true;
};

progressSchema.methods.calculateCourseProgress = async function(): Promise<number> {
  const Lesson = this.model('Lesson');
  
  // Get total lessons count if not set
  if (!this.totalLessons) {
    const course = await this.model('Course').findById(this.course).select('lessons').lean();
    this.totalLessons = course?.lessons?.length || 0;
  }

  if (this.totalLessons === 0) {
    this.progress = 0;
    this.status = 'not_started';
    return 0;
  }

  // Calculate progress based on completed lessons
  const completedCount = this.completedLessons.filter(
    (item: any) => item.status === 'completed'
  ).length;
  
  this.completedLessonsCount = completedCount;
  this.progress = Math.round((completedCount / this.totalLessons) * 100);
  
  // Update status based on progress
  if (this.progress >= 100) {
    this.status = 'completed';
    this.completedAt = this.completedAt || new Date();
  } else if (this.progress > 0) {
    this.status = 'in_progress';
  } else {
    this.status = 'not_started';
  }

  return this.progress;
};

progressSchema.methods.isLessonCompleted = function(
  lessonId: Types.ObjectId | string
): boolean {
  const lesson = this.completedLessons.find(
    (item: any) => 
      item.lesson.toString() === lessonId.toString() && 
      item.status === 'completed'
  );
  return !!lesson;
};

progressSchema.methods.getLessonProgress = function(
  lessonId: Types.ObjectId | string
): number {
  const lesson = this.completedLessons.find(
    (item: any) => item.lesson.toString() === lessonId.toString()
  );
  return lesson ? lesson.progress : 0;
};

// Middleware
type ProgressDocument = IProgressDocument & { _id: Types.ObjectId };

// Update course stats when progress is saved
progressSchema.post<ProgressDocument>('save', async function(doc) {
  const Course = this.model('Course');
  await Course.updateStats(doc.course);
});

// Create and export the model
const Progress = createModel<IProgress, IProgressModel, IProgressMethods>('Progress', progressSchema);

export { Progress };
