import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export type NotificationRecipientType = 'therapist' | 'patient' | 'parent';
export type NotificationStatus = 'pending' | 'sent' | 'read';
export type NotificationChannel = 'email' | 'sms' | 'whatsapp' | 'in-app';

export type NotificationType =
  | 'appointment_reminder'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_rescheduled'
  | 'appointment_no_show'
  | 'invoice_issued'
  | 'invoice_paid'
  | 'invoice_overdue'
  | 'session_notes_ready'
  | 'portal_invite'
  | 'portal_login'
  | 'goal_achieved'
  | 'consent_reminder'
  | 'profile_completion_reminder'
  | 'general';

export interface RelatedEntity {
  type: string;
  id: Types.ObjectId;
}

export interface NotificationDocument extends Document {
  recipientId: Types.ObjectId;
  recipientType: NotificationRecipientType;
  type: NotificationType;
  title: string;
  body: string;
  relatedEntity?: RelatedEntity;
  channels: NotificationChannel[];
  status: NotificationStatus;
  readAt?: Date;
  createdAt: Date;
}

const RelatedEntitySchema = new Schema<RelatedEntity>(
  {
    type: { type: String, required: true },
    id: { type: Schema.Types.ObjectId, required: true },
  },
  { _id: false }
);

const NotificationSchema = new Schema<NotificationDocument>(
  {
    recipientId: { type: Schema.Types.ObjectId, required: true, index: true },
    recipientType: {
      type: String,
      enum: ['therapist', 'patient', 'parent'],
      required: true,
    },
    type: {
      type: String,
      enum: [
        'appointment_reminder',
        'appointment_confirmed',
        'appointment_cancelled',
        'appointment_rescheduled',
        'appointment_no_show',
        'invoice_issued',
        'invoice_paid',
        'invoice_overdue',
        'session_notes_ready',
        'portal_invite',
        'portal_login',
        'goal_achieved',
        'consent_reminder',
        'profile_completion_reminder',
        'general',
      ],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    relatedEntity: { type: RelatedEntitySchema },
    channels: [{ type: String, enum: ['email', 'sms', 'whatsapp', 'in-app'] }],
    status: {
      type: String,
      enum: ['pending', 'sent', 'read'],
      default: 'pending',
    },
    readAt: Date,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Notification: Model<NotificationDocument> =
  mongoose.models.Notification ??
  mongoose.model<NotificationDocument>('Notification', NotificationSchema);
