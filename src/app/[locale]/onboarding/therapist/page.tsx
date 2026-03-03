import { getTranslations, getLocale } from 'next-intl/server';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import TherapistOnboardingWizard from '@/components/onboarding/TherapistOnboardingWizard';

export async function generateMetadata() {
  const t = await getTranslations('onboarding.therapist');
  return { title: t('title') };
}

export default async function TherapistOnboardingPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) {
    redirect(`/${locale}/auth/login`);
  }

  const role = (session.user as { role?: string | null }).role;
  const therapistProfileId = (session.user as { therapistProfileId?: string | null }).therapistProfileId;

  // If the user has already completed onboarding, send them to dashboard
  if (role === 'therapist' && therapistProfileId) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-bg">
      <TherapistOnboardingWizard therapistProfileId={therapistProfileId ?? ''} />
    </div>
  );
}
