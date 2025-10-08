import { Schema, model, Types, Document, Model } from 'mongoose';
import { ISection, ISectionMethods, ISectionModel } from '../types/section.types';
import { Lesson } from './lesson.model';
import { generateSectionId } from '../utils/generateId';

// Type-safe model creation helper
function createModel<T, U extends Model<any>, M extends {}>(name: string, schema: Schema<T, U, M>): U {
  return model(name, schema) as unknown as U;
}

const sectionSchema = new Schema<ISection, ISectionModel, ISectionMethods>(
  {
    _id: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: [true, 'El título es obligatorio'],
      trim: true,
      maxlength: [100, 'El título no puede tener más de 100 caracteres']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción no puede tener más de 500 caracteres']
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'El curso es obligatorio'],
      index: true
    },
    order: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    isPublished: {
      type: Boolean,
      default: false
    },
    publishedAt: {
      type: Date
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    _id: false // Disable automatic _id generation since we're using custom _id
  }
);

// Indexes
sectionSchema.index({ course: 1, order: 1 }, { unique: true });
sectionSchema.index({ isPublished: 1 });

// Virtuals
sectionSchema.virtual('lessons', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'section',
  options: { sort: { order: 1 } }
});

sectionSchema.virtual('duration', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'section',
  justOne: false,
  options: { match: { isPublished: true } },
  get: function(lessons: any[]) {
    if (!lessons) return 0;
    return lessons.reduce((total, lesson) => total + (lesson.duration || 0), 0);
  }
});

sectionSchema.virtual('lessonCount', {
  ref: 'Lesson',
  localField: '_id',
  foreignField: 'section',
  count: true
});

sectionSchema.virtual('isPreview').get(function(this: ISectionDocument) {
  // A section is in preview if any of its lessons are in preview
  return this.lessons?.some((lesson: any) => lesson.isPreview) || false;
});

// Static Methods
sectionSchema.statics.findByCourse = async function(courseId: Types.ObjectId | string) {
  return this.find({ course: courseId })
    .sort('order')
    .populate('lessons', 'title duration isPublished order isPreview')
    .lean();
};

sectionSchema.statics.findPublishedByCourse = async function(courseId: Types.ObjectId | string) {
  return this.find({ 
    course: courseId,
    isPublished: true 
  })
  .sort('order')
  .populate({
    path: 'lessons',
    match: { isPublished: true },
    select: 'title duration order isPreview videoUrl',
    options: { sort: { order: 1 } }
  })
  .lean();
};

sectionSchema.statics.getNextOrder = async function(courseId: Types.ObjectId | string) {
  const lastSection = await this.findOne({ course: courseId })
    .sort('-order')
    .select('order')
    .lean();
    
  return (lastSection?.order || 0) + 1;
};

sectionSchema.statics.getCourseSectionsWithLessons = async function(courseId: Types.ObjectId | string) {
  return this.aggregate([
    { $match: { course: new Types.ObjectId(courseId.toString()) } },
    { $sort: { order: 1 } },
    {
      $lookup: {
        from: 'lessons',
        let: { sectionId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$section', '$$sectionId'] },
              isPublished: true
            }
          },
          { $sort: { order: 1 } },
          {
            $project: {
              contentBlocks: 1,  // Incluir contentBlocks
              duration: 1,
              isPublished: 1,
              isPreview: 1,
              order: 1,
              videoUrl: 1
            }
          }
        ],
        as: 'lessons'
      }
    },
    {
      $project: {
        title: 1,
        description: 1,
        order: 1,
        isPublished: 1,
        lessons: 1,
        duration: { $sum: '$lessons.duration' },
        lessonCount: { $size: '$lessons' },
        isPreview: { $anyElementTrue: '$lessons.isPreview' }
      }
    }
  ]);
};

sectionSchema.statics.reorderSections = async function(
  courseId: Types.ObjectId | string, 
  sectionIds: (Types.ObjectId | string)[]
) {
  const session = await this.startSession();
  session.startTransaction();
  
  try {
    const updates = sectionIds.map((id, index) => ({
      updateOne: {
        filter: { _id: id, course: courseId },
        update: { $set: { order: index } }
      }
    }));
    
    await this.bulkWrite(updates, { session });
    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Instance Methods
sectionSchema.methods.addLesson = async function(
  lessonId: Types.ObjectId | string,
  position?: number
): Promise<boolean> {
  const Lesson = this.model('Lesson');
  
  // If position is not provided, add to the end
  if (typeof position === 'undefined') {
    const lastLesson = await Lesson.findOne({ section: this._id })
      .sort('-order')
      .select('order')
      .lean();
    
    position = (lastLesson?.order || 0) + 1;
  } else {
    // Shift other lessons down
    await Lesson.updateMany(
      { 
        section: this._id, 
        order: { $gte: position } 
      },
      { $inc: { order: 1 } }
    );
  }
  
  // Update the lesson
  await Lesson.findByIdAndUpdate(lessonId, {
    section: this._id,
    order: position,
    course: this.course
  });
  
  return true;
};

sectionSchema.methods.removeLesson = async function(
  lessonId: Types.ObjectId | string
): Promise<boolean> {
  const Lesson = this.model('Lesson');
  
  // Get the lesson to get its order
  const lesson = await Lesson.findById(lessonId);
  if (!lesson) return false;
  
  // Remove the lesson from this section
  await Lesson.findByIdAndUpdate(lessonId, { 
    $unset: { section: '' },
    order: 0
  });
  
  // Shift other lessons up
  await Lesson.updateMany(
    { 
      section: this._id, 
      order: { $gt: lesson.order } 
    },
    { $inc: { order: -1 } }
  );
  
  return true;
};

sectionSchema.methods.reorderLessons = async function(
  lessonIds: (Types.ObjectId | string)[]
): Promise<boolean> {
  const Lesson = this.model('Lesson');
  const session = await this.db.startSession();
  session.startTransaction();
  
  try {
    const updates = lessonIds.map((id, index) => ({
      updateOne: {
        filter: { 
          _id: id, 
          section: this._id 
        },
        update: { $set: { order: index + 1 } }
      }
    }));
    
    await Lesson.bulkWrite(updates, { session });
    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

sectionSchema.methods.getDuration = async function(): Promise<number> {
  const Lesson = this.model('Lesson');
  const result = await Lesson.aggregate([
    { $match: { section: this._id, isPublished: true } },
    { $group: { _id: null, total: { $sum: '$duration' } } }
  ]);
  
  return result.length > 0 ? result[0].total : 0;
};

// Middleware
type SectionDocument = ISectionDocument & { _id: Types.ObjectId };

// Update publishedAt when isPublished changes
sectionSchema.pre<SectionDocument>('save', function(next) {
  if (this.isModified('isPublished') && this.isPublished) {
    this.publishedAt = new Date();
  }
  next();
});

// No need to update section count as we're using countDocuments()

// Remove all lessons in this section when it's removed
sectionSchema.post<SectionDocument>('remove', async function(doc) {
  const Lesson = this.model('Lesson');
  await Lesson.deleteMany({ section: doc._id });
});

// Create and export the model
const Section = createModel<ISection, ISectionModel, ISectionMethods>('Section', sectionSchema);

export { Section };
