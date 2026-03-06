'use client';

import { useState, useEffect, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import * as Select from '@radix-ui/react-select';
import { cn } from '@/lib/utils';
import type { IsraelCity } from '@/lib/gov/govApi';

const SPECIALISATIONS = [
  'paediatrics', 'neurological', 'mental-health', 'hand-therapy',
  'geriatrics', 'sensory-processing', 'vocational', 'ergonomic',
] as const;

const INSURANCES = ['clalit', 'maccabi', 'meuhedet', 'leumit'] as const;
const SESSION_TYPES = ['in-person', 'telehealth', 'home-visit'] as const;
const LANGUAGES = ['he', 'en', 'ru', 'fr', 'es'] as const;

// ── Radix-based filter select ─────────────────────────────────────────────────
interface FilterSelectProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  active: boolean;
  disabled?: boolean;
}

function FilterSelect({ value, onChange, placeholder, options, active, disabled }: FilterSelectProps) {
  return (
    <Select.Root value={value || '__all__'} onValueChange={(v) => onChange(v === '__all__' ? '' : v)} disabled={disabled}>
      <Select.Trigger
        className={cn(
          'flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm transition-all duration-150 outline-none',
          'focus:ring-2 focus:ring-primary/20',
          active
            ? 'border-primary bg-primary-light font-medium text-primary'
            : 'border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-text-primary',
          disabled && 'opacity-50'
        )}
        aria-label={placeholder}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="ms-1 text-current opacity-60">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-72 min-w-[160px] overflow-y-auto rounded-xl border border-border bg-surface shadow-dropdown animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
        >
          <Select.Viewport className="p-1">
            <Select.Item
              value="__all__"
              className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-muted outline-none data-[highlighted]:bg-bg-alt data-[highlighted]:text-text-primary"
            >
              <Select.ItemText>{placeholder}</Select.ItemText>
              <Select.ItemIndicator className="ms-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </Select.ItemIndicator>
            </Select.Item>

            <div className="my-1 h-px bg-border" />

            {options.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-primary outline-none data-[highlighted]:bg-primary-light data-[highlighted]:text-primary data-[state=checked]:font-medium data-[state=checked]:text-primary"
              >
                <Select.ItemText>{opt.label}</Select.ItemText>
                <Select.ItemIndicator className="ms-auto text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                </Select.ItemIndicator>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}

// ── Main FilterRow ────────────────────────────────────────────────────────────
export default function FilterRow() {
  const t = useTranslations('search');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams.get('sort') ?? '';
  const currentSpecialisation = searchParams.get('specialisation') ?? '';
  const currentInsurance = searchParams.get('insurance') ?? '';
  const currentSessionType = searchParams.get('sessionType') ?? '';
  const currentLanguage = searchParams.get('language') ?? '';
  const currentCity = searchParams.get('city') ?? '';
  const currentAcceptingOnly = searchParams.get('acceptingOnly') === 'true';

  const [cities, setCities] = useState<IsraelCity[]>([]);

  useEffect(() => {
    fetch('/api/cities')
      .then((r) => r.json())
      .then((data: { cities?: IsraelCity[] } | IsraelCity[]) => {
        const raw = Array.isArray(data) ? data : (data.cities ?? []);
        setCities(Array.isArray(raw) ? raw : []);
      })
      .catch(() => setCities([]));
  }, []);

  const activeFilterCount = [
    currentSort, currentSpecialisation, currentInsurance,
    currentSessionType, currentLanguage, currentCity, currentAcceptingOnly,
  ].filter(Boolean).length;

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) params.delete(key); else params.set(key, value);
    params.delete('page');
    const url = (pathname + (params.toString() ? `?${params.toString()}` : '')) as '/';
    startTransition(() => { router.push(url); });
  }

  function clearAll() {
    const params = new URLSearchParams();
    const q = searchParams.get('q');
    if (q) params.set('q', q);
    startTransition(() => {
      router.push((pathname + (params.toString() ? `?${params.toString()}` : '')) as '/');
    });
  }

  const sortOptions = [
    { value: 'rating', label: t('sortOptions.rating') },
    { value: 'newest', label: t('sortNewest') },
    { value: 'popular', label: t('sortPopular') },
    { value: 'relevance', label: t('sortOptions.relevance') },
  ];
  const specialisationOptions = SPECIALISATIONS.map((s) => ({
    value: s, label: t(`specialisationLabels.${s}`),
  }));
  const insuranceOptions = INSURANCES.map((ins) => ({
    value: ins, label: t(`insurance.${ins}`),
  }));
  const sessionTypeOptions = SESSION_TYPES.map((st) => ({
    value: st,
    label: t(`sessionTypes.${st === 'in-person' ? 'inPerson' : st === 'home-visit' ? 'homeVisit' : 'telehealth'}`),
  }));
  const languageOptions = LANGUAGES.map((lang) => ({
    value: lang, label: t(`languageLabels.${lang}`),
  }));
  const cityOptions = cities.map((c) => ({ value: c.name, label: c.name }));

  return (
    <div className={cn('border-t border-border bg-surface/95 transition-opacity duration-200', isPending && 'opacity-60')}>
      {/* Loading bar */}
      {isPending && (
        <div className="h-0.5 w-full overflow-hidden bg-border">
          <div className="h-full animate-[loading_1s_ease-in-out_infinite] bg-primary" />
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto py-2.5 scrollbar-none">

          {/* Sort */}
          <FilterSelect
            value={currentSort}
            onChange={(v) => setParam('sort', v || null)}
            placeholder={t('sortBy')}
            options={sortOptions}
            active={!!currentSort}
            disabled={isPending}
          />

          <div className="h-5 w-px shrink-0 bg-border" />

          {/* Specialisation */}
          <FilterSelect
            value={currentSpecialisation}
            onChange={(v) => setParam('specialisation', v || null)}
            placeholder={t('filters.specialisation')}
            options={specialisationOptions}
            active={!!currentSpecialisation}
            disabled={isPending}
          />

          {/* Insurance */}
          <FilterSelect
            value={currentInsurance}
            onChange={(v) => setParam('insurance', v || null)}
            placeholder={t('filters.insurance')}
            options={insuranceOptions}
            active={!!currentInsurance}
            disabled={isPending}
          />

          {/* Session type */}
          <FilterSelect
            value={currentSessionType}
            onChange={(v) => setParam('sessionType', v || null)}
            placeholder={t('filters.sessionType')}
            options={sessionTypeOptions}
            active={!!currentSessionType}
            disabled={isPending}
          />

          {/* Language */}
          <FilterSelect
            value={currentLanguage}
            onChange={(v) => setParam('language', v || null)}
            placeholder={t('filters.language')}
            options={languageOptions}
            active={!!currentLanguage}
            disabled={isPending}
          />

          {/* City */}
          {cities.length > 0 && (
            <FilterSelect
              value={currentCity}
              onChange={(v) => setParam('city', v || null)}
              placeholder={t('filters.location')}
              options={cityOptions}
              active={!!currentCity}
              disabled={isPending}
            />
          )}

          <div className="h-5 w-px shrink-0 bg-border" />

          {/* Accepting patients toggle */}
          <button
            type="button"
            onClick={() => setParam('acceptingOnly', currentAcceptingOnly ? null : 'true')}
            disabled={isPending}
            className={cn(
              'flex h-9 shrink-0 items-center gap-1.5 rounded-lg border px-3 text-sm transition-colors',
              currentAcceptingOnly
                ? 'border-primary bg-primary-light font-medium text-primary'
                : 'border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-text-primary',
              isPending && 'pointer-events-none'
            )}
          >
            <span className={cn('h-2 w-2 rounded-full transition-colors', currentAcceptingOnly ? 'bg-green-500' : 'bg-text-muted')} />
            {t('acceptingPatientsFilter')}
          </button>

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              disabled={isPending}
              className="ms-auto flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm text-text-secondary transition-colors hover:border-primary/40 hover:text-primary"
            >
              <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-text-accent">
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
