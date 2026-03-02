import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import OTOnboardingWizard from '@/components/onboarding/OTOnboardingWizard';

export async function generateMetadata() {
  const t = await getTranslations('onboarding.ot');
  return { title: t('title') };
}

export default async function OTOnboardingPage() {
  const session = await auth();
  const locale = await getLocale();

  // Must be logged in as an OT to access this page
  if (!session?.user) {
    redirect(`/${locale}/auth/login`);
  }
  const role = (session.user as { role?: string | null }).role;
  if (role !== 'ot') {
    redirect(`/${locale}/auth/role-select`);
  }

  const otProfileId = (session.user as { otProfileId?: string | null }).otProfileId;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-bg">
      <OTOnboardingWizard otProfileId={otProfileId ?? ''} />
    </div>
  );
}
