import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { Goal } from '@/lib/db/models/Goal';
import type { GoalStatus } from '@/lib/db/models/Goal';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const goal = await Goal.findById(id).lean();
  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
  if (goal.therapistId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({
    goal: {
      ...goal,
      _id: String(goal._id),
      therapistId: String(goal.therapistId),
      patientId: String(goal.patientId),
    },
  });
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
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

  await connectDB();

  const goal = await Goal.findById(id);
  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });
  if (goal.therapistId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const validStatuses: GoalStatus[] = ['active', 'achieved', 'discontinued', 'modified'];

  if (body.title && typeof body.title === 'string' && body.title.trim()) {
    goal.title = body.title.trim();
  }
  if (typeof body.description === 'string') {
    goal.description = body.description.trim() || undefined;
  }
  if (body.targetDate && typeof body.targetDate === 'string') {
    const d = new Date(body.targetDate);
    if (!isNaN(d.getTime())) goal.targetDate = d;
  }
  if (typeof body.status === 'string' && validStatuses.includes(body.status as GoalStatus)) {
    const newStatus = body.status as GoalStatus;
    // Auto-set achievedDate when status changes to 'achieved'
    if (newStatus === 'achieved' && goal.status !== 'achieved') {
      goal.achievedDate = new Date();
    } else if (newStatus !== 'achieved') {
      goal.achievedDate = undefined;
    }
    goal.status = newStatus;
  }
  if (body.achievedDate && typeof body.achievedDate === 'string') {
    const d = new Date(body.achievedDate);
    if (!isNaN(d.getTime())) goal.achievedDate = d;
  }

  await goal.save();

  const result = goal.toObject() as unknown as Record<string, unknown>;
  return NextResponse.json({
    goal: {
      ...result,
      _id: String(result._id),
      therapistId: String(result.therapistId),
      patientId: String(result.patientId),
    },
  });
}
