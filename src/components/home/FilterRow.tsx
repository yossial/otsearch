'use client';

import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const SPECIALISATIONS = [
  'paediatrics',
  'neurological',
  'mental-health',
  'hand-therapy',
  'geriatrics',
  'sensory-processing',
  'vocational',
  'ergonomic',
] as const;

const INSURANCES = ['clalit', 'maccabi', 'meuhedet', 'leumit', 'private'] as const;
const SESSION_TYPES = ['in-person', 'telehealth', 'home-visit'] as const;
const LANGUAGES = ['he', 'ar', 'en', 'ru', 'fr'] as const;

export default function FilterRow() {
  const t = useTranslations('search');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSort = searchParams.get('sort') ?? '';
  const currentSpecialisation = searchParams.get('specialisation') ?? '';
  const currentInsurance = searchParams.get('insurance') ?? '';
  const currentSessionType = searchParams.get('sessionType') ?? '';
  const currentLanguage = searchParams.get('language') ?? '';
  const currentAcceptingOnly = searchParams.get('acceptingOnly') === 'true';

  const activeFilterCount = [
    currentSort,
    currentSpecialisation,
    currentInsurance,
    currentSessionType,
    currentLanguage,
    currentAcceptingOnly,
  ].filter(Boolean).length;

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    params.delete('page');
    router.push((pathname + (params.toString() ? `?${params.toString()}` : '')) as '/');
  }

  function clearAll() {
    const params = new URLSearchParams();
    const q = searchParams.get('q');
    if (q) params.set('q', q);
    router.push((pathname + (params.toString() ? `?${params.toString()}` : '')) as '/');
  }

  const selectClass =
    'h-9 rounded-lg border border-border bg-surface px-3 pe-8 text-sm text-text-primary appearance-none cursor-pointer focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors';
  const activeSelectClass = 'border-primary bg-primary-light text-primary font-medium';

  return (
    <div className="border-t border-border bg-surface/95">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none">
          {/* Sort */}
          <div className="relative flex-shrink-0">
            <select
              value={currentSort}
              onChange={(e) => setParam('sort', e.target.value || null)}
              className={cn(selectClass, currentSort && activeSelectClass)}
            >
              <option value="">{t('sortBy')}</option>
              <option value="rating">{t('sortOptions.rating')}</option>
              <option value="newest">{t('sortNewest')}</option>
              <option value="popular">{t('sortPopular')}</option>
              <option value="relevance">{t('sortOptions.relevance')}</option>
            </select>
            <ChevronIcon />
          </div>

          <div className="h-5 w-px flex-shrink-0 bg-border" />

          {/* Specialisation */}
          <div className="relative flex-shrink-0">
            <select
              value={currentSpecialisation}
              onChange={(e) => setParam('specialisation', e.target.value || null)}
              className={cn(selectClass, currentSpecialisation && activeSelectClass)}
            >
              <option value="">{t('filters.specialisation')}</option>
              {SPECIALISATIONS.map((s) => (
                <option key={s} value={s}>
                  {t(`specialisationLabels.${s}`)}
                </option>
              ))}
            </select>
            <ChevronIcon />
          </div>

          {/* Insurance */}
          <div className="relative flex-shrink-0">
            <select
              value={currentInsurance}
              onChange={(e) => setParam('insurance', e.target.value || null)}
              className={cn(selectClass, currentInsurance && activeSelectClass)}
            >
              <option value="">{t('filters.insurance')}</option>
              {INSURANCES.map((ins) => (
                <option key={ins} value={ins}>
                  {t(`insurance.${ins}`)}
                </option>
              ))}
            </select>
            <ChevronIcon />
          </div>

          {/* Session type */}
          <div className="relative flex-shrink-0">
            <select
              value={currentSessionType}
              onChange={(e) => setParam('sessionType', e.target.value || null)}
              className={cn(selectClass, currentSessionType && activeSelectClass)}
            >
              <option value="">{t('filters.sessionType')}</option>
              {SESSION_TYPES.map((st) => (
                <option key={st} value={st}>
                  {t(`sessionTypes.${st === 'in-person' ? 'inPerson' : st === 'home-visit' ? 'homeVisit' : 'telehealth'}`)}
                </option>
              ))}
            </select>
            <ChevronIcon />
          </div>

          {/* Language */}
          <div className="relative flex-shrink-0">
            <select
              value={currentLanguage}
              onChange={(e) => setParam('language', e.target.value || null)}
              className={cn(selectClass, currentLanguage && activeSelectClass)}
            >
              <option value="">{t('filters.language')}</option>
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {t(`languageLabels.${lang}`)}
                </option>
              ))}
            </select>
            <ChevronIcon />
          </div>

          <div className="h-5 w-px flex-shrink-0 bg-border" />

          {/* Accepting patients toggle */}
          <button
            type="button"
            onClick={() => setParam('acceptingOnly', currentAcceptingOnly ? null : 'true')}
            className={cn(
              'flex h-9 flex-shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors',
              currentAcceptingOnly
                ? 'border-primary bg-primary-light font-medium text-primary'
                : 'border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-text-primary'
            )}
          >
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                currentAcceptingOnly ? 'bg-green-500' : 'bg-text-muted'
              )}
            />
            {t('acceptingPatientsFilter')}
          </button>

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="ms-auto flex h-9 flex-shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm text-text-secondary transition-colors hover:border-primary/40 hover:text-primary"
            >
              <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
              {t('clearFilters')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChevronIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="pointer-events-none absolute end-2.5 top-1/2 -translate-y-1/2 text-text-muted"
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}
