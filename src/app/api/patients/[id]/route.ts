import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { Patient } from '@/lib/db/models/Patient';
import { encrypt, decrypt } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

async function getAuthedPatient(id: string, userId: string) {
  await connectDB();
  const patient = await Patient.findById(id).lean();
  if (!patient) return { error: 'Not found', status: 404, patient: null };
  if (patient.therapistId.toString() !== userId) {
    return { error: 'Forbidden', status: 403, patient: null };
  }
  return { error: null, status: 200, patient };
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error, status, patient } = await getAuthedPatient(id, session.user.id);
  if (error || !patient) return NextResponse.json({ error }, { status });

  const result = { ...patient, _id: String(patient._id), therapistId: String(patient.therapistId) };
  if (result.diagnosisNotes) {
    try {
      result.diagnosisNotes = decrypt(result.diagnosisNotes);
    } catch {
      result.diagnosisNotes = '';
    }
  }

  return NextResponse.json({ patient: result });
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
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

  const { error, status, patient } = await getAuthedPatient(id, session.user.id);
  if (error || !patient) return NextResponse.json({ error }, { status });

  // Prevent changing therapistId
  delete body.therapistId;
  delete body._id;

  if (body.diagnosisNotes && typeof body.diagnosisNotes === 'string' && body.diagnosisNotes.trim()) {
    body.diagnosisNotes = encrypt(body.diagnosisNotes.trim());
  }

  const updated = await Patient.findByIdAndUpdate(id, { $set: body }, { new: true }).lean();
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const result = { ...updated, _id: String(updated._id), therapistId: String(updated.therapistId) };
  if (result.diagnosisNotes) {
    try {
      result.diagnosisNotes = decrypt(result.diagnosisNotes);
    } catch {
      result.diagnosisNotes = '';
    }
  }

  return NextResponse.json({ patient: result });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error, status, patient } = await getAuthedPatient(id, session.user.id);
  if (error || !patient) return NextResponse.json({ error }, { status });

  // Soft-delete only: set status to archived
  await Patient.findByIdAndUpdate(id, { $set: { status: 'archived' } });

  return NextResponse.json({ success: true, message: 'Patient archived' });
}
