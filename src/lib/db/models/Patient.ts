import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type PatientType = 'direct' | 'child';
export type PatientGender = 'male' | 'female' | 'other' | 'unspecified';
export type PatientStatus = 'active' | 'inactive' | 'archived';
export type InsuranceFund = 'clalit' | 'maccabi' | 'meuhedet' | 'leumit' | 'none';
export type ParentRelationship = 'mother' | 'father' | 'guardian';

export interface NotificationPrefs {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}

export interface ParentInfo {
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  relationship?: ParentRelationship;
  notificationPrefs?: NotificationPrefs;
}

export interface ContactInfo {
  phone?: string;
  email?: string;
  notificationPrefs?: NotificationPrefs;
}

export interface PatientDocument extends Document {
  therapistId: Types.ObjectId;
  type: PatientType;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  gender: PatientGender;
  parentInfo?: ParentInfo;
  contactInfo?: ContactInfo;
  referralSource?: string;
  diagnosisNotes?: string;
  insurance?: InsuranceFund;
  hmoAuthNumber?: string;
  hmoSessionsAuthorized?: number;
  portalUserId?: Types.ObjectId;
  portalInviteToken?: string;
  consentGiven: boolean;
  consentDate: Date;
  consentSignedBy: string;
  lastTreatmentDate?: Date;
  retentionDeleteAfter: Date;
  status: PatientStatus;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationPrefsSchema = new Schema<NotificationPrefs>(
  {
    email: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    whatsapp: { type: Boolean, default: false },
  },
  { _id: false }
);

const ParentInfoSchema = new Schema<ParentInfo>(
  {
    firstName: String,
    lastName: String,
    phone: String,
    email: String,
    relationship: { type: String, enum: ['mother', 'father', 'guardian'] },
    notificationPrefs: { type: NotificationPrefsSchema },
  },
  { _id: false }
);

const ContactInfoSchema = new Schema<ContactInfo>(
  {
    phone: String,
    email: String,
    notificationPrefs: { type: NotificationPrefsSchema },
  },
  { _id: false }
);

const PatientSchema = new Schema<PatientDocument>(
  {
    therapistId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['direct', 'child'], required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date, required: true },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'unspecified'],
      required: true,
    },
    parentInfo: { type: ParentInfoSchema },
    contactInfo: { type: ContactInfoSchema },
    referralSource: String,
    diagnosisNotes: String,
    insurance: { type: String, enum: ['clalit', 'maccabi', 'meuhedet', 'leumit', 'none'] },
    hmoAuthNumber: String,
    hmoSessionsAuthorized: Number,
    portalUserId: { type: Schema.Types.ObjectId, ref: 'PortalUser' },
    portalInviteToken: String,
    consentGiven: { type: Boolean, required: true },
    consentDate: { type: Date, required: true },
    consentSignedBy: { type: String, required: true },
    lastTreatmentDate: Date,
    retentionDeleteAfter: {
      type: Date,
      required: true,
      validate: {
        validator: function (value: Date): boolean {
          // retentionDeleteAfter must be in the future relative to document creation.
          // When `this` is a Document we can compare against its createdAt; otherwise
          // we fall back to now (covers new documents where createdAt is not yet set).
          const doc = this as unknown as PatientDocument;
          const reference: Date = doc?.createdAt instanceof Date ? doc.createdAt : new Date();
          return value > reference;
        },
        message: 'retentionDeleteAfter must be after createdAt',
      },
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      required: true,
      default: 'active',
    },
  },
  { timestamps: true }
);

export const Patient: Model<PatientDocument> =
  mongoose.models.Patient ?? mongoose.model<PatientDocument>('Patient', PatientSchema);
