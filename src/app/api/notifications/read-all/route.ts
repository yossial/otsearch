import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { Notification } from '@/lib/db/models/Notification';

export const dynamic = 'force-dynamic';

export async function PUT() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  await Notification.updateMany(
    {
      recipientId: session.user.id,
      status: { $in: ['pending', 'sent'] },
    },
    { $set: { status: 'read', readAt: new Date() } }
  );

  return NextResponse.json({ ok: true });
}
