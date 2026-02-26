import { getTranslations } from 'next-intl/server';
import { MOCK_OTS } from '@/lib/mock-data';
import OTCard from '@/components/search/OTCard';
import FilterSidebar from '@/components/search/FilterSidebar';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const t = await getTranslations('search');

  const query = q?.trim().toLowerCase() ?? '';

  const results = query
    ? MOCK_OTS.filter((ot) => {
        const nameMatch = ot.name.toLowerCase().includes(query);
        const cityMatch = ot.city.toLowerCase().includes(query);
        const specialtyMatch = ot.specialties.some((s) =>
          s.toLowerCase().includes(query)
        );
        return nameMatch || cityMatch || specialtyMatch;
      })
    : MOCK_OTS;

  return (
    <div className="min-h-screen bg-bg">
      {/* Page header */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-text-primary">{t('title')}</h1>
          <p className="mt-1 text-sm text-text-secondary">
            {t('results', { count: results.length })}
            {q && (
              <span className="ms-1 font-medium text-primary">&ldquo;{q}&rdquo;</span>
            )}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Sidebar */}
          <FilterSidebar />

          {/* Results */}
          <div className="flex-1 min-w-0">
            {results.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface py-16 text-center">
                {/* Search icon */}
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
                  className="mb-3 text-text-muted"
                  aria-hidden="true"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <p className="text-base font-medium text-text-secondary">
                  {t('noResults')}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {results.map((ot) => (
                  <OTCard key={ot.id} ot={ot} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
