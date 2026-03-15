import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { Patient } from '@/lib/db/models/Patient';
import GoalList from '@/components/dashboard/goals/GoalList';
import GoalFormWrapper from '@/components/dashboard/goals/GoalFormWrapper';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string; locale: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations('dashboard.goals');
  await connectDB();
  const patient = await Patient.findById(id).select('firstName lastName').lean();
  if (!patient) return { title: t('title') };
  return { title: `${patient.firstName} ${patient.lastName} — ${t('title')}` };
}

export default async function PatientGoalsPage({ params }: PageProps) {
  const { id, locale } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') redirect(`/${locale}/auth/login`);

  const t = await getTranslations('dashboard.goals');
  const tPatients = await getTranslations('dashboard.patients');

  await connectDB();
  const patient = await Patient.findById(id).select('therapistId firstName lastName').lean();
  if (!patient) notFound();
  if (patient.therapistId.toString() !== session.user.id) redirect(`/${locale}/dashboard/patients`);

  return (
    <div className="min-h-screen bg-bg-alt">
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">

        {/* Back */}
        <Link
          href={`/dashboard/patients/${id}`}
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="rtl:rotate-180">
            <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
          </svg>
          {patient.firstName} {patient.lastName}
        </Link>

        {/* Header card */}
        <div className="card overflow-hidden">
          <div className="gradient-bar" />
          <div className="flex items-center justify-between gap-4 p-5">
            <div>
              <p className="section-eyebrow">{patient.firstName} {patient.lastName}</p>
              <h1 className="mt-1 text-xl font-normal text-text-primary">{t('title')}</h1>
            </div>
            <GoalFormWrapper patientId={id} />
          </div>
        </div>

        {/* Tabs */}
        <div className="card overflow-hidden">
          <div className="flex border-b border-border px-5 py-0">
            <Link
              href={`/dashboard/patients/${id}`}
              className="border-b-2 border-transparent px-5 py-3 text-sm font-normal text-text-muted transition-colors hover:text-primary"
            >
              {tPatients('sessionsTab')}
            </Link>
            <span className="border-b-2 border-primary px-5 py-3 text-sm font-normal text-text-primary -mb-px">
              {tPatients('goalsTab')}
            </span>
            <Link
              href={`/dashboard/patients/${id}/invoices`}
              className="border-b-2 border-transparent px-5 py-3 text-sm font-normal text-text-muted transition-colors hover:text-primary"
            >
              {tPatients('invoicesTab')}
            </Link>
          </div>

          <GoalList patientId={id} locale={locale} />
        </div>

      </div>
    </div>
  );
}
