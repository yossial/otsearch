import { connectDB } from '@/lib/db';
import { Notification } from '@/lib/db/models/Notification';
import type { NotificationType, NotificationRecipientType } from '@/lib/db/models/Notification';

interface CreateNotificationParams {
  recipientId: string;
  recipientType: NotificationRecipientType;
  type: NotificationType;
  title: string;
  body: string;
  relatedEntity?: { type: string; id: string };
}

export async function createNotification(params: CreateNotificationParams): Promise<void> {
  await connectDB();
  await Notification.create([
    {
      recipientId: params.recipientId,
      recipientType: params.recipientType,
      type: params.type,
      title: params.title,
      body: params.body,
      relatedEntity: params.relatedEntity
        ? { type: params.relatedEntity.type, id: params.relatedEntity.id }
        : undefined,
      channels: ['in-app'],
      status: 'pending',
    },
  ]);
}
