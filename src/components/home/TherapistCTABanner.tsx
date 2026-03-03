import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function TherapistCTABanner() {
  const t = await getTranslations('home.therapistBanner');

  return (
    <section className="bg-primary py-16">
      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        {/* Free badge */}
        <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/70">
          <span className="h-1 w-1 rounded-full bg-accent" aria-hidden="true" />
          {t('free')}
        </span>

        <h2 className="mb-4 text-2xl font-bold text-white sm:text-3xl">
          {t('title')}
        </h2>
        <p className="mb-8 text-base leading-relaxed text-white/70">
          {t('subtitle')}
        </p>

        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-xl border-2 border-white/60 px-8 py-3.5 text-sm font-bold text-white transition-all duration-200 hover:border-white hover:bg-white hover:text-primary"
        >
          {t('cta')}
          {/* Arrow that flips in RTL */}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="icon-directional" aria-hidden="true">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </section>
  );
}
