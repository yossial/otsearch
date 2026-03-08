import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { searchTherapists } from '@/lib/db/therapists';
import { searchMockTherapists } from '@/lib/mock-search';
import SearchBar from '@/components/home/SearchBar';
import FilterRow from '@/components/home/FilterRow';
import TherapistGrid from '@/components/home/TherapistGrid';
import HowItWorks from '@/components/home/HowItWorks';
import WhatIsOT from '@/components/home/WhatIsOT';
import WhyJoinUs from '@/components/home/WhyJoinUs';
import ContactSection from '@/components/home/ContactSection';
import TherapistMapWrapper from '@/components/home/TherapistMapWrapper';
import type { SearchParams } from '@/types';
import Image from 'next/image';

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

  // Build searchParamsStr for TherapistGrid infinite scroll (mirrors URL params without page)
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
      {/* Hero section — 2-column: 70% text / 30% illustration */}
      <section id="hero" className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 sm:px-6 sm:pb-14 sm:pt-8 lg:px-8">
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:gap-12">

            {/* Text column */}
            <div className="w-full flex-1 text-center lg:text-start">
              {/* Eyebrow */}
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
                {tHome('heroEyebrow')}
              </div>

              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-text-primary sm:text-4xl lg:text-5xl">
                {tHome('heroTitle')}
              </h1>

              <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-text-secondary lg:mx-0 lg:max-w-lg">
                {tHome('heroParagraph')}
              </p>

              {/* Trust signals */}
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

              {/* CTA */}
              <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
                <a
                  href="#search"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  {tHome('searchButton')}
                </a>
                <a
                  href="#for-therapists"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary"
                >
                  {tHome('heroTherapistCta')}
                </a>
              </div>
            </div>

            {/* Illustration column */}
            <div className="flex shrink-0 justify-center lg:w-[45%]">
              <Image
                src="/hero-1.png"
                alt=""
                width={520}
                height={520}
                className="w-72 sm:w-80 lg:w-full h-auto"
                aria-hidden="true"
              />
            </div>

          </div>
        </div>
      </section>

      {/* Search + filter header */}
      <div id="search" className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 pb-3 pt-4 sm:px-6 lg:px-8">
          <p className="mb-2.5 text-sm font-semibold text-text-secondary">
            {tHome('searchHeading')}
          </p>
          <SearchBar size="hero" initialQuery={sp.q} />
        </div>
        <FilterRow />
      </div>

      {/* Results grid */}
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

      {/* Why join us — dual-audience value props */}
      <WhyJoinUs />

      {/* How it works */}
      <HowItWorks />

      {/* What is occupational therapy? */}
      <WhatIsOT />

      {/* Map section */}
      <section id="map" className="border-t border-border bg-bg-alt py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">{tHome('mapTitle')}</h2>
          <TherapistMapWrapper profiles={profiles} activeCity={sp.city} />
        </div>
      </section>

      {/* For therapists CTA */}
      <section id="for-therapists" className="border-t border-border bg-accent py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-start">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-primary">
                {tHome('therapistBanner.free')}
              </div>
              <h2 className="text-2xl font-bold text-text-inverse sm:text-3xl">
                {tHome('therapistBanner.title')}
              </h2>
              <p className="mt-2 max-w-lg text-base text-text-inverse/80">
                {tHome('therapistBanner.subtitle')}
              </p>
            </div>
            <Link
              href="/auth/register"
              className="shrink-0 rounded-xl bg-primary px-8 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-primary-dark"
            >
              {tHome('therapistBanner.cta')}
            </Link>
          </div>
        </div>
      </section>

      {/* Contact section */}
      <ContactSection />
    </div>
  );
}
