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

const COMPLETENESS_ITEMS = ['city', 'bio', 'specialisations', 'sessionTypes', 'insurance', 'phone', 'photo'] as const;

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

  // Circular ring geometry
  const RING_R = 36;
  const RING_CIRCUM = 2 * Math.PI * RING_R;
  const ringOffset = RING_CIRCUM * (1 - completenessScore / 100);

  // Star rating
  const ratingFull = profile ? Math.floor(profile.ratingAvg) : 0;
  const ratingHalf = profile ? profile.ratingAvg - ratingFull >= 0.5 : false;

  return (
    <div className="min-h-screen bg-bg-alt">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Header ──────────────────────────────────────────────────── */}
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
                  {isPremium ? t('subscriptionPremium') : t('subscriptionFree')}
                </span>
              </div>
            )}
          </div>

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

        {/* ── Top stats row ────────────────────────────────────────────── */}
        {profile && (
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
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
              label={t('specialisationsLabel')}
              value={profile.specialisations.length}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                </svg>
              }
            />
            <StatCard
              label={t('sessionTypesLabel')}
              value={profile.sessionTypes.length}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              }
            />
            <StatCard
              label={t('insuranceLabel')}
              value={profile.insuranceAccepted.length}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              }
            />
          </div>
        )}

        {/* ── Main grid ────────────────────────────────────────────────── */}
        <div className="grid gap-6 lg:grid-cols-2">

          {/* ── Profile completeness ring ─────────────────────────────── */}
          {profile && (
            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="mb-5 text-base font-semibold text-text-primary">{t('completenessTitle')}</h2>

              <div className="flex items-center gap-6">
                {/* SVG ring */}
                <div className="relative shrink-0">
                  <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true">
                    {/* Track */}
                    <circle cx="44" cy="44" r={RING_R} fill="none" stroke="var(--color-bg-alt)" strokeWidth="8" />
                    {/* Progress */}
                    <circle
                      cx="44"
                      cy="44"
                      r={RING_R}
                      fill="none"
                      stroke="var(--color-primary)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={RING_CIRCUM}
                      strokeDashoffset={ringOffset}
                      transform="rotate(-90 44 44)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-text-primary">{completenessScore}%</span>
                  </div>
                </div>

                {/* Checklist */}
                <ul className="flex-1 space-y-1.5">
                  {COMPLETENESS_ITEMS.map((key) => {
                    const done = !missing.includes(key);
                    return (
                      <li key={key} className="flex items-center gap-2">
                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${done ? 'bg-primary' : 'border-2 border-border'}`}>
                          {done && (
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </span>
                        <span className={`text-xs ${done ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                          {(t as (k: string) => string)(`completenessItems.${key}`)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {missing.length > 0 && (
                <Link
                  href="/dashboard/edit"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                >
                  {t('completeProfile')}
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="rtl:rotate-180">
                    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                  </svg>
                </Link>
              )}
            </div>
          )}

          {/* ── Rating + subscription tier ────────────────────────────── */}
          {profile && (
            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="mb-5 text-base font-semibold text-text-primary">{t('profileStrength')}</h2>

              {/* Rating stars */}
              <div className="mb-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{t('rating')}</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => {
                      const filled = s <= ratingFull;
                      const half = !filled && s === ratingFull + 1 && ratingHalf;
                      return (
                        <svg key={s} width="16" height="16" viewBox="0 0 24 24" fill="currentColor"
                          className={filled || half ? 'text-primary' : 'text-border'}
                        >
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                      );
                    })}
                  </div>
                  {profile.ratingCount > 0 ? (
                    <span className="text-sm font-semibold text-text-primary">
                      {profile.ratingAvg.toFixed(1)}
                      <span className="ms-1 font-normal text-text-muted">({profile.ratingCount})</span>
                    </span>
                  ) : (
                    <span className="text-sm text-text-muted">{t('noRating')}</span>
                  )}
                </div>
              </div>

              {/* Subscription tier */}
              <div className="mb-5">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">{t('subscription')}</p>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                    isPremium ? 'bg-yellow-100 text-yellow-700' : 'bg-bg-alt text-text-secondary border border-border'
                  }`}>
                    {isPremium ? t('subscriptionPremium') : t('subscriptionFree')}
                  </span>
                </div>
              </div>

              {/* Profile views bar */}
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{t('profileViews')}</p>
                  <span className="text-sm font-bold text-text-primary">{profile.profileViews.toLocaleString()}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-bg-alt">
                  <div
                    className="h-full rounded-full bg-accent transition-all"
                    style={{ width: `${Math.min(100, (profile.profileViews / Math.max(profile.profileViews, 100)) * 100)}%`, minWidth: profile.profileViews > 0 ? '4px' : '0' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── Premium upgrade prompt ────────────────────────────────── */}
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

          {/* ── Profile complete — all good ───────────────────────────── */}
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
  icon,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
        <span className="text-text-muted">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-text-primary">{value}</p>
    </div>
  );
}
