import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { Notification } from '@/lib/db/models/Notification';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const unreadOnly = sp.get('unread') === 'true';
  const limit = Math.min(50, Math.max(1, parseInt(sp.get('limit') ?? '10', 10)));

  await connectDB();

  const filter: Record<string, unknown> = {
    recipientId: session.user.id,
    recipientType: 'therapist',
  };
  if (unreadOnly) {
    filter.status = { $in: ['pending', 'sent'] };
  }

  const docs = await Notification.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const notifications = docs.map((n) => ({
    ...n,
    _id: String(n._id),
    recipientId: String(n.recipientId),
  }));

  const unreadCount = await Notification.countDocuments({
    recipientId: session.user.id,
    recipientType: 'therapist',
    status: { $in: ['pending', 'sent'] },
  });

  return NextResponse.json({ notifications, unreadCount });
}
