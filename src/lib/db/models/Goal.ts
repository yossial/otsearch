import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type GoalStatus = 'active' | 'achieved' | 'discontinued' | 'modified';

export interface ProgressEntry {
  date: Date;
  sessionId: Types.ObjectId;
  rating: number;
  note?: string;
}

export interface GoalDocument extends Document {
  therapistId: Types.ObjectId;
  patientId: Types.ObjectId;
  title: string;
  description?: string;
  targetDate?: Date;
  progressEntries: ProgressEntry[];
  status: GoalStatus;
  achievedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProgressEntrySchema = new Schema<ProgressEntry>(
  {
    date: { type: Date, required: true },
    sessionId: { type: Schema.Types.ObjectId, ref: 'TreatmentSession', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    note: String,
  },
  { _id: false }
);

const GoalSchema = new Schema<GoalDocument>(
  {
    therapistId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    title: { type: String, required: true },
    description: String,
    targetDate: Date,
    progressEntries: { type: [ProgressEntrySchema], default: [] },
    status: {
      type: String,
      enum: ['active', 'achieved', 'discontinued', 'modified'],
      default: 'active',
    },
    achievedDate: Date,
  },
  { timestamps: true }
);

export const Goal: Model<GoalDocument> =
  mongoose.models.Goal ?? mongoose.model<GoalDocument>('Goal', GoalSchema);
