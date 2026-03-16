import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';
import { TherapistProfile } from '@/lib/db/models/TherapistProfile';
import BusinessDetailsForm from '@/components/dashboard/settings/BusinessDetailsForm';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('dashboard.settings.business');
  return { title: t('pageTitle') };
}

type PageProps = { params: Promise<{ locale: string }> };

export default async function SettingsPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') redirect(`/${locale}/auth/login`);

  const t = await getTranslations('dashboard.settings.business');

  await connectDB();
  const user = await User.findById(session.user.id).select('therapistProfileId').lean();
  const profile = user?.therapistProfileId
    ? await TherapistProfile.findById(user.therapistProfileId).select('businessDetails').lean()
    : null;

  const businessDetails = (profile?.businessDetails as Record<string, unknown> | undefined) ?? {};

  return (
    <div className="space-y-5">
      <div className="card overflow-hidden">
        <div className="gradient-bar" />
        <div className="p-5">
          <h1 className="text-xl font-normal text-text-primary">{t('pageTitle')}</h1>
          <p className="mt-1 text-sm text-text-muted">{t('pageSubtitle')}</p>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="mb-4 text-base font-normal text-text-primary">{t('sectionTitle')}</h2>
        <BusinessDetailsForm
          initial={{
            businessName: (businessDetails.businessName as string | undefined) ?? '',
            businessNumber: (businessDetails.businessNumber as string | undefined) ?? '',
            vatNumber: (businessDetails.vatNumber as string | undefined) ?? '',
            businessAddress: (businessDetails.businessAddress as string | undefined) ?? '',
            businessType: (businessDetails.businessType as 'licensed' | 'exempt' | 'company' | undefined),
          }}
        />
      </div>
    </div>
  );
}
