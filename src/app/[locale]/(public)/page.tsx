import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { searchTherapists } from '@/lib/db/therapists';
import { searchMockTherapists } from '@/lib/mock-search';
import SearchBar from '@/components/home/SearchBar';
import FilterRow from '@/components/home/FilterRow';
import TherapistGrid from '@/components/home/TherapistGrid';
import HowItWorks from '@/components/home/HowItWorks';
import WhatIsOccupationalTherapy from '@/components/home/WhatIsOccupationalTherapy';
import WhyJoinUs from '@/components/home/WhyJoinUs';
import ContactSection from '@/components/home/ContactSection';
import TherapistMapWrapper from '@/components/home/TherapistMapWrapper';
import HeroGraphic from '@/components/home/HeroGraphic';
import Testimonials from '@/components/home/Testimonials';
import Pricing from '@/components/home/Pricing';
import FAQ from '@/components/home/FAQ';
import { FadeInUp } from '@/components/ui/motion';
import type { SearchParams } from '@/types';

interface HomePageProps {
  searchParams: Promise<{
    q?: string;
    specialisation?: string | string[];
    insurance?: string | string[];
    sessionType?: string | string[];
    language?: string | string[];
    city?: string;
    district?: string;
    acceptingOnly?: string;
    sort?: string;
    page?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const sp = await searchParams;
  const tHome = await getTranslations('home');

  const query: SearchParams = {
    q: sp.q,
    specialisation: sp.specialisation as SearchParams['specialisation'],
    insurance: sp.insurance as SearchParams['insurance'],
    sessionType: sp.sessionType as SearchParams['sessionType'],
    language: sp.language,
    city: sp.city,
    district: sp.district,
    acceptingOnly: sp.acceptingOnly === 'true',
    sort: (sp.sort as SearchParams['sort']) ?? 'rating',
    page: 1,
    limit: 10,
  };

  let profiles = [] as Awaited<ReturnType<typeof searchTherapists>>['profiles'];
  let total = 0;
  let totalPages = 1;

  try {
    ({ profiles, total, totalPages } = await searchTherapists(query));
  } catch (err) {
    console.warn('[HomePage] DB unavailable, falling back to mock data:', (err as Error).message);
    ({ profiles, total, totalPages } = searchMockTherapists(query));
  }

  const spEntries: string[] = [];
  if (sp.q) spEntries.push(`q=${encodeURIComponent(sp.q)}`);
  if (sp.sort) spEntries.push(`sort=${encodeURIComponent(sp.sort)}`);
  if (sp.specialisation) {
    const specs = Array.isArray(sp.specialisation) ? sp.specialisation : [sp.specialisation];
    specs.forEach((s) => spEntries.push(`specialisation=${encodeURIComponent(s)}`));
  }
  if (sp.insurance) {
    const ins = Array.isArray(sp.insurance) ? sp.insurance : [sp.insurance];
    ins.forEach((i) => spEntries.push(`insurance=${encodeURIComponent(i)}`));
  }
  if (sp.sessionType) {
    const sts = Array.isArray(sp.sessionType) ? sp.sessionType : [sp.sessionType];
    sts.forEach((s) => spEntries.push(`sessionType=${encodeURIComponent(s)}`));
  }
  if (sp.language) {
    const langs = Array.isArray(sp.language) ? sp.language : [sp.language];
    langs.forEach((l) => spEntries.push(`language=${encodeURIComponent(l)}`));
  }
  if (sp.city) spEntries.push(`city=${encodeURIComponent(sp.city)}`);
  if (sp.district) spEntries.push(`district=${encodeURIComponent(sp.district)}`);
  if (sp.acceptingOnly === 'true') spEntries.push('acceptingOnly=true');
  const searchParamsStr = spEntries.join('&');

  return (
    <div className="min-h-screen bg-bg">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section id="hero" className="overflow-hidden border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:px-8 lg:pb-20 lg:pt-16">
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-16">

            {/* Text column */}
            <div className="w-full flex-1 text-center lg:text-start">

              {/* Section badge */}
              <FadeInUp>
                <div className="mb-5 inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-primary"
                    style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-medium uppercase tracking-[0.15em] text-primary">
                    {tHome('heroEyebrow')}
                  </span>
                </div>
              </FadeInUp>

              {/* Headline */}
              <FadeInUp delay={0.05}>
                <h1 className="font-display text-4xl font-normal leading-[1.1] tracking-tight text-text-primary sm:text-[2.75rem] lg:text-5xl xl:text-[3.25rem]">
                  {tHome('heroTitle')}
                </h1>
                {/* Accent underline bar */}
                <div className="mt-3 flex justify-center lg:justify-start">
                  <div className="h-1 w-16 rounded-full bg-accent" aria-hidden="true" />
                </div>
              </FadeInUp>

              <FadeInUp delay={0.1}>
                <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-text-secondary lg:mx-0 lg:max-w-lg">
                  {tHome('heroParagraph')}
                </p>
              </FadeInUp>

              {/* Trust signals */}
              <FadeInUp delay={0.15}>
                <div className="mt-8 flex flex-wrap justify-center gap-6 lg:justify-start">
                  <div className="flex flex-col items-center lg:items-start">
                    <span className="text-2xl font-extrabold text-primary">{tHome('stats.therapists')}</span>
                    <span className="text-xs text-text-secondary">{tHome('stats.therapistsLabel')}</span>
                  </div>
                  <div className="w-px self-stretch bg-border" aria-hidden="true" />
                  <div className="flex flex-col items-center lg:items-start">
                    <span className="text-2xl font-extrabold text-primary">{tHome('stats.cities')}</span>
                    <span className="text-xs text-text-secondary">{tHome('stats.citiesLabel')}</span>
                  </div>
                  <div className="w-px self-stretch bg-border" aria-hidden="true" />
                  <div className="flex flex-col items-center lg:items-start">
                    <span className="text-2xl font-extrabold text-primary">{tHome('stats.funds')}</span>
                    <span className="text-xs text-text-secondary">{tHome('stats.fundsLabel')}</span>
                  </div>
                </div>
              </FadeInUp>

              {/* CTAs */}
              <FadeInUp delay={0.2}>
                <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                  <a
                    href="#search"
                    className="group inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-mid hover:shadow-[0_6px_16px_rgba(0,29,61,0.25)]"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                    </svg>
                    {tHome('searchButton')}
                  </a>
                  <a
                    href="#for-therapists"
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-text-primary transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary"
                  >
                    {tHome('heroTherapistCta')}
                  </a>
                </div>
              </FadeInUp>
            </div>

            {/* Graphic column — hidden on small screens */}
            <div className="hidden w-full shrink-0 justify-center lg:flex lg:w-[46%]">
              <HeroGraphic />
            </div>

          </div>
        </div>
      </section>

      {/* ── Search + filter header ────────────────────────────────────────── */}
      <div id="search" className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 pb-4 pt-7 sm:px-6 lg:px-8">
          <div className="mb-4 inline-flex items-center gap-2.5 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full bg-primary"
              style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
              aria-hidden="true"
            />
            <span className="text-xs font-medium uppercase tracking-[0.15em] text-primary">
              {tHome('searchHeading')}
            </span>
          </div>
          <SearchBar size="hero" initialQuery={sp.q} />
        </div>
        <FilterRow />
      </div>

      {/* ── Results grid ─────────────────────────────────────────────────── */}
      <div className="bg-bg-alt">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <TherapistGrid
            initialProfiles={profiles}
            initialTotal={total}
            initialPage={1}
            totalPages={totalPages}
            searchParamsStr={searchParamsStr}
            previewMode
          />
        </div>
      </div>

      {/* ── Why join us ───────────────────────────────────────────────────── */}
      <WhyJoinUs />

      {/* ── How it works ──────────────────────────────────────────────────── */}
      <HowItWorks />

      {/* ── Testimonials ──────────────────────────────────────────────────── */}
      <Testimonials />

      {/* ── Pricing ───────────────────────────────────────────────────────── */}
      <Pricing />

      {/* ── What is OT ────────────────────────────────────────────────────── */}
      <WhatIsOccupationalTherapy />

      {/* ── Map section ───────────────────────────────────────────────────── */}
      <section id="map" className="border-t border-border bg-bg-alt py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeInUp>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-light">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary" aria-hidden="true">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
              </div>
              <h2 className="font-display text-xl font-normal text-text-primary">{tHome('mapTitle')}</h2>
            </div>
          </FadeInUp>
          <TherapistMapWrapper profiles={profiles} activeCity={sp.city} />
        </div>
      </section>

      {/* ── For therapists CTA (inverted dark section) ────────────────────── */}
      <section id="for-therapists" className="relative overflow-hidden bg-bg-dark py-20">
        {/* Dot texture */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        {/* Ambient accent glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -end-16 top-1/2 h-[280px] w-[280px] -translate-y-1/2 rounded-full bg-accent opacity-[0.06] blur-[80px]"
        />

        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <FadeInUp>
            <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:justify-between sm:text-start">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3.5 py-1">
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-accent"
                    style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
                    aria-hidden="true"
                  />
                  <span className="text-xs font-medium uppercase tracking-[0.15em] text-accent">
                    {tHome('therapistBanner.free')}
                  </span>
                </div>
                <h2 className="font-display text-2xl font-normal text-white sm:text-3xl">
                  {tHome('therapistBanner.title')}
                </h2>
                <p className="mt-2 max-w-lg text-base text-white/60">
                  {tHome('therapistBanner.subtitle')}
                </p>
              </div>
              <Link
                href="/auth/register"
                className="shrink-0 rounded-xl bg-accent px-8 py-3.5 text-sm font-bold text-text-accent shadow-accent transition-all duration-200 hover:-translate-y-0.5 hover:bg-sand hover:shadow-accent-lg"
              >
                {tHome('therapistBanner.cta')}
              </Link>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <FAQ />

      {/* ── Contact section ───────────────────────────────────────────────── */}
      <ContactSection />
    </div>
  );
}
