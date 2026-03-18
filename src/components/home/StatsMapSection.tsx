import { getTranslations } from 'next-intl/server';
import dynamic from 'next/dynamic';
import { Link } from '@/i18n/navigation';
import CountUpStat from './CountUpStat';
import type { TherapistProfilePublic } from '@/types';

const NetworkMap = dynamic(() => import('./NetworkMap'), { ssr: false });

interface Props {
  profiles: TherapistProfilePublic[];
  total: number;
  locale: string;
}

export default async function StatsMapSection({ profiles, total, locale }: Props) {
  const t = await getTranslations('home.network');

  // ── City stats from profiles ──────────────────────────────────────────────
  const cityStats = profiles.reduce<Record<string, number>>((acc, p) => {
    const city = p.location.city;
    if (city) acc[city] = (acc[city] ?? 0) + 1;
    return acc;
  }, {});

  const cityCount = Object.keys(cityStats).length || 23;
  const therapistCount = total > 0 ? total : 180;

  // ── Avatar strip (first 8 unique profiles with photos) ────────────────────
  const avatars = profiles.slice(0, 8);

  return (
    <section className="relative overflow-hidden bg-[#02001a]">

      {/* Ambient glow blobs */}
      <div aria-hidden="true" className="pointer-events-none absolute -top-32 end-0 h-[480px] w-[480px] rounded-full bg-primary/10 blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute bottom-0 start-0 h-[320px] w-[320px] rounded-full bg-primary/5 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 lg:px-8">

        {/* ── Section heading ────────────────────────────────────────────── */}
        <div className="mb-12 text-center">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-normal uppercase tracking-widest text-primary/80">
            <span className="h-1.5 w-1.5 rounded-full bg-primary/60" aria-hidden="true" />
            {t('eyebrow')}
          </span>
          <h2 className="font-display mt-3 text-2xl font-normal leading-snug text-white sm:text-3xl lg:text-4xl">
            {t('title')}
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-base text-white/40">
            {t('subtitle')}
          </p>
        </div>

        {/* ── Stat counters ──────────────────────────────────────────────── */}
        <div className="mb-12 grid grid-cols-2 gap-8 sm:grid-cols-4">
          <CountUpStat value={therapistCount} suffix="+" label={t('statTherapists')} />
          <CountUpStat value={cityCount}      suffix=""  label={t('statCities')}     />
          <CountUpStat value={4}              suffix=""  label={t('statFunds')}       />
          <CountUpStat value={5}              suffix=""  label={t('statLanguages')}   />
        </div>

        {/* ── Map ────────────────────────────────────────────────────────── */}
        <NetworkMap cityStats={cityStats} locale={locale} />

        {/* ── Avatar strip + CTA ─────────────────────────────────────────── */}
        <div className="mt-8 flex flex-col items-center gap-5 sm:flex-row sm:justify-between">

          {/* Stacked avatars */}
          <div className="flex items-center gap-3">
            {avatars.length > 0 && (
              <div className="flex items-center">
                {avatars.map((p, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={p.id}
                    src={p.photo ?? `https://i.pravatar.cc/150?u=${p.slug}`}
                    alt=""
                    aria-hidden="true"
                    width={36}
                    height={36}
                    className="h-9 w-9 rounded-full object-cover ring-2 ring-[#02001a]"
                    style={{ marginInlineStart: i === 0 ? 0 : -10, zIndex: 8 - i }}
                  />
                ))}
              </div>
            )}
            <p className="text-sm text-white/50">
              <span className="font-semibold text-white">{therapistCount}+</span>
              {' '}{t('statTherapists')}
            </p>
          </div>

          {/* CTA */}
          <Link
            href="/search"
            className="group inline-flex items-center gap-2.5 rounded-full border border-primary/40 bg-primary/20 px-6 py-3 text-sm font-normal text-white backdrop-blur-sm transition-all duration-200 hover:border-primary/70 hover:bg-primary/40 hover:shadow-[0_0_20px_rgba(27,15,147,0.4)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            {t('cta')}
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform duration-200 group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </Link>

        </div>
      </div>
    </section>
  );
}
