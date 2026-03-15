import { redirect } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { TherapistAvailability } from '@/lib/db/models/TherapistAvailability';
import { Appointment } from '@/lib/db/models/Appointment';
import { Patient } from '@/lib/db/models/Patient';
import ScheduleTabs from '@/components/dashboard/schedule/ScheduleTabs';

export async function generateMetadata() {
  const t = await getTranslations('dashboard.schedule');
  return { title: t('title') };
}

export default async function SchedulePage() {
  const session = await auth();
  const locale = await getLocale();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') redirect(`/${locale}/auth/login`);

  const therapistId = session.user.id;

  await connectDB();

  // Get start/end of current week (Sun–Sat)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - dayOfWeek);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const [availabilityDoc, appointmentDocs, activePatientDocs] = await Promise.all([
    TherapistAvailability.findOne({ therapistId }).lean(),
    Appointment.find({
      therapistId,
      startTime: { $gte: weekStart, $lt: weekEnd },
    })
      .populate('patientId', 'firstName lastName')
      .sort({ startTime: 1 })
      .lean(),
    Patient.find({ therapistId, status: 'active' })
      .select('firstName lastName _id')
      .sort({ firstName: 1 })
      .lean(),
  ]);

  const availability = availabilityDoc
    ? {
        ...availabilityDoc,
        _id: String(availabilityDoc._id),
        therapistId: String(availabilityDoc.therapistId),
        exceptions: availabilityDoc.exceptions.map((e) => ({
          ...e,
          date: e.date instanceof Date ? e.date.toISOString() : String(e.date),
        })),
      }
    : {
        _id: '',
        therapistId,
        weeklySchedule: [],
        exceptions: [],
        bookingWindowDays: 60,
        minNoticeHours: 24,
      };

  const appointments = appointmentDocs.map((a) => ({
    _id: String(a._id),
    therapistId: String(a.therapistId),
    patientId: (() => {
      const pid = a.patientId as unknown;
      if (pid !== null && typeof pid === 'object' && '_id' in pid) {
        const p = pid as { _id: unknown; firstName: string; lastName: string };
        return { _id: String(p._id), firstName: p.firstName, lastName: p.lastName };
      }
      return { _id: String(a.patientId), firstName: '', lastName: '' };
    })(),
    startTime: (a.startTime instanceof Date ? a.startTime : new Date(a.startTime)).toISOString(),
    endTime: (a.endTime instanceof Date ? a.endTime : new Date(a.endTime)).toISOString(),
    duration: a.duration,
    type: a.type,
    status: a.status,
    location: a.location,
    fee: a.fee,
  }));

  const activePatients = activePatientDocs.map((p) => ({
    _id: String(p._id),
    firstName: p.firstName,
    lastName: p.lastName,
  }));

  return (
    <div className="min-h-screen bg-bg-alt">
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
        <ScheduleTabs
          initialAvailability={availability}
          initialAppointments={appointments}
          activePatients={activePatients}
          weekStart={weekStart.toISOString()}
        />
      </div>
    </div>
  );
}
