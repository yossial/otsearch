import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';
import { TherapistProfile } from '@/lib/db/models/TherapistProfile';
import { Patient } from '@/lib/db/models/Patient';
import InvoiceForm from '@/components/dashboard/billing/InvoiceForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('dashboard.billing');
  return { title: t('new') };
}

type PageProps = { params: Promise<{ locale: string }> };

export default async function NewInvoicePage({ params }: PageProps) {
  const { locale } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') redirect(`/${locale}/auth/login`);

  const t = await getTranslations('dashboard.billing');

  await connectDB();
  const user = await User.findById(session.user.id).select('therapistProfileId').lean();
  const [profile, patients] = await Promise.all([
    user?.therapistProfileId
      ? TherapistProfile.findById(user.therapistProfileId)
          .select('subscriptionTier displayName businessDetails')
          .lean()
      : Promise.resolve(null),
    Patient.find({ therapistId: session.user.id, status: 'active' })
      .select('firstName lastName')
      .sort({ firstName: 1 })
      .lean(),
  ]);

  if (profile?.subscriptionTier !== 'premium') {
    redirect(`/${locale}/dashboard/billing`);
  }

  const dn = profile?.displayName as Record<string, string> | undefined;
  const therapistName = dn?.[locale] ?? dn?.he ?? dn?.en ?? dn?.ar ?? '';
  const bd = profile?.businessDetails as Record<string, string> | undefined;
  const businessNumber = bd?.businessNumber ?? '';

  const patientOptions = patients.map((p) => ({
    _id: String(p._id),
    name: `${p.firstName} ${p.lastName}`,
  }));

  return (
    <div className="min-h-screen bg-bg-alt">
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">

        <Link
          href="/dashboard/billing"
          className="inline-flex items-center gap-1 text-sm text-text-muted hover:text-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="rtl:rotate-180">
            <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
          </svg>
          {t('title')}
        </Link>

        <div className="card overflow-hidden">
          <div className="gradient-bar" />
          <div className="p-5">
            <h1 className="text-xl font-normal text-text-primary">{t('new')}</h1>
          </div>
        </div>

        <InvoiceForm
          locale={locale}
          patients={patientOptions}
          therapistName={therapistName}
          businessNumber={businessNumber}
        />

      </div>
    </div>
  );
}
