import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { TherapistAvailability } from '@/lib/db/models/TherapistAvailability';
import { Appointment } from '@/lib/db/models/Appointment';
import { calculateSlots } from '@/lib/appointments/slots';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const therapistId = sp.get('therapistId');
  const dateStr = sp.get('date'); // YYYY-MM-DD

  if (!therapistId || !dateStr) {
    return NextResponse.json({ error: 'therapistId and date are required' }, { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(therapistId)) {
    return NextResponse.json({ error: 'Invalid therapistId' }, { status: 400 });
  }

  const date = new Date(`${dateStr}T00:00:00.000Z`);
  if (isNaN(date.getTime())) {
    return NextResponse.json({ error: 'Invalid date format, use YYYY-MM-DD' }, { status: 400 });
  }

  await connectDB();

  const availability = await TherapistAvailability.findOne({ therapistId }).lean();

  if (!availability) {
    return NextResponse.json({ slots: [] });
  }

  // Load existing non-cancelled appointments for that date
  const dayStart = new Date(`${dateStr}T00:00:00.000Z`);
  const dayEnd = new Date(`${dateStr}T23:59:59.999Z`);

  const existingAppointments = await Appointment.find({
    therapistId,
    status: { $nin: ['cancelled', 'no-show'] },
    startTime: { $gte: dayStart, $lte: dayEnd },
  })
    .select('startTime endTime')
    .lean();

  const slots = calculateSlots(
    availability.weeklySchedule,
    availability.exceptions,
    existingAppointments,
    date
  );

  return NextResponse.json({ slots });
}
