import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { searchTherapists } from '@/lib/db/therapists';
import { searchMockTherapists } from '@/lib/mock-search';
import SearchBar from '@/components/home/SearchBar';
import FilterRow from '@/components/home/FilterRow';
import TherapistGrid from '@/components/home/TherapistGrid';
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
    acceptingOnly: sp.acceptingOnly === 'true',
    sort: (sp.sort as SearchParams['sort']) ?? 'rating',
    page: 1,
    limit: 20,
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
  if (sp.acceptingOnly === 'true') spEntries.push('acceptingOnly=true');
  const searchParamsStr = spEntries.join('&');

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero section — 2-column: 70% text / 30% illustration */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <div className="flex flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-center lg:gap-16">

            {/* Text column — 70% */}
            <div className="max-w-lg w-full text-center lg:text-start">
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
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-6 py-3 text-sm font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary"
                >
                  {tHome('therapistBanner.cta')}
                </Link>
              </div>
            </div>

            {/* Illustration column — 30% */}
            <div className="flex justify-center">
              <Image
                src="/hero.jpg"
                alt=""
                width={384}
                height={384}
                className="w-80 lg:w-96 h-auto"
                aria-hidden="true"
              />
            </div>

          </div>
        </div>
      </section>

      {/* Sticky search + filter header */}
      <div id="search" className="sticky top-0 z-20 border-b border-border bg-surface/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 pb-3 pt-4 sm:px-6 lg:px-8">
          <p className="mb-2.5 text-sm font-semibold text-text-secondary">
            {tHome('searchHeading')}
          </p>
          <SearchBar size="hero" initialQuery={sp.q} />
        </div>
        <FilterRow />
      </div>

      {/* Results grid */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <TherapistGrid
          key={searchParamsStr}
          initialProfiles={profiles}
          initialTotal={total}
          initialPage={1}
          totalPages={totalPages}
          searchParamsStr={searchParamsStr}
        />
      </div>

      {/* Map section */}
      <section className="border-t border-border bg-bg-alt py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">{tHome('mapTitle')}</h2>
          <TherapistMapWrapper profiles={profiles} activeCity={sp.city} />
        </div>
      </section>

      {/* Contact section */}
      <ContactSection />
    </div>
  );
}
