import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { TreatmentSession } from '@/lib/db/models/TreatmentSession';
import { encrypt, decrypt } from '@/lib/crypto';
import type { SessionNotes, TreatmentSessionDocument } from '@/lib/db/models/TreatmentSession';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

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

function serializeSession(s: TreatmentSessionDocument | Record<string, unknown>) {
  return {
    ...s,
    _id: String((s as Record<string, unknown>)._id),
    therapistId: String((s as Record<string, unknown>).therapistId),
    patientId: String((s as Record<string, unknown>).patientId),
    appointmentId: (s as Record<string, unknown>).appointmentId
      ? String((s as Record<string, unknown>).appointmentId)
      : undefined,
    goalsAddressed: ((s as Record<string, unknown>).goalsAddressed as unknown[]).map(String),
    notes: decryptNotes((s as Record<string, unknown>).notes as SessionNotes | undefined),
  };
}

export async function GET(_req: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const doc = await TreatmentSession.findById(id).lean();
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (doc.therapistId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json({ session: serializeSession(doc as unknown as Record<string, unknown>) });
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

  await connectDB();

  const doc = await TreatmentSession.findById(id).lean();
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (doc.therapistId.toString() !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const action = body.action as string | undefined;

  // Handle sign action
  if (action === 'sign') {
    const updated = await TreatmentSession.findByIdAndUpdate(
      id,
      { $set: { status: 'signed', signedAt: new Date() } },
      { new: true }
    ).lean();
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ session: serializeSession(updated as unknown as Record<string, unknown>) });
  }

  // Handle unsign action
  if (action === 'unsign') {
    const updated = await TreatmentSession.findByIdAndUpdate(
      id,
      { $set: { status: 'draft' }, $unset: { signedAt: 1 } },
      { new: true }
    ).lean();
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ session: serializeSession(updated as unknown as Record<string, unknown>) });
  }

  // Prevent editing signed sessions
  if (doc.status === 'signed') {
    return NextResponse.json({ error: 'Cannot edit a signed session' }, { status: 403 });
  }

  // Regular update — prevent changing protected fields
  delete body.therapistId;
  delete body._id;
  delete body.patientId;
  delete body.status;
  delete body.signedAt;
  delete body.action;

  const updateData: Record<string, unknown> = { ...body };

  // Re-encrypt notes if provided
  if (body.notes && typeof body.notes === 'object') {
    updateData.notes = encryptNotes(body.notes as Partial<SessionNotes>);
  }

  const updated = await TreatmentSession.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean();
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ session: serializeSession(updated as unknown as Record<string, unknown>) });
}
