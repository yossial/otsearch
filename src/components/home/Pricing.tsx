import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { FadeInUp, StaggerList, StaggerItem } from '@/components/ui/motion';

const FREE_FEATURES = [
  'freeFeature1', 'freeFeature2', 'freeFeature3', 'freeFeature4', 'freeFeature5',
] as const;

const PREMIUM_FEATURES = [
  'premiumFeature1', 'premiumFeature2', 'premiumFeature3', 'premiumFeature4', 'premiumFeature5',
] as const;

function CheckIcon({ accent = false }: { accent?: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
        accent ? 'bg-accent/15 text-accent' : 'bg-primary-light text-primary'
      }`}
    >
      <svg
        width="11"
        height="11"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

export default async function Pricing() {
  const t = await getTranslations('home.pricing');

  return (
    <section id="pricing" className="bg-surface py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <FadeInUp>
          <div className="mb-14 text-center">
            <div className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
              <span
                className="h-1.5 w-1.5 rounded-full bg-primary"
                style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
                aria-hidden="true"
              />
              <span className="text-xs font-medium uppercase tracking-[0.15em] text-primary">
                {t('eyebrow')}
              </span>
            </div>
            <h2 className="font-display text-2xl font-normal text-text-primary sm:text-3xl">
              {t('title')}
            </h2>
            <p className="mt-2 text-sm text-text-muted">{t('subtitle')}</p>
          </div>
        </FadeInUp>

        <StaggerList className="grid grid-cols-1 gap-5 sm:grid-cols-2">

          {/* ── Free tier ─────────────────────────────────────────── */}
          <StaggerItem>
            <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted">
                  {t('freeName')}
                </p>
                <p className="mt-2 text-5xl font-extrabold text-text-primary">
                  {t('freePrice')}
                </p>
                <p className="text-sm text-text-muted">{t('freePeriod')}</p>
                <p className="mt-3 text-sm text-text-secondary">{t('freeDesc')}</p>
              </div>

              <ul className="mt-7 flex flex-col gap-3">
                {FREE_FEATURES.map((key) => (
                  <li key={key} className="flex items-center gap-2.5 text-sm text-text-secondary">
                    <CheckIcon />
                    {t(key)}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                <Link
                  href="/auth/register"
                  className="block w-full rounded-lg bg-primary py-3 text-center text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-[0_4px_12px_rgba(0,29,61,0.2)]"
                >
                  {t('freeCta')}
                </Link>
              </div>
            </div>
          </StaggerItem>

          {/* ── Premium tier — coming soon ─────────────────────── */}
          <StaggerItem>
            <div className="relative flex h-full flex-col overflow-hidden rounded-xl border-2 border-accent bg-surface p-6">
              {/* Coming soon ribbon */}
              <div className="absolute end-4 top-4 rounded-full bg-accent px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-text-accent">
                {t('premiumBadge')}
              </div>

              <div className="opacity-50">
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-text-muted">
                  {t('premiumName')}
                </p>
                <p className="mt-2 text-2xl font-extrabold text-text-primary">
                  {t('premiumPrice')}
                </p>
                <p className="mt-3 text-sm text-text-secondary">{t('premiumDesc')}</p>
              </div>

              <ul className="mt-7 flex flex-col gap-3 opacity-50">
                {PREMIUM_FEATURES.map((key) => (
                  <li key={key} className="flex items-center gap-2.5 text-sm text-text-secondary">
                    <CheckIcon accent />
                    {t(key)}
                  </li>
                ))}
              </ul>

              <div className="mt-auto pt-8">
                <button
                  type="button"
                  disabled
                  className="block w-full cursor-not-allowed rounded-lg border-2 border-accent py-3 text-center text-sm font-bold text-accent opacity-50"
                >
                  {t('premiumCta')}
                </button>
              </div>
            </div>
          </StaggerItem>

        </StaggerList>
      </div>
    </section>
  );
}
