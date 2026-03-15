import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import SearchBar from '@/components/home/SearchBar';
import FilterRow from '@/components/home/FilterRow';
import TherapistDeck from '@/components/home/TherapistDeck';
import { FadeInUp } from '@/components/ui/motion';
import type { TherapistProfilePublic } from '@/types';

interface Props {
  profiles: TherapistProfilePublic[];
  total: number;
  initialQuery?: string;
}

export default async function HomepageSearch({ profiles, total, initialQuery }: Props) {
  const t = await getTranslations('home');
  const tPreview = await getTranslations('home.therapistPreview');

  return (
    <section id="search" className="border-b border-border bg-surface">

      {/* ── Search input ──────────────────────────────────────────── */}
      <div className="mx-auto max-w-3xl px-4 pb-4 pt-7 sm:px-6 lg:px-8">
        <div className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
          <span
            className="h-1.5 w-1.5 rounded-full bg-primary"
            style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
            aria-hidden="true"
          />
          <span className="section-eyebrow text-primary">{t('searchHeading')}</span>
        </div>
        <SearchBar size="hero" initialQuery={initialQuery} />
      </div>

      {/* ── Filter row ────────────────────────────────────────────── */}
      <FilterRow />

      {/* ── Results ───────────────────────────────────────────────── */}
      <div className="border-t border-border bg-bg-alt">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

          <FadeInUp>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              {/* Left: eyebrow + title */}
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-accent"
                    style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
                    aria-hidden="true"
                  />
                  <span className="section-eyebrow text-primary">{tPreview('eyebrow')}</span>
                </div>
                <h2 className="font-display text-xl font-normal text-text-primary sm:text-2xl">
                  {tPreview('title')}
                </h2>
              </div>

              {/* Right: compact stats */}
              <div className="flex items-center gap-5">
                <div className="text-center">
                  <p className="text-xl font-extrabold text-primary">{total > 0 ? `${total}+` : '200+'}</p>
                  <p className="text-xs text-text-muted">{tPreview('statTherapists')}</p>
                </div>
                <div className="h-8 w-px bg-border" aria-hidden="true" />
                <div className="text-center">
                  <p className="text-xl font-extrabold text-primary">42+</p>
                  <p className="text-xs text-text-muted">{tPreview('statCities')}</p>
                </div>
                <div className="h-8 w-px bg-border" aria-hidden="true" />
                <div className="text-center">
                  <p className="text-xl font-extrabold text-primary">4</p>
                  <p className="text-xs text-text-muted">{tPreview('statFunds')}</p>
                </div>
              </div>
            </div>
          </FadeInUp>

          {/* Avatar deck */}
          {profiles.length > 0 && (
            <FadeInUp delay={0.05}>
              <TherapistDeck profiles={profiles} />
            </FadeInUp>
          )}

          {/* CTA */}
          <FadeInUp delay={0.1}>
            <div className="mt-8 flex justify-center">
              <Link
                href="/search"
                className="inline-flex w-full max-w-md items-center justify-center gap-3 rounded-2xl bg-primary py-4 text-base font-normal text-white shadow-primary-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-primary-lg"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                {tPreview('cta')}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="rtl:rotate-180"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </Link>
            </div>
          </FadeInUp>

        </div>
      </div>
    </section>
  );
}
