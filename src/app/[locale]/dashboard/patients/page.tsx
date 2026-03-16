import { redirect } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { Patient } from '@/lib/db/models/Patient';
import PatientList from '@/components/dashboard/patients/PatientList';

export async function generateMetadata() {
  const t = await getTranslations('dashboard.patients');
  return { title: t('title') };
}

export default async function PatientsPage() {
  const session = await auth();
  const locale = await getLocale();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') redirect(`/${locale}/auth/login`);

  const t = await getTranslations('dashboard.patients');

  await connectDB();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const therapistId = session.user.id;

  const [activeDocs, newThisMonthCount] = await Promise.all([
    Patient.find({ therapistId, status: 'active' })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    Patient.countDocuments({ therapistId, createdAt: { $gte: startOfMonth } }),
  ]);

  const totalActive = await Patient.countDocuments({ therapistId, status: 'active' });

  const patients = activeDocs.map((p) => ({
    _id: String(p._id),
    firstName: p.firstName,
    lastName: p.lastName,
    dateOfBirth: p.dateOfBirth.toISOString(),
    type: p.type,
    insurance: p.insurance,
    status: p.status,
  }));

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-normal text-text-primary">{t('title')}</h1>
        <Link
          href="/dashboard/patients/new"
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-normal text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          {t('addPatient')}
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Active patients */}
        <div className="card p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
            </span>
            <p className="text-xs text-text-secondary">{t('totalActive')}</p>
          </div>
          <p className="text-2xl font-normal text-text-primary">{totalActive}</p>
        </div>
        {/* New this month */}
        <div className="card p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
              </svg>
            </span>
            <p className="text-xs text-text-secondary">{t('newThisMonth')}</p>
          </div>
          <p className="text-2xl font-normal text-text-primary">{newThisMonthCount}</p>
        </div>
      </div>

      {/* Patient list with client-side search */}
      <PatientList initialPatients={patients} initialTotal={totalActive} />
    </>
  );
}
