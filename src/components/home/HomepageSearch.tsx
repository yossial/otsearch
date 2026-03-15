import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import SearchBar from '@/components/home/SearchBar';
import FilterRow from '@/components/home/FilterRow';
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

      {/* ── Social proof strip ────────────────────────────────────── */}
      <div className="border-t border-border bg-bg-alt">
        <div className="mx-auto max-w-3xl px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">

            {/* Avatar stack + count */}
            <div className="flex items-center gap-3">
              {profiles.length > 0 && (
                <div className="flex items-center">
                  {profiles.slice(0, 6).map((p, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={p.id}
                      src={p.photo ?? `https://i.pravatar.cc/150?u=${p.slug}`}
                      alt=""
                      aria-hidden="true"
                      width={28}
                      height={28}
                      className="h-7 w-7 rounded-full object-cover ring-2 ring-bg-alt"
                      style={{ marginInlineStart: i === 0 ? '0' : '-8px', zIndex: 6 - i }}
                    />
                  ))}
                </div>
              )}
              <p className="text-sm text-text-secondary">
                <span className="font-normal text-text-primary">
                  {total > 0 ? `${total}+` : '200+'}
                </span>
                {' '}
                {tPreview('statTherapists')}
              </p>
            </div>

            {/* CTA link */}
            <Link
              href="/search"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-normal text-primary transition-colors hover:text-primary-dark"
            >
              {tPreview('cta')}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
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
        </div>
      </div>
    </section>
  );
}
