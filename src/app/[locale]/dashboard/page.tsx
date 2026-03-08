import { redirect } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { getTherapistProfileById } from '@/lib/db/therapists';

export async function generateMetadata() {
  const t = await getTranslations('dashboard');
  return { title: t('title') };
}

type Profile = Awaited<ReturnType<typeof getTherapistProfileById>>;

function calcCompleteness(profile: Profile): { score: number; missing: string[] } {
  if (!profile) return { score: 0, missing: [] };
  const items: Array<{ key: string; done: boolean }> = [
    { key: 'city', done: !!profile.location.city },
    { key: 'bio', done: !!profile.bio.he },
    { key: 'specialisations', done: profile.specialisations.length > 0 },
    { key: 'sessionTypes', done: profile.sessionTypes.length > 0 },
    { key: 'insurance', done: profile.insuranceAccepted.length > 0 },
    { key: 'phone', done: !!profile.contactPhone },
    { key: 'photo', done: !!profile.photo },
  ];
  const done = items.filter((i) => i.done).length;
  return {
    score: Math.round((done / items.length) * 100),
    missing: items.filter((i) => !i.done).map((i) => i.key),
  };
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/auth/login');

  const t = await getTranslations('dashboard');
  const locale = await getLocale();

  const therapistProfileId = (session.user as { therapistProfileId?: string | null }).therapistProfileId;
  const profile = therapistProfileId ? await getTherapistProfileById(therapistProfileId) : null;

  const name = session.user.name ?? session.user.email ?? '';
  const profileName = profile
    ? (profile.displayName[locale as keyof typeof profile.displayName] ?? profile.displayName.he)
    : null;

  const { score: completenessScore, missing } = calcCompleteness(profile);
  const isPremium = profile?.subscriptionTier === 'premium';

  return (
    <div className="min-h-screen bg-bg-alt">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {t('title')} — {profileName ?? name}
            </h1>
            {profile && (
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  profile.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  {profile.isActive ? t('profileActive') : t('profileInactive')}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  profile.isAcceptingPatients ? 'bg-primary-light text-primary' : 'bg-bg-alt text-text-secondary'
                }`}>
                  {profile.isAcceptingPatients ? t('acceptingPatients') : t('notAccepting')}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  isPremium ? 'bg-yellow-100 text-yellow-700' : 'bg-bg-alt text-text-secondary border border-border'
                }`}>
                  {isPremium ? 'Premium' : 'Free'}
                </span>
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap gap-2">
            <Link
              href="/dashboard/edit"
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
            >
              {t('editProfile')}
            </Link>
            {profile?.slug && (
              <Link
                href={`/therapist/${profile.slug}`}
                className="rounded-lg border border-primary px-5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-light"
              >
                {t('viewProfile')}
              </Link>
            )}
          </div>
        </div>

        {/* Stats grid */}
        {profile && (
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatCard
              label={t('profileViews')}
              value={profile.profileViews.toLocaleString()}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>
                </svg>
              }
            />
            <StatCard
              label={t('rating')}
              value={profile.ratingCount > 0 ? profile.ratingAvg.toFixed(1) : '—'}
              sub={profile.ratingCount > 0 ? t('reviews', { count: profile.ratingCount }) : t('noRating')}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              }
            />
            <StatCard
              label={t('subscription')}
              value={isPremium ? 'Premium' : 'Free'}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M6 2 3 6l9 14 9-14-3-4Z"/><path d="M3 6h18"/>
                </svg>
              }
            />
            <StatCard
              label={t('completeness')}
              value={`${completenessScore}%`}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
              }
            />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile completeness */}
          {profile && missing.length > 0 && (
            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="mb-4 text-base font-semibold text-text-primary">{t('completenessTitle')}</h2>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{completenessScore}%</span>
                  <span className="text-xs text-text-muted">{7 - missing.length}/7</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-bg-alt">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${completenessScore}%` }}
                  />
                </div>
              </div>

              {/* Missing items checklist */}
              <ul className="space-y-2">
                {missing.map((key) => (
                  <li key={key} className="flex items-center gap-2.5">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-border" />
                    <span className="text-sm text-text-secondary">
                      {(t as (k: string) => string)(`completenessItems.${key}`)}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/dashboard/edit"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                {t('completeProfile')}
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="rtl:rotate-180">
                  <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                </svg>
              </Link>
            </div>
          )}

          {/* Premium upgrade prompt */}
          {!isPremium && (
            <div className="rounded-xl border border-primary/30 bg-primary-light p-6">
              <div className="mb-2 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" aria-hidden="true">
                  <path d="M6 2 3 6l9 14 9-14-3-4Z"/><path d="M3 6h18"/>
                </svg>
                <h2 className="text-base font-semibold text-text-primary">{t('upgradeTitle')}</h2>
              </div>
              <p className="mb-4 text-sm text-text-secondary">{t('upgradeDesc')}</p>
              <Link
                href="/dashboard/billing"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
              >
                {t('upgradeCta')}
              </Link>
            </div>
          )}

          {/* Profile complete — all good */}
          {profile && missing.length === 0 && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-600">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </span>
                <div>
                  <p className="font-semibold text-green-800">{t('completeProfile')}</p>
                  <p className="text-sm text-green-700">{t('profileActive')}</p>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
        <span className="text-text-muted">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-text-muted">{sub}</p>}
    </div>
  );
}
