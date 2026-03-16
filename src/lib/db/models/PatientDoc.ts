import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type PatientDocType =
  | 'referral'
  | 'diagnosis'
  | 'prescription'
  | 'insurance'
  | 'consent'
  | 'scan'
  | 'other';

export interface PatientDocDocument extends Document {
  therapistId: Types.ObjectId;
  patientId: Types.ObjectId;
  type: PatientDocType;
  title: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PatientDocSchema = new Schema<PatientDocDocument>(
  {
    therapistId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    type: {
      type: String,
      enum: ['referral', 'diagnosis', 'prescription', 'insurance', 'consent', 'scan', 'other'],
      required: true,
      default: 'other',
    },
    title: { type: String, required: true },
    fileUrl: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    note: String,
  },
  { timestamps: true }
);

export const PatientDoc: Model<PatientDocDocument> =
  mongoose.models.PatientDoc ?? mongoose.model<PatientDocDocument>('PatientDoc', PatientDocSchema);
