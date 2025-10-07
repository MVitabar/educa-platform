import { Schema, model, Document } from 'mongoose';
import { IUser } from '../types/user.types';

export interface IResource extends Document {
  title: string;
  description?: string;
  url: string;
  type: string;
  lesson: Schema.Types.ObjectId;
  uploadedBy: Schema.Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
}

const resourceSchema = new Schema<IResource>(
  {
    title: {
      type: String,
      required: [true, 'El título es requerido'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'La URL del recurso es requerida'],
    },
    type: {
      type: String,
      required: [true, 'El tipo de recurso es requerido'],
      enum: {
        values: ['video', 'document', 'link', 'file'],
        message: 'Tipo de recurso no válido',
      },
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: [true, 'La lección es requerida'],
    },
    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El usuario que sube el recurso es requerido'],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
resourceSchema.index({ lesson: 1 });
resourceSchema.index({ uploadedBy: 1 });

export const Resource = model<IResource>('Resource', resourceSchema);
