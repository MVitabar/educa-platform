import { Schema, model, Model, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { IUser, IUserMethods, IUserModel, UserRole } from '../types/user.types';

// Define the schema without explicit generic types first
const userSchema = new Schema({
    // Identification
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
      maxlength: [50, 'El nombre no puede tener más de 50 caracteres']
    },
    email: {
      type: String,
      required: [true, 'El correo electrónico es obligatorio'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, 'Por favor ingresa un correo electrónico válido'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'instructor', 'admin'],
      default: 'student',
    },
    
    // Profile
    username: {
      type: String,
      trim: true,
      minlength: [3, 'El nombre de usuario debe tener al menos 3 caracteres'],
      maxlength: [30, 'El nombre de usuario no puede tener más de 30 caracteres'],
      match: [/^[a-zA-Z0-9_]+$/, 'El nombre de usuario solo puede contener letras, números y guiones bajos'],
    },
    avatar: {
      type: String,
      default: 'default-avatar.png',
    },
    coverImage: {
      type: String,
    },
    profile: {
      bio: { type: String, maxlength: [1000, 'La biografía no puede tener más de 1000 caracteres'] },
      website: { type: String },
      location: { type: String },
      twitter: { type: String },
      linkedin: { type: String },
      github: { type: String },
      skills: [{ type: String }],
      education: [{
        degree: { type: String, required: true },
        field: { type: String, required: true },
        institution: { type: String, required: true },
        year: { type: Number, required: true },
        _id: false
      }],
      experience: [{
        title: { type: String, required: true },
        company: { type: String, required: true },
        location: { type: String },
        from: { type: Date, required: true },
        to: { type: Date },
        current: { type: Boolean, default: false },
        description: { type: String },
        _id: false
      }]
    },
    
    // Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    lastLogin: {
      type: Date,
    },
    loginCount: {
      type: Number,
      default: 0,
    },
    
    // Security
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    
    // Settings
    preferences: {
      language: { type: String, default: 'es' },
      timezone: { type: String, default: 'America/Santiago' },
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      notifications: {
        email: {
          announcements: { type: Boolean, default: true },
          courseUpdates: { type: Boolean, default: true },
          promotional: { type: Boolean, default: false },
        },
        push: {
          announcements: { type: Boolean, default: true },
          courseUpdates: { type: Boolean, true: true },
          messages: { type: Boolean, default: true },
        },
      },
    },
  },
  {
    timestamps: true,
    toJSON: { 
      virtuals: true,
      transform: function(doc, ret: any) {
        // Safely remove sensitive fields
        const fieldsToRemove = [
          'password',
          'passwordChangedAt',
          'passwordResetToken',
          'passwordResetExpires',
          'emailVerificationToken',
          'emailVerificationExpires',
          '__v'
        ];
        
        fieldsToRemove.forEach(field => {
          if (field in ret) {
            delete ret[field];
          }
        });
        
        return ret;
      } 
    },
    toObject: { 
      virtuals: true,
      transform: function(doc, ret: any) {
        // Safely remove sensitive fields
        const fieldsToRemove = [
          'password',
          'passwordChangedAt',
          'passwordResetToken',
          'passwordResetExpires',
          'emailVerificationToken',
          'emailVerificationExpires',
          '__v'
        ];
        
        fieldsToRemove.forEach(field => {
          if (field in ret) {
            delete ret[field];
          }
        });
        
        return ret;
      }
    },
  }
);

// Indexes
userSchema.index({ username: 1 }, { unique: true, sparse: true });
userSchema.index({ 'profile.skills': 1 });
userSchema.index({ role: 1, isActive: 1 });

// Virtuals
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Virtual for courses created by instructor
userSchema.virtual('courses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'instructor',
});

// Virtual for user enrollments
userSchema.virtual('enrollments', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'student',
});

// Virtual for reviews made by user
userSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'user',
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    
    // Set passwordChangedAt if not a new user
    if (!this.isNew) {
      this.passwordChangedAt = new Date(Date.now() - 1000);
    }
    
    next();
  } catch (error: any) {
    next(error);
  }
});

// Pre-save middleware to handle username
userSchema.pre('save', function(next) {
  if (this.isNew && !this.username) {
    // Generate a username from email if not provided
    const baseUsername = this.email.split('@')[0].toLowerCase()
      .replace(/[^a-z0-9_]/g, '')
      .substring(0, 20);
    
    // Add random string to ensure uniqueness
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    this.username = `${baseUsername}${randomSuffix}`;
  }
  next();
});

// Instance Methods
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp: number): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function(): string {
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
    
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  return resetToken;
};

userSchema.methods.createEmailVerificationToken = function(): string {
  const verificationToken = crypto.randomBytes(32).toString('hex');
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');
    
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  
  return verificationToken;
};

userSchema.methods.hasRole = function(roles: UserRole | UserRole[]): boolean {
  if (Array.isArray(roles)) {
    return roles.includes(this.role);
  }
  return this.role === roles;
};

// Static Methods
userSchema.statics.findByEmail = async function(email: string) {
  return this.findOne({ email });
};

userSchema.statics.findByUsername = async function(username: string) {
  return this.findOne({ username });
};

userSchema.statics.findInstructors = async function() {
  return this.find({ role: 'instructor', isActive: true });
};

userSchema.statics.findStudents = async function() {
  return this.find({ role: 'student', isActive: true });
};

userSchema.statics.search = async function(query: string) {
  return this.find({
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { email: { $regex: query, $options: 'i' } },
      { username: { $regex: query, $options: 'i' } },
      { 'profile.skills': { $in: [new RegExp(query, 'i')] } }
    ],
    isActive: true
  }).select('-password -passwordChangedAt -passwordResetToken -passwordResetExpires');
};

userSchema.statics.verifyPasswordResetToken = async function(token: string) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  return this.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });
};

userSchema.statics.verifyEmailToken = async function(token: string) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  
  return this.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  });
};

// Virtual for courses created by the user (if instructor)
userSchema.virtual('createdCourses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'instructor',
  justOne: false
});

// Virtual for user's enrollments in courses
userSchema.virtual('enrollments', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'student',
  justOne: false,
  match: { status: { $in: ['active', 'completed'] } }
});

// Virtual for completed courses
userSchema.virtual('completedCourses', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'student',
  justOne: false,
  match: { status: 'completed' }
});

// Virtual for courses in progress
userSchema.virtual('inProgressCourses', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'student',
  justOne: false,
  match: { 
    status: 'active',
    progress: { $gt: 0, $lt: 100 }
  }
});

// Virtual for saved/wishlist courses
userSchema.virtual('savedCourses', {
  ref: 'Course',
  localField: '_id',
  foreignField: 'savedBy',
  justOne: false
});

// Virtual for reviews made by the user
userSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'user',
  justOne: false
});

// Virtual for certificates earned by the user
userSchema.virtual('certificates', {
  ref: 'Enrollment',
  localField: '_id',
  foreignField: 'student',
  justOne: false,
  match: { 'certificate': { $exists: true, $ne: null } }
});

// Create the model with type assertion
const User = model('User', userSchema) as unknown as IUserModel & Model<IUser, {}, IUserMethods>;

export default User;
