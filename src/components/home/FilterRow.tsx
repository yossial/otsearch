'use client';

import { useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import * as Select from '@radix-ui/react-select';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';
import { ISRAEL_DISTRICTS } from '@/lib/gov/govApi';

const SPECIALISATIONS = [
  'paediatrics', 'neurological', 'mental-health', 'hand-therapy',
  'geriatrics', 'sensory-processing', 'vocational', 'ergonomic',
] as const;

const INSURANCES = ['clalit', 'maccabi', 'meuhedet', 'leumit'] as const;
const SESSION_TYPES = ['in-person', 'telehealth', 'home-visit'] as const;
const LANGUAGES = ['he', 'en', 'ru', 'fr', 'es'] as const;

const chevron = (
  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

// ── Single-select filter pill ─────────────────────────────────────────────────
interface FilterSelectProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  active: boolean;
  disabled?: boolean;
  dir?: 'ltr' | 'rtl';
}

function FilterSelect({ value, onChange, placeholder, options, active, disabled, dir = 'ltr' }: FilterSelectProps) {
  return (
    <Select.Root value={value || '__all__'} onValueChange={(v) => onChange(v === '__all__' ? '' : v)} disabled={disabled} dir={dir}>
      <Select.Trigger
        className={cn(
          'flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm transition-colors duration-150 outline-none',
          active
            ? 'bg-primary-light font-medium text-primary'
            : 'bg-bg-alt text-text-secondary hover:bg-border/70 hover:text-text-primary',
          disabled && 'opacity-50 pointer-events-none'
        )}
        aria-label={placeholder}
      >
        <Select.Value placeholder={placeholder} />
        <Select.Icon className="ms-1 text-current opacity-60">{chevron}</Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={6}
          align="start"
          className="z-50 max-h-72 min-w-[--radix-select-trigger-width] overflow-y-auto rounded-xl border border-border bg-surface shadow-dropdown animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
        >
          <Select.Viewport className="p-1">
            <Select.Item
              value="__all__"
              className="flex cursor-pointer select-none items-center gap-2 rounded-lg px-3 py-2 text-sm text-text-muted outline-none data-[highlighted]:bg-bg-alt data-[highlighted]:text-text-primary"
            >
              <Select.ItemText>{placeholder}</Select.ItemText>
              <Select.ItemIndicator className="ms-auto">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
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
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
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

// ── Multi-select filter pill (DropdownMenu with CheckboxItems) ────────────────
interface FilterMultiSelectProps {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  options: { value: string; label: string }[];
  disabled?: boolean;
  dir?: 'ltr' | 'rtl';
}

function FilterMultiSelect({ values, onChange, placeholder, options, disabled, dir = 'ltr' }: FilterMultiSelectProps) {
  const active = values.length > 0;

  function toggle(value: string) {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  }

  const triggerLabel =
    values.length === 0
      ? placeholder
      : values.length === 1
        ? (options.find((o) => o.value === values[0])?.label ?? placeholder)
        : `${values.length} ×`;

  return (
    <DropdownMenu.Root dir={dir}>
      <DropdownMenu.Trigger
        disabled={disabled}
        className={cn(
          'flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm transition-colors duration-150 outline-none',
          active
            ? 'bg-primary-light font-medium text-primary'
            : 'bg-bg-alt text-text-secondary hover:bg-border/70 hover:text-text-primary',
          disabled && 'opacity-50 pointer-events-none'
        )}
        aria-label={placeholder}
      >
        <span>{triggerLabel}</span>
        <span className="ms-1 opacity-60">{chevron}</span>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={6}
          align="start"
          className="z-50 min-w-48 rounded-xl border border-border bg-surface p-1 shadow-dropdown animate-in fade-in-0 zoom-in-95"
        >
          {options.map((opt) => {
            const checked = values.includes(opt.value);
            return (
              <DropdownMenu.CheckboxItem
                key={opt.value}
                checked={checked}
                onCheckedChange={() => toggle(opt.value)}
                onSelect={(e) => e.preventDefault()}
                className={cn(
                  'flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-3 py-2 text-sm outline-none transition-colors',
                  checked
                    ? 'bg-primary-light text-primary font-medium'
                    : 'text-text-primary data-[highlighted]:bg-primary-light data-[highlighted]:text-primary'
                )}
              >
                <span className={cn(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                  checked ? 'border-primary bg-primary text-white' : 'border-border bg-surface'
                )}>
                  <DropdownMenu.ItemIndicator>
                    <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </DropdownMenu.ItemIndicator>
                </span>
                {opt.label}
              </DropdownMenu.CheckboxItem>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

// ── Main FilterRow ────────────────────────────────────────────────────────────
export default function FilterRow() {
  const t = useTranslations('search');
  const locale = useLocale();
  const dir = (locale === 'he' || locale === 'ar') ? 'rtl' : 'ltr';
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const currentSort = searchParams.get('sort') ?? '';
  const currentSpecialisations = searchParams.getAll('specialisation');
  const currentInsurances = searchParams.getAll('insurance');
  const currentSessionTypes = searchParams.getAll('sessionType');
  const currentLanguages = searchParams.getAll('language');
  const currentDistrict = searchParams.get('district') ?? '';
  const currentAcceptingOnly = searchParams.get('acceptingOnly') === 'true';

  const activeFilterCount = [
    currentSort,
    currentSpecialisations.length > 0,
    currentInsurances.length > 0,
    currentSessionTypes.length > 0,
    currentLanguages.length > 0,
    currentDistrict,
    currentAcceptingOnly,
  ].filter(Boolean).length;

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) params.delete(key); else params.set(key, value);
    params.delete('page');
    const url = (pathname + (params.toString() ? `?${params.toString()}` : '')) as '/';
    startTransition(() => { router.push(url, { scroll: false }); });
  }

  function setMultiParam(key: string, values: string[]) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(key);
    values.forEach((v) => params.append(key, v));
    params.delete('page');
    const url = (pathname + (params.toString() ? `?${params.toString()}` : '')) as '/';
    startTransition(() => { router.push(url, { scroll: false }); });
  }

  function clearAll() {
    const params = new URLSearchParams();
    const q = searchParams.get('q');
    if (q) params.set('q', q);
    startTransition(() => {
      router.push((pathname + (params.toString() ? `?${params.toString()}` : '')) as '/', { scroll: false });
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
  const districtOptions = ISRAEL_DISTRICTS.map((d) => ({
    value: d.id,
    label: locale === 'he' ? d.nameHe : locale === 'ar' ? d.nameAr : locale === 'ru' ? d.nameRu : d.nameEn,
  }));

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
            dir={dir}
          />

          <div className="h-5 w-px shrink-0 bg-border" />

          {/* Specialisation — multi */}
          <FilterMultiSelect
            values={currentSpecialisations}
            onChange={(v) => setMultiParam('specialisation', v)}
            placeholder={t('filters.specialisation')}
            options={specialisationOptions}
            disabled={isPending}
            dir={dir}
          />

          {/* Insurance — multi */}
          <FilterMultiSelect
            values={currentInsurances}
            onChange={(v) => setMultiParam('insurance', v)}
            placeholder={t('filters.insurance')}
            options={insuranceOptions}
            disabled={isPending}
            dir={dir}
          />

          {/* Session type — multi */}
          <FilterMultiSelect
            values={currentSessionTypes}
            onChange={(v) => setMultiParam('sessionType', v)}
            placeholder={t('filters.sessionType')}
            options={sessionTypeOptions}
            disabled={isPending}
            dir={dir}
          />

          {/* Language — multi */}
          <FilterMultiSelect
            values={currentLanguages}
            onChange={(v) => setMultiParam('language', v)}
            placeholder={t('filters.language')}
            options={languageOptions}
            disabled={isPending}
            dir={dir}
          />

          {/* District — single */}
          <FilterSelect
            value={currentDistrict}
            onChange={(v) => setParam('district', v || null)}
            placeholder={t('filters.district')}
            options={districtOptions}
            active={!!currentDistrict}
            disabled={isPending}
            dir={dir}
          />

          <div className="h-5 w-px shrink-0 bg-border" />

          {/* Accepting patients toggle */}
          <button
            type="button"
            onClick={() => setParam('acceptingOnly', currentAcceptingOnly ? null : 'true')}
            disabled={isPending}
            className={cn(
              'flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm transition-colors',
              currentAcceptingOnly
                ? 'bg-primary-light font-medium text-primary'
                : 'bg-bg-alt text-text-secondary hover:bg-border/70 hover:text-text-primary',
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
              className="ms-auto flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-bg-alt px-3 text-sm text-text-secondary transition-colors hover:bg-border/70 hover:text-primary"
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
