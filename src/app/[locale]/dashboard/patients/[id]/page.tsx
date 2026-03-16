import { notFound } from 'next/navigation';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { Patient } from '@/lib/db/models/Patient';
import { decrypt } from '@/lib/crypto';
import SessionList from '@/components/dashboard/sessions/SessionList';
import BreadcrumbLabel from '@/components/ui/BreadcrumbLabel';

export const dynamic = 'force-dynamic';

type PageProps = { params: Promise<{ id: string; locale: string }> };

function calcAge(dob: Date): number {
  return Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const t = await getTranslations('dashboard.patients');
  await connectDB();
  const patient = await Patient.findById(id).select('firstName lastName').lean();
  if (!patient) return { title: t('title') };
  return { title: `${patient.firstName} ${patient.lastName}` };
}

export default async function PatientDetailPage({ params }: PageProps) {
  const { id, locale } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') redirect(`/${locale}/auth/login`);

  const t = await getTranslations('dashboard.patients');
  const tSessions = await getTranslations('dashboard.sessions');

  await connectDB();
  const patient = await Patient.findById(id).lean();
  if (!patient) notFound();
  if (patient.therapistId.toString() !== session.user.id) redirect(`/${locale}/dashboard/patients`);

  let diagnosisNotes: string | undefined;
  if (patient.diagnosisNotes) {
    try {
      diagnosisNotes = decrypt(patient.diagnosisNotes);
    } catch {
      diagnosisNotes = undefined;
    }
  }

  const age = calcAge(patient.dateOfBirth);

  const statusColor: Record<string, string> = {
    active: 'bg-green-50 text-green-700',
    inactive: 'bg-yellow-50 text-yellow-700',
    archived: 'bg-bg-alt text-text-muted',
  };
  const statusLabel: Record<string, string> = {
    active: t('statusActive'),
    inactive: t('statusInactive'),
    archived: t('statusArchived'),
  };

  const insuranceLabel: Record<string, string> = {
    clalit: t('insuranceClalit'),
    maccabi: t('insuranceMaccabi'),
    meuhedet: t('insuranceMeuhedet'),
    leumit: t('insuranceLeumit'),
    none: t('insuranceNone'),
  };

  return (
    <>
      <BreadcrumbLabel segment={id} label={`${patient.firstName} ${patient.lastName}`} />

        {/* Back */}
        <Link href="/dashboard/patients" className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="rtl:rotate-180">
            <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
          </svg>
          {t('title')}
        </Link>

        {/* Patient header */}
        <div className="card overflow-hidden">
          <div className="gradient-bar" />
          <div className="flex flex-wrap items-start justify-between gap-4 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-light text-lg font-normal text-primary">
                {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-normal text-text-primary">
                  {patient.firstName} {patient.lastName}
                </h1>
                <p className="mt-0.5 text-sm text-text-muted">
                  {t('age')}: {age} {t('years')} &middot; {patient.type === 'child' ? t('typeChild') : t('typeDirect')}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-normal ${statusColor[patient.status] ?? ''}`}>
                    {statusLabel[patient.status] ?? patient.status}
                  </span>
                  {patient.insurance && (
                    <span className="rounded-full bg-bg-alt px-2.5 py-0.5 text-xs text-text-muted">
                      {insuranceLabel[patient.insurance] ?? patient.insurance}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/dashboard/patients/${id}/edit`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-normal text-text-secondary transition-colors hover:border-primary/30 hover:text-primary"
              >
                {t('editPatient')}
              </Link>
              <a
                href={`/api/patients/${id}/export`}
                download
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-normal text-text-secondary transition-colors hover:border-primary/30 hover:text-primary"
              >
                {t('export')}
              </a>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Contact info */}
          <div className="card p-6">
            <h2 className="mb-4 text-sm font-normal uppercase tracking-wide text-text-muted">{t('contactInfo')}</h2>
            {patient.type === 'direct' && patient.contactInfo ? (
              <dl className="space-y-2 text-sm">
                {patient.contactInfo.phone && (
                  <div className="flex justify-between">
                    <dt className="text-text-muted">{t('phone')}</dt>
                    <dd className="text-text-primary">{patient.contactInfo.phone}</dd>
                  </div>
                )}
                {patient.contactInfo.email && (
                  <div className="flex justify-between">
                    <dt className="text-text-muted">{t('email')}</dt>
                    <dd className="text-text-primary">{patient.contactInfo.email}</dd>
                  </div>
                )}
              </dl>
            ) : patient.type === 'child' && patient.parentInfo ? (
              <dl className="space-y-2 text-sm">
                <p className="mb-2 text-xs font-normal text-text-muted uppercase">{t('parentInfo')}</p>
                {(patient.parentInfo.firstName || patient.parentInfo.lastName) && (
                  <div className="flex justify-between">
                    <dt className="text-text-muted">{t('firstName')}</dt>
                    <dd className="text-text-primary">{patient.parentInfo.firstName} {patient.parentInfo.lastName}</dd>
                  </div>
                )}
                {patient.parentInfo.phone && (
                  <div className="flex justify-between">
                    <dt className="text-text-muted">{t('phone')}</dt>
                    <dd className="text-text-primary">{patient.parentInfo.phone}</dd>
                  </div>
                )}
                {patient.parentInfo.email && (
                  <div className="flex justify-between">
                    <dt className="text-text-muted">{t('email')}</dt>
                    <dd className="text-text-primary">{patient.parentInfo.email}</dd>
                  </div>
                )}
                {patient.parentInfo.relationship && (
                  <div className="flex justify-between">
                    <dt className="text-text-muted">{t('relationship')}</dt>
                    <dd className="text-text-primary capitalize">{patient.parentInfo.relationship}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-text-muted">—</p>
            )}
          </div>

          {/* Consent info */}
          <div className="card p-6">
            <h2 className="mb-4 text-sm font-normal uppercase tracking-wide text-text-muted">{t('consentInfo')}</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">{t('consentGiven')}</dt>
                <dd className={patient.consentGiven ? 'text-green-700' : 'text-red-600'}>
                  {patient.consentGiven ? '✓' : '✗'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">{t('consentDate')}</dt>
                <dd className="text-text-primary">{patient.consentDate.toLocaleDateString()}</dd>
              </div>
              {patient.consentSignedBy && (
                <div className="flex justify-between">
                  <dt className="text-text-muted">{t('consentSignedBy')}</dt>
                  <dd className="text-text-primary">{patient.consentSignedBy}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-text-muted">{t('retentionNote')}</dt>
                <dd className="text-text-primary">{patient.retentionDeleteAfter.toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Diagnosis notes */}
        {diagnosisNotes && (
          <div className="card p-6">
            <h2 className="mb-3 text-sm font-normal uppercase tracking-wide text-text-muted">{t('diagnosisNotes')}</h2>
            <p className="whitespace-pre-wrap text-sm text-text-primary">{diagnosisNotes}</p>
          </div>
        )}

        {/* Sessions tab */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3">
            <div className="flex">
              <span className="border-b-2 border-primary px-5 py-3 text-sm font-normal text-text-primary -mb-px">
                {t('sessionsTab')}
              </span>
              <Link
                href={`/dashboard/patients/${id}/goals`}
                className="border-b-2 border-transparent px-5 py-3 text-sm font-normal text-text-muted transition-colors hover:text-primary"
              >
                {t('goalsTab')}
              </Link>
              <Link
                href={`/dashboard/patients/${id}/invoices`}
                className="border-b-2 border-transparent px-5 py-3 text-sm font-normal text-text-muted transition-colors hover:text-primary"
              >
                {t('invoicesTab')}
              </Link>
              <Link
                href={`/dashboard/patients/${id}/documents`}
                className="border-b-2 border-transparent px-5 py-3 text-sm font-normal text-text-muted transition-colors hover:text-primary"
              >
                {t('documentsTab')}
              </Link>
            </div>
            <Link
              href={`/dashboard/patients/${id}/sessions/new`}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-normal text-white hover:bg-primary-hover"
            >
              {tSessions('newSession')}
            </Link>
          </div>
          <SessionList patientId={id} locale={locale} />
        </div>

    </>
  );
}
