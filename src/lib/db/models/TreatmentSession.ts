import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type TreatmentSessionStatus = 'draft' | 'signed';

export interface SessionNotes {
  subjective?: string;
  objective?: string;
  assessment?: string;
  plan?: string;
  freeText?: string;
}

export interface TreatmentSessionDocument extends Document {
  therapistId: Types.ObjectId;
  patientId: Types.ObjectId;
  appointmentId?: Types.ObjectId;
  date: Date;
  duration: number;
  notes?: SessionNotes;
  goalsAddressed: Types.ObjectId[];
  fee?: number;
  invoiceId?: Types.ObjectId;
  aiDraftUsed: boolean;
  status: TreatmentSessionStatus;
  signedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SessionNotesSchema = new Schema<SessionNotes>(
  {
    subjective: String,
    objective: String,
    assessment: String,
    plan: String,
    freeText: String,
  },
  { _id: false }
);

const TreatmentSessionSchema = new Schema<TreatmentSessionDocument>(
  {
    therapistId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
    date: { type: Date, required: true },
    duration: { type: Number, required: true },
    notes: { type: SessionNotesSchema },
    goalsAddressed: [{ type: Schema.Types.ObjectId, ref: 'Goal' }],
    fee: Number,
    invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice' },
    aiDraftUsed: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ['draft', 'signed'],
      required: true,
      default: 'draft',
    },
    signedAt: Date,
  },
  { timestamps: true }
);

export const TreatmentSession: Model<TreatmentSessionDocument> =
  mongoose.models.TreatmentSession ??
  mongoose.model<TreatmentSessionDocument>('TreatmentSession', TreatmentSessionSchema);
