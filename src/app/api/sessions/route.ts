import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { TreatmentSession } from '@/lib/db/models/TreatmentSession';
import { Patient } from '@/lib/db/models/Patient';
import { encrypt, decrypt } from '@/lib/crypto';
import type { SessionNotes } from '@/lib/db/models/TreatmentSession';

export const dynamic = 'force-dynamic';

function decryptNotes(notes: SessionNotes | undefined): SessionNotes | undefined {
  if (!notes) return undefined;
  const result: SessionNotes = {};
  for (const key of ['subjective', 'objective', 'assessment', 'plan', 'freeText'] as const) {
    const val = notes[key];
    if (val) {
      try {
        result[key] = decrypt(val);
      } catch {
        result[key] = '';
      }
    }
  }
  return result;
}

function encryptNotes(notes: Partial<SessionNotes>): SessionNotes {
  const result: SessionNotes = {};
  for (const key of ['subjective', 'objective', 'assessment', 'plan', 'freeText'] as const) {
    const val = notes[key];
    if (val && typeof val === 'string' && val.trim()) {
      result[key] = encrypt(val.trim());
    }
  }
  return result;
}

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

  const status = sp.get('status') ?? '';
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(sp.get('limit') ?? '20', 10)));

  await connectDB();

  // Verify patient belongs to this therapist
  const patient = await Patient.findById(patientId).select('therapistId').lean();
  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  if (patient.therapistId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const filter: Record<string, unknown> = {
    therapistId: session.user.id,
    patientId,
  };
  if (status) filter.status = status;

  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    TreatmentSession.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
    TreatmentSession.countDocuments(filter),
  ]);

  const sessions = docs.map((s) => ({
    ...s,
    _id: String(s._id),
    therapistId: String(s.therapistId),
    patientId: String(s.patientId),
    appointmentId: s.appointmentId ? String(s.appointmentId) : undefined,
    goalsAddressed: s.goalsAddressed.map(String),
    notes: decryptNotes(s.notes),
  }));

  return NextResponse.json({ sessions, total, page, pages: Math.ceil(total / limit) });
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

  const { patientId, date, duration } = body;

  if (!patientId || typeof patientId !== 'string') {
    return NextResponse.json({ error: 'patientId is required' }, { status: 400 });
  }
  if (!date) {
    return NextResponse.json({ error: 'date is required' }, { status: 400 });
  }
  if (!duration || typeof duration !== 'number') {
    return NextResponse.json({ error: 'duration is required' }, { status: 400 });
  }

  await connectDB();

  // Verify patient belongs to this therapist
  const patient = await Patient.findById(patientId).select('therapistId').lean();
  if (!patient) return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  if (patient.therapistId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rawNotes = (body.notes ?? {}) as Partial<SessionNotes>;
  const encryptedNotes = encryptNotes(rawNotes);

  const createData: Record<string, unknown> = {
    therapistId: session.user.id,
    patientId,
    date: new Date(date as string),
    duration,
    notes: Object.keys(encryptedNotes).length > 0 ? encryptedNotes : undefined,
    goalsAddressed: Array.isArray(body.goalsAddressed) ? body.goalsAddressed : [],
    fee: typeof body.fee === 'number' ? body.fee : undefined,
    appointmentId: typeof body.appointmentId === 'string' && body.appointmentId ? body.appointmentId : undefined,
    status: 'draft',
    aiDraftUsed: false,
  };

  const docs = await TreatmentSession.create([createData]);
  const created = docs[0];
  if (!created) {
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }

  const result = created.toObject() as unknown as Record<string, unknown>;
  const resultNotes = result.notes as SessionNotes | undefined;

  return NextResponse.json(
    {
      session: {
        ...result,
        _id: String(result._id),
        therapistId: String(result.therapistId),
        patientId: String(result.patientId),
        notes: decryptNotes(resultNotes),
      },
    },
    { status: 201 }
  );
}
