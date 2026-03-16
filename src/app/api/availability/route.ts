import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { TherapistAvailability } from '@/lib/db/models/TherapistAvailability';
import type { WeeklyScheduleEntry, AvailabilityException } from '@/lib/db/models/TherapistAvailability';

export const dynamic = 'force-dynamic';

const TIME_REGEX = /^\d{2}:\d{2}$/;

function isValidTime(t: string): boolean {
  if (!TIME_REGEX.test(t)) return false;
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) >= 0 && (h ?? 0) <= 23 && (m ?? 0) >= 0 && (m ?? 0) <= 59;
}

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();

  const availability = await TherapistAvailability.findOne({
    therapistId: session.user.id,
  }).lean();

  if (!availability) {
    return NextResponse.json({
      weeklySchedule: [],
      exceptions: [],
      bookingWindowDays: 60,
      minNoticeHours: 24,
    });
  }

  return NextResponse.json({
    ...availability,
    _id: String(availability._id),
    therapistId: String(availability.therapistId),
  });
}

export async function PUT(req: NextRequest) {
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

  // Validate weeklySchedule if provided
  if (body.weeklySchedule !== undefined) {
    if (!Array.isArray(body.weeklySchedule)) {
      return NextResponse.json({ error: 'weeklySchedule must be an array' }, { status: 400 });
    }

    for (const entry of body.weeklySchedule as WeeklyScheduleEntry[]) {
      if (
        typeof entry.dayOfWeek !== 'number' ||
        entry.dayOfWeek < 0 ||
        entry.dayOfWeek > 6
      ) {
        return NextResponse.json(
          { error: 'Each weeklySchedule entry must have dayOfWeek 0–6' },
          { status: 400 }
        );
      }
      if (!isValidTime(entry.startTime) || !isValidTime(entry.endTime)) {
        return NextResponse.json(
          { error: 'startTime and endTime must be in HH:MM format' },
          { status: 400 }
        );
      }
      if (typeof entry.sessionDuration !== 'number' || entry.sessionDuration <= 0) {
        return NextResponse.json(
          { error: 'sessionDuration must be a positive number' },
          { status: 400 }
        );
      }
    }
  }

  // Build update payload
  const update: Record<string, unknown> = {};
  if (Array.isArray(body.weeklySchedule)) update.weeklySchedule = body.weeklySchedule;
  if (Array.isArray(body.exceptions)) {
    update.exceptions = (body.exceptions as AvailabilityException[]).map((e) => ({
      ...e,
      date: new Date(e.date),
    }));
  }
  if (typeof body.bookingWindowDays === 'number') update.bookingWindowDays = body.bookingWindowDays;
  if (typeof body.minNoticeHours === 'number') update.minNoticeHours = body.minNoticeHours;

  await connectDB();

  const availability = await TherapistAvailability.findOneAndUpdate(
    { therapistId: session.user.id },
    { $set: update },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return NextResponse.json({
    ...availability,
    _id: String(availability!._id),
    therapistId: String(availability!.therapistId),
  });
}
