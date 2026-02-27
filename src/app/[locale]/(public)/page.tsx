import { getTranslations, getLocale } from 'next-intl/server';
import { searchOTs } from '@/lib/db/ots';
import { searchMockOTs } from '@/lib/mock-search';
import SearchBar from '@/components/home/SearchBar';
import FilterSidebar from '@/components/search/FilterSidebar';
import OTCard from '@/components/search/OTCard';
import type { OTProfilePublic, SearchParams } from '@/types';

interface HomePageProps {
  searchParams: Promise<{
    q?: string;
    specialisation?: string | string[];
    insurance?: string | string[];
    sessionType?: string | string[];
    language?: string | string[];
    city?: string;
    acceptingOnly?: string;
    page?: string;
  }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const sp = await searchParams;
  const tHome = await getTranslations('home');
  const tSearch = await getTranslations('search');
  const locale = await getLocale();

  const query: SearchParams = {
    q: sp.q,
    specialisation: sp.specialisation as SearchParams['specialisation'],
    insurance: sp.insurance as SearchParams['insurance'],
    sessionType: sp.sessionType as SearchParams['sessionType'],
    language: sp.language,
    city: sp.city,
    acceptingOnly: sp.acceptingOnly === 'true',
    page: sp.page ? parseInt(sp.page, 10) : 1,
    limit: 20,
  };

  let profiles: OTProfilePublic[] = [];
  let total = 0;
  let usingMockData = false;

  try {
    ({ profiles, total } = await searchOTs(query));
  } catch (err) {
    console.warn('[HomePage] DB unavailable, falling back to mock data:', (err as Error).message);
    ({ profiles, total } = searchMockOTs(query));
    usingMockData = true;
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Compact hero */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6 lg:px-8">
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">
            {tHome('heroTitle')}
          </h1>
          <p className="mb-6 text-base text-text-secondary">{tHome('heroSubtitle')}</p>
          <SearchBar />
        </div>
      </div>

      {/* Results count bar */}
      <div className="border-b border-border bg-bg">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-sm text-text-secondary">
            {tSearch('results', { count: total })}
            {sp.q && (
              <span className="ms-1 font-medium text-primary">&ldquo;{sp.q}&rdquo;</span>
            )}
            {usingMockData && (
              <span className="ms-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                demo data
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters + results */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <FilterSidebar />

          <div className="flex-1 min-w-0">
            {profiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface py-16 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-text-muted" aria-hidden="true">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <p className="text-base font-medium text-text-secondary">
                  {tSearch('noResults')}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {profiles.map((ot) => (
                  <OTCard key={ot.id} ot={ot} locale={locale} t={tSearch} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
