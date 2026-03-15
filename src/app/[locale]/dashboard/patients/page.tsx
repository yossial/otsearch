import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
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
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') redirect('/auth/login');

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
    <div className="min-h-screen bg-bg-alt">
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">

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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
          <div className="card p-5">
            <p className="text-2xl font-normal text-text-primary">{totalActive}</p>
            <p className="mt-1 text-sm text-text-muted">{t('totalActive')}</p>
          </div>
          <div className="card p-5">
            <p className="text-2xl font-normal text-text-primary">{newThisMonthCount}</p>
            <p className="mt-1 text-sm text-text-muted">{t('newThisMonth')}</p>
          </div>
        </div>

        {/* Patient list with client-side search */}
        <PatientList initialPatients={patients} initialTotal={totalActive} />

      </div>
    </div>
  );
}
