import { getTranslations } from 'next-intl/server';
import { getLocale } from 'next-intl/server';
import { searchOTs } from '@/lib/db/ots';
import OTCard from '@/components/search/OTCard';
import FilterSidebar from '@/components/search/FilterSidebar';
import type { OTProfilePublic } from '@/types';

interface SearchPageProps {
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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const sp = await searchParams;
  const t = await getTranslations('search');
  const locale = await getLocale();

  let profiles: OTProfilePublic[] = [];
  let total = 0;
  let dbError = false;

  try {
    ({ profiles, total } = await searchOTs({
      q: sp.q,
      specialisation: sp.specialisation,
      insurance: sp.insurance,
      sessionType: sp.sessionType,
      language: sp.language,
      city: sp.city,
      acceptingOnly: sp.acceptingOnly === 'true',
      page: sp.page ? parseInt(sp.page, 10) : 1,
      limit: 20,
    }));
  } catch (err) {
    console.error('[SearchPage] searchOTs failed:', err);
    dbError = true;
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Page header */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
          {!dbError && (
            <p className="mt-1 text-sm text-text-secondary">
              {t('results', { count: total })}
              {sp.q && (
                <span className="ms-1 font-medium text-primary">&ldquo;{sp.q}&rdquo;</span>
              )}
            </p>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {dbError ? (
          <ServiceUnavailableBanner />
        ) : (
          <div className="flex flex-col gap-6 md:flex-row md:items-start">
            {/* Sidebar */}
            <FilterSidebar />

            {/* Results */}
            <div className="flex-1 min-w-0">
              {profiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface py-16 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-text-muted" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                  <p className="text-base font-medium text-text-secondary">
                    {t('noResults')}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {profiles.map((ot) => (
                    <OTCard key={ot.id} ot={ot} locale={locale} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceUnavailableBanner() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-amber-200 bg-amber-50 py-16 text-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mb-3 text-amber-500"
        aria-hidden="true"
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <p className="text-base font-semibold text-amber-800">
        Search is temporarily unavailable
      </p>
      <p className="mt-1 text-sm text-amber-700">
        We&apos;re having trouble connecting to our database. Please try again shortly.
      </p>
    </div>
  );
}
