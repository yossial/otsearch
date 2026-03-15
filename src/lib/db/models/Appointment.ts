import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type AppointmentType = 'in-person' | 'telehealth' | 'home-visit';
export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no-show';
export type BookedBy = 'therapist' | 'patient';
export type ReminderChannel = 'email' | 'sms' | 'whatsapp';
export type ReminderStatus = 'sent' | 'failed';

export interface ReminderSent {
  channel: ReminderChannel;
  sentAt: Date;
  status: ReminderStatus;
}

export interface AppointmentDocument extends Document {
  therapistId: Types.ObjectId;
  patientId: Types.ObjectId;
  startTime: Date;
  endTime: Date;
  duration: number;
  type: AppointmentType;
  location?: string;
  status: AppointmentStatus;
  bookedBy: BookedBy;
  remindersSent: ReminderSent[];
  cancelledBy?: BookedBy;
  cancellationReason?: string;
  fee?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ReminderSentSchema = new Schema<ReminderSent>(
  {
    channel: { type: String, enum: ['email', 'sms', 'whatsapp'], required: true },
    sentAt: { type: Date, required: true },
    status: { type: String, enum: ['sent', 'failed'], required: true },
  },
  { _id: false }
);

const AppointmentSchema = new Schema<AppointmentDocument>(
  {
    therapistId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    duration: { type: Number, required: true },
    type: {
      type: String,
      enum: ['in-person', 'telehealth', 'home-visit'],
      required: true,
    },
    location: String,
    status: {
      type: String,
      enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'],
      default: 'scheduled',
    },
    bookedBy: { type: String, enum: ['therapist', 'patient'], required: true },
    remindersSent: { type: [ReminderSentSchema], default: [] },
    cancelledBy: { type: String, enum: ['therapist', 'patient'] },
    cancellationReason: String,
    fee: Number,
  },
  { timestamps: true }
);

export const Appointment: Model<AppointmentDocument> =
  mongoose.models.Appointment ??
  mongoose.model<AppointmentDocument>('Appointment', AppointmentSchema);
