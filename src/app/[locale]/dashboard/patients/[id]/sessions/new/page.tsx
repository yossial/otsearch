import { redirect, notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { Patient } from '@/lib/db/models/Patient';
import { Goal } from '@/lib/db/models/Goal';
import { Appointment } from '@/lib/db/models/Appointment';
import SessionNoteForm from '@/components/dashboard/sessions/SessionNoteForm';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string; locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  const t = await getTranslations('dashboard.sessions');
  const { id } = await params;
  return { title: `${t('newSession')} — ${id}` };
}

export default async function NewSessionPage({ params }: PageProps) {
  const { id, locale } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') redirect('/auth/login');

  const t = await getTranslations('dashboard.sessions');

  await connectDB();

  const patient = await Patient.findById(id).select('therapistId firstName lastName').lean();
  if (!patient) notFound();
  if (patient.therapistId.toString() !== session.user.id) redirect('/dashboard/patients');

  const [goalsRaw, appointmentsRaw] = await Promise.all([
    Goal.find({ patientId: id, therapistId: session.user.id, status: 'active' })
      .select('_id title status')
      .lean(),
    Appointment.find({
      patientId: id,
      therapistId: session.user.id,
      status: { $in: ['scheduled', 'confirmed', 'completed'] },
    })
      .sort({ startTime: -1 })
      .limit(20)
      .select('_id startTime type')
      .lean(),
  ]);

  const goals = goalsRaw.map((g) => ({
    _id: String(g._id),
    title: g.title,
    status: g.status,
  }));

  const appointments = appointmentsRaw.map((a) => ({
    _id: String(a._id),
    startTime: a.startTime.toISOString(),
    type: a.type,
  }));

  return (
    <div className="min-h-screen bg-bg-alt">
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link
          href={`/dashboard/patients/${id}`}
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="rtl:rotate-180"
          >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
          </svg>
          {patient.firstName} {patient.lastName}
        </Link>

        {/* Page header */}
        <div className="card overflow-hidden">
          <div className="gradient-bar" />
          <div className="p-6">
            <h1 className="text-xl font-normal text-text-primary">{t('newSession')}</h1>
            <p className="mt-1 text-sm text-text-muted">
              {patient.firstName} {patient.lastName}
            </p>
          </div>
        </div>

        <SessionNoteForm
          patientId={id}
          locale={locale}
          goals={goals}
          appointments={appointments}
        />
      </div>
    </div>
  );
}
