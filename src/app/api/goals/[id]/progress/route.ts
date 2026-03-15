import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { Goal } from '@/lib/db/models/Goal';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { sessionId, rating, note, date } = body;

  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json({ error: 'sessionId is required' }, { status: 400 });
  }
  if (typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'rating must be a number between 1 and 5' }, { status: 400 });
  }

  await connectDB();

  const goal = await Goal.findById(id);
  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
  if (goal.therapistId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const entryDate = (date && typeof date === 'string') ? new Date(date) : new Date();

  goal.progressEntries.push({
    sessionId: sessionId as unknown as import('mongoose').Types.ObjectId,
    rating,
    note: typeof note === 'string' ? note.trim() || undefined : undefined,
    date: entryDate,
  });

  await goal.save();

  // Check if all progress entries have rating >= 4 — suggest status update
  const suggestAchieved =
    goal.status === 'active' &&
    goal.progressEntries.length >= 3 &&
    goal.progressEntries.every((e) => e.rating >= 4);

  const result = goal.toObject() as unknown as Record<string, unknown>;

  return NextResponse.json({
    goal: {
      ...result,
      _id: String(result._id),
      therapistId: String(result.therapistId),
      patientId: String(result.patientId),
    },
    suggestAchieved,
  });
}
