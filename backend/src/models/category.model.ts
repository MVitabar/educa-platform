import { Schema, model, Types, Document, Model } from 'mongoose';
import slugify from 'slugify';
import { ICategory, ICategoryMethods, ICategoryModel } from '../types/category.types';

// Type-safe model creation helper
function createModel<T, U extends Model<any>, M extends {}>(name: string, schema: Schema<T, U, M>): U {
  return model(name, schema) as unknown as U;
}

const categorySchema = new Schema<ICategory, ICategoryModel, ICategoryMethods>(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      unique: true,
      maxlength: [50, 'El nombre no puede tener más de 50 caracteres']
    },
    slug: {
      type: String,
      unique: true,
      lowercase: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'La descripción no puede tener más de 500 caracteres']
    },
    image: {
      type: String,
      default: 'default-category.jpg'
    },
    icon: {
      type: String,
      default: 'category'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    featured: {
      type: Boolean,
      default: false
    },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null
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
    toObject: { virtuals: true }
  }
);

// Indexes
categorySchema.index({ name: 'text', description: 'text' });
categorySchema.index({ parent: 1 });
categorySchema.index({ featured: 1 });
categorySchema.index({ isActive: 1 });
// Slug index is defined in the field options

// Virtuals
categorySchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'categories',
  justOne: false
});

categorySchema.virtual('subcategories', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
  justOne: false
});

categorySchema.virtual('url').get(function(this: ICategoryDocument) {
  return `/categories/${this.slug}`;
});


// Static Methods
categorySchema.statics.findByName = async function(name: string) {
  return this.find({ 
    name: { $regex: name, $options: 'i' },
    isActive: true 
  }).limit(10).lean();
};

categorySchema.statics.findBySlug = async function(slug: string) {
  return this.findOne({ slug, isActive: true })
    .populate('parent', 'name slug')
    .populate('subcategories', 'name slug')
    .lean();
};

categorySchema.statics.getFeaturedCategories = async function(limit = 10) {
  return this.find({ 
    featured: true, 
    isActive: true 
  })
  .limit(limit)
  .sort({ name: 1 })
  .lean();
};

categorySchema.statics.getPopularCategories = async function(limit = 10) {
  // This would typically use an aggregation to count courses per category
  return this.aggregate([
    {
      $lookup: {
        from: 'courses',
        localField: '_id',
        foreignField: 'categories',
        as: 'courses'
      }
    },
    {
      $addFields: {
        courseCount: { $size: '$courses' }
      }
    },
    { $match: { isActive: true } },
    { $sort: { courseCount: -1 } },
    { $limit: limit },
    {
      $project: {
        name: 1,
        slug: 1,
        description: 1,
        image: 1,
        icon: 1,
        courseCount: 1
      }
    }
  ]);
};

categorySchema.statics.getCategoriesWithCourseCount = async function() {
  return this.aggregate([
    {
      $lookup: {
        from: 'courses',
        let: { categoryId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $in: ['$$categoryId', '$categories'] },
              isPublished: true
            }
          },
          { $count: 'count' }
        ],
        as: 'courseCount'
      }
    },
    {
      $addFields: {
        courseCount: { $arrayElemAt: ['$courseCount.count', 0] }
      }
    },
    { $match: { isActive: true } },
    { $sort: { name: 1 } },
    {
      $project: {
        name: 1,
        slug: 1,
        description: 1,
        image: 1,
        icon: 1,
        courseCount: { $ifNull: ['$courseCount', 0] }
      }
    }
  ]);
};

categorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ isActive: true })
    .sort({ name: 1 })
    .lean();

  // Build category tree
  const buildTree = (parentId: Types.ObjectId | null = null) => {
    return categories
      .filter(cat => 
        (parentId === null && !cat.parent) || 
        (cat.parent && cat.parent.toString() === parentId?.toString())
      )
      .map(cat => ({
        ...cat,
        children: buildTree(cat._id)
      }));
  };

  return buildTree();
};

// Instance Methods
categorySchema.methods.addToFavorites = async function(userId: Types.ObjectId | string) {
  // Implementation would add to user's favorite categories
  return true;
};

categorySchema.methods.isInFavorites = async function(userId: Types.ObjectId | string) {
  // Implementation would check if in user's favorites
  return false;
};

categorySchema.methods.getCourseCount = async function() {
  const Course = this.model('Course');
  return Course.countDocuments({ 
    categories: this._id,
    isPublished: true 
  });
};

// Middleware to update slug when name changes
categorySchema.pre<ICategoryDocument>(['save', 'updateOne'], function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

// Middleware to prevent deleting categories with courses
categorySchema.pre('deleteOne', { document: true }, async function(next) {
  const Course = this.model('Course');
  const courseCount = await Course.countDocuments({ categories: this._id });
  
  if (courseCount > 0) {
    throw new Error('No se puede eliminar una categoría que tiene cursos asignados');
  }
  
  // Remove from parent's subcategories
  if (this.parent) {
    await this.model('Category').updateOne(
      { _id: this.parent },
      { $pull: { subcategories: this._id } }
    );
  }
  
  next();
});

// Create and export the model
const Category = createModel<ICategory, ICategoryModel, ICategoryMethods>('Category', categorySchema);

export { Category };
