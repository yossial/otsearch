import mongoose, { Schema, Document, Model, Types } from 'mongoose';
import type { UserRole } from '@/types';

export interface UserDocument extends Document {
  email: string;
  passwordHash: string; // empty string for OAuth-only users
  role: UserRole | null; // null until the user completes onboarding
  name: string;
  emailVerified: boolean;
  emailVerifyToken: string | null;
  emailVerifyTokenExpiry: Date | null;
  passwordResetToken: string | null;
  passwordResetTokenExpiry: Date | null;
  therapistProfileId: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, default: '' },
    role: { type: String, enum: ['therapist', 'admin', null], default: null },
    name: { type: String, required: true },
    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, default: null },
    emailVerifyTokenExpiry: { type: Date, default: null },
    passwordResetToken: { type: String, default: null },
    passwordResetTokenExpiry: { type: Date, default: null },
    therapistProfileId: { type: Schema.Types.ObjectId, ref: 'TherapistProfile', default: null },
  },
  { timestamps: true }
);

export const User: Model<UserDocument> =
  mongoose.models.User ?? mongoose.model<UserDocument>('User', UserSchema);
