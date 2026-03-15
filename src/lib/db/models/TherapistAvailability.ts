import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type ExceptionType = 'unavailable' | 'special_hours';

export interface WeeklyScheduleEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  sessionDuration: number;
  breakBetween: number;
}

export interface AvailabilityException {
  date: Date;
  type: ExceptionType;
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface TherapistAvailabilityDocument extends Document {
  therapistId: Types.ObjectId;
  weeklySchedule: WeeklyScheduleEntry[];
  exceptions: AvailabilityException[];
  bookingWindowDays: number;
  minNoticeHours: number;
  createdAt: Date;
  updatedAt: Date;
}

const WeeklyScheduleEntrySchema = new Schema<WeeklyScheduleEntry>(
  {
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    sessionDuration: { type: Number, required: true },
    breakBetween: { type: Number, required: true },
  },
  { _id: false }
);

const AvailabilityExceptionSchema = new Schema<AvailabilityException>(
  {
    date: { type: Date, required: true },
    type: { type: String, enum: ['unavailable', 'special_hours'], required: true },
    startTime: String,
    endTime: String,
    reason: String,
  },
  { _id: false }
);

const TherapistAvailabilitySchema = new Schema<TherapistAvailabilityDocument>(
  {
    therapistId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    weeklySchedule: { type: [WeeklyScheduleEntrySchema], default: [] },
    exceptions: { type: [AvailabilityExceptionSchema], default: [] },
    bookingWindowDays: { type: Number, default: 60 },
    minNoticeHours: { type: Number, default: 24 },
  },
  { timestamps: true }
);

export const TherapistAvailability: Model<TherapistAvailabilityDocument> =
  mongoose.models.TherapistAvailability ??
  mongoose.model<TherapistAvailabilityDocument>(
    'TherapistAvailability',
    TherapistAvailabilitySchema
  );
