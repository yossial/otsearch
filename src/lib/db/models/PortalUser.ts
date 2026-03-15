import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type PortalUserRole = 'patient' | 'parent';

export interface PortalNotificationPrefs {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
  phone?: string;
}

export interface PortalUserDocument extends Document {
  therapistId: Types.ObjectId;
  patientId: Types.ObjectId;
  email: string;
  passwordHash?: string;
  role: PortalUserRole;
  notificationPrefs: PortalNotificationPrefs;
  consentGiven: boolean;
  consentDate: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PortalNotificationPrefsSchema = new Schema<PortalNotificationPrefs>(
  {
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false },
    phone: String,
  },
  { _id: false }
);

const PortalUserSchema = new Schema<PortalUserDocument>(
  {
    therapistId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    email: { type: String, required: true, lowercase: true, unique: true },
    passwordHash: String,
    role: { type: String, enum: ['patient', 'parent'], required: true },
    notificationPrefs: {
      type: PortalNotificationPrefsSchema,
      default: () => ({ email: false, sms: false, whatsapp: false }),
    },
    consentGiven: { type: Boolean, required: true },
    consentDate: { type: Date, required: true },
    lastLoginAt: Date,
  },
  { timestamps: true }
);

export const PortalUser: Model<PortalUserDocument> =
  mongoose.models.PortalUser ??
  mongoose.model<PortalUserDocument>('PortalUser', PortalUserSchema);
