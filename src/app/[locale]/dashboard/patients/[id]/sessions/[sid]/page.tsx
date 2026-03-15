import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { TreatmentSession } from '@/lib/db/models/TreatmentSession';
import { Patient } from '@/lib/db/models/Patient';
import { Goal } from '@/lib/db/models/Goal';
import { Appointment } from '@/lib/db/models/Appointment';
import { decrypt } from '@/lib/crypto';
import SessionNoteForm from '@/components/dashboard/sessions/SessionNoteForm';
import type { SessionNotes } from '@/lib/db/models/TreatmentSession';
import BreadcrumbLabel from '@/components/ui/BreadcrumbLabel';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string; sid: string; locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  const t = await getTranslations('dashboard.sessions');
  return { title: t('title') };
}

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

export default async function SessionDetailPage({ params }: PageProps) {
  const { id, sid, locale } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') redirect(`/${locale}/auth/login`);

  const t = await getTranslations('dashboard.sessions');

  await connectDB();

  const [patient, sessionDoc] = await Promise.all([
    Patient.findById(id).select('therapistId firstName lastName').lean(),
    TreatmentSession.findById(sid).lean(),
  ]);

  if (!patient) notFound();
  if (patient.therapistId.toString() !== session.user.id) redirect(`/${locale}/dashboard/patients`);

  if (!sessionDoc) notFound();
  if (sessionDoc.therapistId.toString() !== session.user.id) notFound();

  const decryptedNotes = decryptNotes(sessionDoc.notes);

  const [goalsRaw, appointmentsRaw] = await Promise.all([
    Goal.find({ patientId: id, therapistId: session.user.id })
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

  const sessionData = {
    _id: String(sessionDoc._id),
    date: sessionDoc.date.toISOString(),
    duration: sessionDoc.duration,
    status: sessionDoc.status,
    signedAt: sessionDoc.signedAt?.toISOString(),
    notes: decryptedNotes,
    goalsAddressed: sessionDoc.goalsAddressed.map(String),
    fee: sessionDoc.fee,
    appointmentId: sessionDoc.appointmentId ? String(sessionDoc.appointmentId) : undefined,
  };

  const sessionDateLabel = sessionDoc.date.toLocaleDateString(locale === 'he' ? 'he-IL' : locale === 'ar' ? 'ar' : 'en-GB', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <>
      <BreadcrumbLabel segment={id} label={`${patient.firstName} ${patient.lastName}`} />
      <BreadcrumbLabel segment={sid} label={sessionDateLabel} />
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
          <div className="flex items-center justify-between p-6">
            <div>
              <h1 className="text-xl font-normal text-text-primary">
                {new Date(sessionDoc.date).toLocaleDateString(locale)}
              </h1>
              <p className="mt-1 text-sm text-text-muted">
                {sessionDoc.duration} {t('duration').replace('(דק\')', '').trim()} ·{' '}
                {patient.firstName} {patient.lastName}
              </p>
            </div>
            {sessionDoc.status === 'draft' && (
              <span className="rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs text-yellow-700">
                {t('statusDraft')}
              </span>
            )}
          </div>
        </div>

        <SessionNoteForm
          patientId={id}
          locale={locale}
          goals={goals}
          appointments={appointments}
          session={sessionData}
        />
    </>
  );
}
