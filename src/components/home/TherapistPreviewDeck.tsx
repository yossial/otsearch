import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import TherapistDeck from '@/components/home/TherapistDeck';
import type { TherapistProfilePublic } from '@/types';
import { FadeInUp } from '@/components/ui/motion';

interface Props {
  profiles: TherapistProfilePublic[];
  total: number;
}

export default async function TherapistPreviewDeck({ profiles, total }: Props) {
  const t = await getTranslations('home.therapistPreview');

  return (
    <section className="overflow-hidden bg-bg-alt py-20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">

        {/* ── Header ────────────────────────────────────────────────── */}
        <FadeInUp>
          <div className="mb-10 text-center">
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
          </div>
        </FadeInUp>

        {/* ── Compact stats bar ─────────────────────────────────────── */}
        <FadeInUp delay={0.05}>
          <div className="mb-10 flex flex-wrap items-center justify-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-primary">{total > 0 ? `${total}+` : '200+'}</p>
              <p className="text-xs text-text-muted">{t('statTherapists')}</p>
            </div>
            <div className="h-8 w-px bg-border" aria-hidden="true" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-primary">42+</p>
              <p className="text-xs text-text-muted">{t('statCities')}</p>
            </div>
            <div className="h-8 w-px bg-border" aria-hidden="true" />
            <div className="text-center">
              <p className="text-2xl font-extrabold text-primary">4</p>
              <p className="text-xs text-text-muted">{t('statFunds')}</p>
            </div>
          </div>
        </FadeInUp>

        {/* ── Interactive horizontal deck ───────────────────────────── */}
        {profiles.length > 0 && (
          <FadeInUp delay={0.08}>
            <TherapistDeck profiles={profiles} />
          </FadeInUp>
        )}

        {/* ── CTA ───────────────────────────────────────────────────── */}
        <FadeInUp delay={0.15}>
          <div className="mt-10 flex justify-center">
            <Link
              href="/search"
              className="inline-flex w-full max-w-md items-center justify-center gap-3 rounded-2xl bg-primary py-4 text-base font-normal text-white shadow-primary-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-primary-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              {t('cta')}
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </Link>
          </div>
        </FadeInUp>

      </div>
    </section>
  );
}
