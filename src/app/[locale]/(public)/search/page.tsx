import { Suspense } from 'react';
import { getTranslations } from 'next-intl/server';
import { searchTherapists } from '@/lib/db/therapists';
import { searchMockTherapists } from '@/lib/mock-search';
import SearchBar from '@/components/home/SearchBar';
import FilterSidebar from '@/components/search/FilterSidebar';
import TherapistGrid from '@/components/home/TherapistGrid';
import type { SearchParams } from '@/types';

interface SearchPageProps {
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

export async function generateMetadata() {
  const t = await getTranslations('search');
  return { title: t('title') };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;
  const t = await getTranslations('search');

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
    limit: 20,
  };

  let profiles: Awaited<ReturnType<typeof searchTherapists>>['profiles'] = [];
  let total = 0;
  let totalPages = 1;
  let usingMockData = false;

  try {
    ({ profiles, total, totalPages } = await searchTherapists(query));
  } catch (err) {
    console.warn('[SearchPage] DB unavailable, falling back to mock data:', (err as Error).message);
    ({ profiles, total, totalPages } = searchMockTherapists(query));
    usingMockData = true;
  }

  // Build searchParamsStr for TherapistGrid infinite scroll
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
      {/* Search header */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="mb-4 text-2xl font-normal text-text-primary">{t('title')}</h1>
          <Suspense>
            <SearchBar size="hero" initialQuery={sp.q} />
          </Suspense>
        </div>
      </div>

      {/* Content: sidebar + results */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Filter sidebar */}
          <Suspense>
            <FilterSidebar />
          </Suspense>

          {/* Divider — desktop only */}
          <div className="hidden w-px self-stretch bg-border md:block" aria-hidden="true" />

          {/* Results */}
          <div className="min-w-0 flex-1">
            {/* Result count + demo badge */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <p className="text-sm text-text-secondary">
                {t('results', { count: total })}
                {sp.q && (
                  <span className="ms-1 font-normal text-primary">&ldquo;{sp.q}&rdquo;</span>
                )}
              </p>
              {usingMockData && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-normal text-amber-700">
                  demo
                </span>
              )}
            </div>

            <TherapistGrid
              initialProfiles={profiles}
              initialTotal={total}
              initialPage={1}
              totalPages={totalPages}
              searchParamsStr={searchParamsStr}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
