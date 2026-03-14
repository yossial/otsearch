import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';
import { getTherapistProfileById } from '@/lib/db/therapists';
import ProfileEditForm from '@/components/dashboard/ProfileEditForm';

export async function generateMetadata() {
  const t = await getTranslations('dashboard.edit');
  return { title: t('title') };
}

export default async function DashboardEditPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  let therapistProfileId = (session.user as { therapistProfileId?: string | null }).therapistProfileId;

  // JWT may be stale right after onboarding. Fall back to DB.
  if (!therapistProfileId) {
    await connectDB();
    const dbUser = await User.findById(session.user.id).select('therapistProfileId').lean();
    if (!dbUser?.therapistProfileId) redirect('/dashboard');
    therapistProfileId = String(dbUser.therapistProfileId);
  }

  const t = await getTranslations('dashboard');
  const profile = await getTherapistProfileById(therapistProfileId);
  if (!profile) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-bg-alt">
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm font-normal text-text-secondary transition-colors hover:text-primary"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-directional" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
            {t('title')}
          </Link>
          <span className="text-text-muted">/</span>
          <span className="text-sm font-normal text-text-primary">{t('edit.title')}</span>
        </div>

        <ProfileEditForm profile={profile} />
      </div>
    </div>
  );
}
