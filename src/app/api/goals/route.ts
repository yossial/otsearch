import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { Goal } from '@/lib/db/models/Goal';
import { Patient } from '@/lib/db/models/Patient';
import type { GoalStatus } from '@/lib/db/models/Goal';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const patientId = sp.get('patientId');
  if (!patientId) {
    return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
  }

  await connectDB();

  const patient = await Patient.findById(patientId).select('therapistId').lean();
  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  if (patient.therapistId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const docs = await Goal.find({ therapistId: session.user.id, patientId }).sort({ createdAt: -1 }).lean();

  const goals = docs.map((g) => ({
    ...g,
    _id: String(g._id),
    therapistId: String(g.therapistId),
    patientId: String(g.patientId),
  }));

  return NextResponse.json({ goals });
}

export async function POST(req: NextRequest) {
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

  const { patientId, title, description, targetDate, status } = body;

  if (!patientId || typeof patientId !== 'string') {
    return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
  }
  if (!title || typeof title !== 'string' || !title.trim()) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
  }

  await connectDB();

  const patient = await Patient.findById(patientId).select('therapistId').lean();
  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  if (patient.therapistId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const validStatuses: GoalStatus[] = ['active', 'achieved', 'discontinued', 'modified'];
  const goalStatus: GoalStatus = (typeof status === 'string' && validStatuses.includes(status as GoalStatus))
    ? (status as GoalStatus)
    : 'active';

  const createData: Record<string, unknown> = {
    therapistId: session.user.id,
    patientId,
    title: title.trim(),
    status: goalStatus,
  };
  if (description && typeof description === 'string' && description.trim()) {
    createData.description = description.trim();
  }
  if (targetDate && typeof targetDate === 'string') {
    const d = new Date(targetDate);
    if (!isNaN(d.getTime())) createData.targetDate = d;
  }

  const docs = await Goal.create([createData]);
  const created = docs[0];
  if (!created) {
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 });
  }

  const result = created.toObject() as unknown as Record<string, unknown>;
  return NextResponse.json(
    { goal: { ...result, _id: String(result._id), therapistId: String(result.therapistId), patientId: String(result.patientId) } },
    { status: 201 }
  );
}
