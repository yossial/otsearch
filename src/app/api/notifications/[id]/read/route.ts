import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { Notification } from '@/lib/db/models/Notification';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const notification = await Notification.findById(id);
  if (!notification) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (notification.recipientId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  notification.status = 'read';
  notification.readAt = new Date();
  await notification.save();

  return NextResponse.json({ ok: true });
}
