import { redirect } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import PatientForm from '@/components/dashboard/patients/PatientForm';

export async function generateMetadata() {
  const t = await getTranslations('dashboard.patients');
  return { title: t('newPatient') };
}

export default async function NewPatientPage() {
  const session = await auth();
  const locale = await getLocale();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') redirect(`/${locale}/auth/login`);

  const t = await getTranslations('dashboard.patients');

  return (
    <div className="min-h-screen bg-bg-alt">
      <div className="mx-auto max-w-2xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/patients"
            className="text-sm text-text-muted hover:text-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="rtl:rotate-180">
              <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
            </svg>
          </Link>
          <h1 className="text-2xl font-normal text-text-primary">{t('newPatient')}</h1>
        </div>

        <PatientForm />

      </div>
    </div>
  );
}
