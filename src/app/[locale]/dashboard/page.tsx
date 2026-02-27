import { redirect } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { getOTProfileById } from '@/lib/db/ots';

export async function generateMetadata() {
  const t = await getTranslations('dashboard');
  return { title: t('title') };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const t = await getTranslations('dashboard');
  const locale = await getLocale();

  const otProfileId = (session.user as { otProfileId?: string | null }).otProfileId;
  const profile = otProfileId ? await getOTProfileById(otProfileId) : null;

  const name = session.user.name ?? session.user.email ?? '';
  const profileName = profile
    ? (profile.displayName[locale as keyof typeof profile.displayName] ?? profile.displayName.he)
    : null;

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">
            {t('title')} — {profileName ?? name}
          </h1>
        </div>

        {/* Stats row */}
        {profile && (
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label={t('profileViews')} value={profile.profileViews} />
            <StatCard
              label={t('subscription')}
              value={profile.subscriptionTier === 'premium' ? 'PRO' : 'Free'}
            />
            <StatCard
              label={t('completeness')}
              value={`${calcCompleteness(profile)}%`}
            />
          </div>
        )}

        {/* Quick actions */}
        <div className="mb-8 flex flex-wrap gap-3">
          <Link
            href="/dashboard/edit"
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            {t('editProfile')}
          </Link>
          {profile?.slug && (
            <Link
              href={`/ot/${profile.slug}`}
              className="rounded-lg border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary-light"
            >
              {t('viewProfile')}
            </Link>
          )}
        </div>

        {/* Profile incomplete notice */}
        {profile && !profile.location.city && (
          <div className="rounded-lg bg-amber-50 px-5 py-4 text-sm text-amber-800">
            {t('incompleteProfile')}
            {' '}<Link href="/dashboard/edit" className="font-semibold underline">
              {t('completeProfile')}
            </Link>
          </div>
        )}

        {/* No OT profile — patient account */}
        {!profile && (
          <div className="rounded-lg bg-surface p-6 shadow-card text-text-secondary text-sm">
            {t('patientAccountNotice')}{' '}
            <Link href="/search" className="font-semibold text-primary hover:underline">
              {t('searchPageLink')}
            </Link>
            .
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg bg-surface p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
      <p className="mt-1 text-2xl font-bold text-text-primary">{value}</p>
    </div>
  );
}

function calcCompleteness(profile: Awaited<ReturnType<typeof getOTProfileById>>): number {
  if (!profile) return 0;
  const checks = [
    !!profile.location.city,
    !!profile.bio.he,
    profile.specialisations.length > 0,
    profile.sessionTypes.length > 0,
    profile.insuranceAccepted.length > 0,
    !!profile.contactPhone,
    !!profile.photo,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}
