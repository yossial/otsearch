import { getTranslations } from 'next-intl/server';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import PatientOnboardingForm from '@/components/onboarding/PatientOnboardingForm';

export async function generateMetadata() {
  const t = await getTranslations('onboarding.patient');
  return { title: t('title') };
}

export default async function PatientOnboardingPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) {
    redirect(`/${locale}/auth/login`);
  }
  const role = (session.user as { role?: string | null }).role;
  if (role !== 'patient') {
    redirect(`/${locale}/auth/role-select`);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-bg">
      <PatientOnboardingForm />
    </div>
  );
}
