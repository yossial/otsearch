import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { getOTProfileById } from '@/lib/db/ots';
import ProfileEditForm from '@/components/dashboard/ProfileEditForm';

export async function generateMetadata() {
  const t = await getTranslations('dashboard.edit');
  return { title: t('title') };
}

export default async function DashboardEditPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const otProfileId = (session.user as { otProfileId?: string | null }).otProfileId;
  if (!otProfileId) redirect('/dashboard');

  const t = await getTranslations('dashboard');
  const profile = await getOTProfileById(otProfileId);
  if (!profile) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-directional" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
            {t('title')}
          </Link>
          <span className="text-text-muted">/</span>
          <span className="text-sm font-medium text-text-primary">{t('edit.title')}</span>
        </div>

        <h1 className="mb-8 text-2xl font-bold text-text-primary">{t('edit.title')}</h1>
        <ProfileEditForm profile={profile} />
      </div>
    </div>
  );
}
