import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { Appointment } from '@/lib/db/models/Appointment';
import mongoose from 'mongoose';
import type { AppointmentStatus } from '@/lib/db/models/Appointment';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  await connectDB();

  const appointment = await Appointment.findOne({
    _id: id,
    therapistId: session.user.id,
  })
    .populate('patientId', 'firstName lastName')
    .lean();

  if (!appointment) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json({
    ...appointment,
    _id: String(appointment._id),
    therapistId: String(appointment.therapistId),
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  await connectDB();

  // Verify ownership
  const existing = await Appointment.findOne({
    _id: id,
    therapistId: session.user.id,
  });

  if (!existing) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const validStatuses: AppointmentStatus[] = ['scheduled', 'confirmed', 'completed', 'cancelled', 'no-show'];

  const update: Record<string, unknown> = {};

  if (body.status !== undefined) {
    if (!validStatuses.includes(body.status as AppointmentStatus)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    update.status = body.status;

    // When completing, optionally link a session note
    if (body.status === 'completed' && body.sessionId) {
      if (mongoose.Types.ObjectId.isValid(body.sessionId as string)) {
        update.sessionId = new mongoose.Types.ObjectId(body.sessionId as string);
      }
    }
  }

  if (body.type !== undefined) update.type = body.type;
  if (body.location !== undefined) update.location = body.location;
  if (body.fee !== undefined) update.fee = body.fee;
  if (body.cancelledBy !== undefined) update.cancelledBy = body.cancelledBy;
  if (body.cancellationReason !== undefined) update.cancellationReason = body.cancellationReason;

  const updated = await Appointment.findByIdAndUpdate(
    id,
    { $set: update },
    { new: true }
  )
    .populate('patientId', 'firstName lastName')
    .lean();

  return NextResponse.json({
    ...updated,
    _id: String(updated!._id),
    therapistId: String(updated!.therapistId),
  });
}
