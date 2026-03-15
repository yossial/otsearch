import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { Appointment } from '@/lib/db/models/Appointment';
import { Patient } from '@/lib/db/models/Patient';
import mongoose from 'mongoose';
import type { AppointmentType } from '@/lib/db/models/Appointment';

export const dynamic = 'force-dynamic';

interface PopulatedPatient {
  _id: unknown;
  firstName: string;
  lastName: string;
}

function serializePatientId(
  patientId: unknown
): { _id: string; firstName: string; lastName: string } | string {
  if (
    patientId !== null &&
    typeof patientId === 'object' &&
    '_id' in patientId
  ) {
    const p = patientId as PopulatedPatient;
    return { _id: String(p._id), firstName: p.firstName, lastName: p.lastName };
  }
  return String(patientId);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const patientId = sp.get('patientId');
  const status = sp.get('status');
  const from = sp.get('from');
  const to = sp.get('to');
  const page = Math.max(1, parseInt(sp.get('page') ?? '1', 10));
  const limit = Math.min(200, Math.max(1, parseInt(sp.get('limit') ?? '50', 10)));

  await connectDB();

  const filter: Record<string, unknown> = { therapistId: session.user.id };

  if (patientId) {
    if (!mongoose.Types.ObjectId.isValid(patientId)) {
      return NextResponse.json({ error: 'Invalid patientId' }, { status: 400 });
    }
    filter.patientId = new mongoose.Types.ObjectId(patientId);
  }

  if (status) filter.status = status;

  if (from || to) {
    const timeFilter: Record<string, Date> = {};
    if (from) timeFilter.$gte = new Date(from);
    if (to) timeFilter.$lte = new Date(to);
    filter.startTime = timeFilter;
  }

  const skip = (page - 1) * limit;

  const [docs, total] = await Promise.all([
    Appointment.find(filter)
      .populate('patientId', 'firstName lastName')
      .sort({ startTime: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Appointment.countDocuments(filter),
  ]);

  const appointments = docs.map((a) => ({
    ...a,
    _id: String(a._id),
    therapistId: String(a.therapistId),
    patientId: serializePatientId(a.patientId as unknown),
  }));

  return NextResponse.json({ appointments, total, page, pages: Math.ceil(total / limit) });
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

  const { patientId, startTime, endTime, type, location, fee, bookedBy } = body;

  if (!patientId || !startTime || !endTime || !type) {
    return NextResponse.json(
      { error: 'Missing required fields: patientId, startTime, endTime, type' },
      { status: 400 }
    );
  }

  if (!mongoose.Types.ObjectId.isValid(patientId as string)) {
    return NextResponse.json({ error: 'Invalid patientId' }, { status: 400 });
  }

  const start = new Date(startTime as string);
  const end = new Date(endTime as string);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: 'Invalid startTime or endTime' }, { status: 400 });
  }

  if (start >= end) {
    return NextResponse.json({ error: 'startTime must be before endTime' }, { status: 400 });
  }

  const validTypes: AppointmentType[] = ['in-person', 'telehealth', 'home-visit'];
  if (!validTypes.includes(type as AppointmentType)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }

  await connectDB();

  // Verify patient belongs to this therapist
  const patient = await Patient.findOne({
    _id: patientId,
    therapistId: session.user.id,
  }).lean();

  if (!patient) {
    return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
  }

  // Check for overlapping appointments
  const overlap = await Appointment.findOne({
    therapistId: session.user.id,
    status: { $nin: ['cancelled', 'no-show'] },
    startTime: { $lt: end },
    endTime: { $gt: start },
  }).lean();

  if (overlap) {
    return NextResponse.json(
      { error: 'Appointment overlaps with an existing appointment' },
      { status: 409 }
    );
  }

  const duration = Math.round((end.getTime() - start.getTime()) / 60000);

  const doc = await Appointment.create({
    therapistId: session.user.id,
    patientId: patientId as string,
    startTime: start,
    endTime: end,
    duration,
    type: type as AppointmentType,
    location: typeof location === 'string' ? location : undefined,
    fee: typeof fee === 'number' ? fee : undefined,
    status: 'scheduled' as const,
    bookedBy: (bookedBy as 'therapist' | 'patient' | undefined) ?? 'therapist',
    remindersSent: [],
  });

  return NextResponse.json(
    { appointment: { ...doc.toObject(), _id: String(doc._id) } },
    { status: 201 }
  );
}
