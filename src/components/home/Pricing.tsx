import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { FadeInUp, StaggerList, StaggerItem } from '@/components/ui/motion';

const FREE_FEATURES = [
  'freeFeature1', 'freeFeature2', 'freeFeature3', 'freeFeature4', 'freeFeature5',
] as const;

const PREMIUM_FEATURES = [
  'premiumFeature1', 'premiumFeature2', 'premiumFeature3',
  'premiumFeature4', 'premiumFeature5', 'premiumFeature6', 'premiumFeature7',
] as const;

function FreeCheck() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

function PremiumCheck() {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

export default async function Pricing() {
  const t = await getTranslations('home.pricing');

  return (
    <section id="pricing" className="bg-bg-alt py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <FadeInUp>
          <div className="mb-14 text-center">
            <div className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full bg-accent"
                style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
                aria-hidden="true"
              />
              <span className="section-eyebrow text-primary">{t('eyebrow')}</span>
            </div>
            <h2 className="font-display text-2xl font-normal text-text-primary sm:text-3xl">
              {t('title')}
            </h2>
            <p className="mt-2 text-sm text-text-muted">{t('subtitle')}</p>
          </div>
        </FadeInUp>

        <StaggerList className="grid grid-cols-1 gap-5 sm:grid-cols-2">

          {/* ── Free tier ───────────────────────────────────────────── */}
          <StaggerItem>
            <div className="card flex h-full flex-col p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
              <div>
                <p className="section-eyebrow text-text-muted">{t('freeName')}</p>
                <p className="mt-2 text-5xl font-extrabold text-text-primary">{t('freePrice')}</p>
                <p className="text-sm text-text-muted">{t('freePeriod')}</p>
                <p className="mt-3 text-sm text-text-secondary">{t('freeDesc')}</p>
              </div>

              <ul className="mt-7 flex flex-col gap-3">
                {FREE_FEATURES.map((key) => (
                  <li key={key} className="flex items-center gap-2.5 text-sm text-text-secondary">
                    <FreeCheck />
                    {t(key)}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                <Link
                  href="/auth/register"
                  className="block w-full rounded-lg border border-primary py-3 text-center text-sm font-normal text-primary transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary hover:text-white"
                >
                  {t('freeCta')}
                </Link>
              </div>
            </div>
          </StaggerItem>

          {/* ── Premium tier ────────────────────────────────────────── */}
          <StaggerItem>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl bg-primary p-6 shadow-primary-lg">

              {/* Gold top accent line */}
              <div className="absolute inset-x-0 top-0 h-1 bg-accent" aria-hidden="true" />

              {/* Most popular badge */}
              <div className="absolute end-4 top-4 rounded-full bg-accent px-3 py-1 text-[10px] font-normal uppercase tracking-widest text-text-accent">
                {t('premiumBadge')}
              </div>

              <div>
                <p className="text-xs font-normal uppercase tracking-widest text-white/60">{t('premiumName')}</p>

                {/* Trial highlight */}
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-accent/70 bg-accent/25 px-3 py-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden="true" />
                  <span className="text-xs font-normal text-white">{t('premiumTrialBadge')}</span>
                </div>

                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="text-5xl font-extrabold text-white">{t('premiumPrice')}</span>
                  <span className="text-sm text-white/60">{t('premiumPeriod')}</span>
                </div>
                <p className="mt-1 text-xs text-white/50">{t('premiumTrialNote')}</p>

                <p className="mt-3 text-sm text-white/70">{t('premiumDesc')}</p>
              </div>

              <ul className="mt-7 flex flex-col gap-3">
                {PREMIUM_FEATURES.map((key) => (
                  <li key={key} className="flex items-center gap-2.5 text-sm text-white/85">
                    <PremiumCheck />
                    {t(key)}
                  </li>
                ))}
              </ul>

              {/* ROI note */}
              <div className="mt-5 rounded-lg bg-white/8 px-4 py-2.5">
                <p className="text-xs text-white/55">{t('premiumRoiNote')}</p>
              </div>

              <div className="mt-auto pt-7">
                <Link
                  href="/auth/register"
                  className="block w-full rounded-lg bg-accent py-3 text-center text-sm font-normal text-text-accent shadow-accent transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent-dark hover:shadow-accent-lg"
                >
                  {t('premiumCta')}
                </Link>
              </div>
            </div>
          </StaggerItem>

        </StaggerList>
      </div>
    </section>
  );
}
