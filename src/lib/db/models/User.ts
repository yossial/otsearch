import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { UserRole } from '@/types';

export interface UserDocument extends Document {
  email: string;
  passwordHash: string; // empty string for OAuth-only users
  role: UserRole | null; // null until the user completes role selection
  name: string;
  emailVerified: boolean;
  emailVerifyToken: string | null;
  emailVerifyTokenExpiry: Date | null;
  passwordResetToken: string | null;
  passwordResetTokenExpiry: Date | null;
  otProfileId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: '' },
    role: { type: String, enum: ['ot', 'patient', 'admin', null], default: null },
    name: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, default: null },
    emailVerifyTokenExpiry: { type: Date, default: null },
    passwordResetToken: { type: String, default: null },
    passwordResetTokenExpiry: { type: Date, default: null },
    otProfileId: { type: Schema.Types.ObjectId, ref: 'OTProfile', default: null },
  },
  { timestamps: true }
);

export const User: Model<UserDocument> =
  mongoose.models.User ?? mongoose.model<UserDocument>('User', UserSchema);
