import { redirect } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';
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
    { key: 'city',            done: !!profile.location.city },
    { key: 'bio',             done: !!profile.bio.he },
    { key: 'specialisations', done: profile.specialisations.length > 0 },
    { key: 'sessionTypes',    done: profile.sessionTypes.length > 0 },
    { key: 'insurance',       done: profile.insuranceAccepted.length > 0 },
    { key: 'phone',           done: !!profile.contactPhone },
    { key: 'photo',           done: !!profile.photo },
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

  let therapistProfileId = (session.user as { therapistProfileId?: string | null }).therapistProfileId;

  if (!therapistProfileId) {
    await connectDB();
    const dbUser = await User.findById(session.user.id).select('therapistProfileId role').lean();
    if (!dbUser?.therapistProfileId) redirect('/onboarding/therapist');
    therapistProfileId = String(dbUser.therapistProfileId);
  }

  const profile = await getTherapistProfileById(therapistProfileId);

  const name = session.user.name ?? session.user.email ?? '';
  const profileName = profile
    ? (profile.displayName[locale as keyof typeof profile.displayName] ?? profile.displayName.he)
    : null;

  const { score: completenessScore, missing } = calcCompleteness(profile);
  const isPremium = profile?.subscriptionTier === 'premium';

  const RING_R = 34;
  const RING_CIRCUM = 2 * Math.PI * RING_R;
  const ringOffset = RING_CIRCUM * (1 - completenessScore / 100);

  const ratingFull  = profile ? Math.floor(profile.ratingAvg) : 0;
  const ratingHalf  = profile ? profile.ratingAvg - ratingFull >= 0.5 : false;

  return (
    <div className="min-h-screen bg-bg-alt">
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">

        {/* ── Hero card ───────────────────────────────────────────── */}
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {/* Accent bar */}
          <div className="h-1 bg-gradient-to-r from-primary-mid via-primary to-accent" />

          <div className="flex flex-wrap items-start justify-between gap-4 p-6">
            {/* Avatar + name */}
            <div className="flex items-start gap-4">
              {profile?.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.photo}
                  alt={profileName ?? name}
                  width={72}
                  height={72}
                  className="h-[72px] w-[72px] shrink-0 rounded-full object-cover ring-[3px] ring-primary-light"
                />
              ) : (
                <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-white ring-[3px] ring-primary-light">
                  {(profileName ?? name).charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-xl font-bold leading-tight text-text-primary">
                  {profileName ?? name}
                </h1>
                <p className="mt-0.5 text-sm text-text-muted">{t('therapistRole')}</p>
                {profile && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      profile.isActive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${profile.isActive ? 'bg-green-500' : 'bg-red-400'}`} />
                      {profile.isActive ? t('profileActive') : t('profileInactive')}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      profile.isAcceptingPatients ? 'bg-primary-light text-primary' : 'bg-bg-alt text-text-muted'
                    }`}>
                      {profile.isAcceptingPatients ? t('acceptingPatients') : t('notAccepting')}
                    </span>
                    {isPremium && (
                      <span className="rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-medium text-yellow-700">
                        {t('subscriptionPremium')}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex shrink-0 gap-2">
              <Link
                href="/dashboard/edit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold tracking-wide text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-[0_4px_12px_rgba(0,29,61,0.2)]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                {t('editProfile')}
              </Link>
              {profile?.slug && (
                <Link
                  href={`/therapist/${profile.slug}?from=dashboard`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-all duration-200 hover:border-primary/30 hover:bg-primary-light hover:text-primary"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                  {t('viewProfile')}
                </Link>
              )}
            </div>
          </div>

          {/* Stats bar */}
          {profile && (
            <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border bg-bg px-6 py-3">
              <StatItem
                label={t('profileViews')}
                value={profile.profileViews.toLocaleString()}
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>}
              />
              <StatItem
                label={t('specialisationsLabel')}
                value={profile.specialisations.length}
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>}
              />
              <StatItem
                label={t('sessionTypesLabel')}
                value={profile.sessionTypes.length}
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>}
              />
              <StatItem
                label={t('insuranceLabel')}
                value={profile.insuranceAccepted.length}
                icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
              />
              {profile.ratingCount > 0 && (
                <StatItem
                  label={t('rating')}
                  value={`${profile.ratingAvg.toFixed(1)} (${profile.ratingCount})`}
                  icon={<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-accent" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>}
                />
              )}
            </div>
          )}
        </div>

        {/* ── 2-col grid ──────────────────────────────────────────── */}
        <div className="grid gap-5 lg:grid-cols-2">

          {/* Profile completeness */}
          {profile && (
            <div className="rounded-xl border border-border bg-surface p-6">
              <div className="mb-5 flex items-center justify-between">
                <h2 className="text-base font-semibold text-text-primary">{t('completenessTitle')}</h2>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  completenessScore === 100 ? 'bg-green-50 text-green-700' : 'bg-primary-light text-primary'
                }`}>
                  {completenessScore}%
                </span>
              </div>

              <div className="flex items-center gap-5">
                {/* Ring */}
                <div className="relative shrink-0">
                  <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden="true">
                    <circle cx="40" cy="40" r={RING_R} fill="none" stroke="var(--color-bg-alt)" strokeWidth="7" />
                    <circle
                      cx="40" cy="40" r={RING_R}
                      fill="none"
                      stroke={completenessScore === 100 ? 'var(--color-success)' : 'var(--color-primary)'}
                      strokeWidth="7"
                      strokeLinecap="round"
                      strokeDasharray={RING_CIRCUM}
                      strokeDashoffset={ringOffset}
                      transform="rotate(-90 40 40)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    {completenessScore === 100 ? (
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    ) : (
                      <span className="text-lg font-bold text-text-primary">{completenessScore}%</span>
                    )}
                  </div>
                </div>

                {/* Checklist */}
                <ul className="flex-1 space-y-1.5">
                  {COMPLETENESS_ITEMS.map((key) => {
                    const done = !missing.includes(key);
                    return (
                      <li key={key} className="flex items-center gap-2">
                        <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors ${
                          done ? 'bg-green-500' : 'border-2 border-border'
                        }`}>
                          {done && (
                            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </span>
                        <span className={`text-xs ${done ? 'text-text-muted line-through' : 'font-medium text-text-primary'}`}>
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

          {/* Rating & subscription */}
          {profile && (
            <div className="rounded-xl border border-border bg-surface p-6">
              <h2 className="mb-5 text-base font-semibold text-text-primary">{t('profileStrength')}</h2>

              {/* Rating */}
              <div className="mb-5">
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">{t('rating')}</p>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => {
                      const filled = s <= ratingFull;
                      const half   = !filled && s === ratingFull + 1 && ratingHalf;
                      return (
                        <svg key={s} width="15" height="15" viewBox="0 0 24 24" fill="currentColor"
                          className={filled || half ? 'text-accent' : 'text-border'}
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

              {/* Subscription */}
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">{t('subscription')}</p>
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
                  isPremium ? 'bg-yellow-100 text-yellow-700' : 'border border-border bg-bg-alt text-text-secondary'
                }`}>
                  {isPremium ? t('subscriptionPremium') : t('subscriptionFree')}
                </span>
              </div>

              {/* Profile complete state */}
              {missing.length === 0 && (
                <div className="mt-5 flex items-center gap-2.5 rounded-lg bg-green-50 px-3 py-2.5">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </span>
                  <p className="text-sm font-medium text-green-800">{t('completeProfile')}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Upgrade banner (free tier only) ─────────────────────── */}
        {!isPremium && (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary-light px-6 py-5">
            <div className="flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-primary" aria-hidden="true">
                <path d="M6 2 3 6l9 14 9-14-3-4Z"/><path d="M3 6h18"/>
              </svg>
              <div>
                <p className="font-semibold text-text-primary">{t('upgradeTitle')}</p>
                <p className="mt-0.5 text-sm text-text-secondary">{t('upgradeDesc')}</p>
              </div>
            </div>
            <Link
              href="/dashboard/billing"
              className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold tracking-wide text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-[0_4px_12px_rgba(0,29,61,0.2)]"
            >
              {t('upgradeCta')}
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

function StatItem({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-text-muted">
      {icon}
      <span className="text-sm font-semibold text-text-primary">{value}</span>
      <span className="text-xs text-text-muted">{label}</span>
    </div>
  );
}
