'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

// Values must match the Specialisation enum in src/types/index.ts
const SPECIALTIES = [
  { value: 'paediatrics', label: 'ילדים ופיתוח' },
  { value: 'neurological', label: 'שיקום נוירולוגי' },
  { value: 'mental-health', label: 'בריאות הנפש' },
  { value: 'hand-therapy', label: 'טיפול ביד' },
  { value: 'geriatrics', label: 'גריאטריה' },
  { value: 'sensory-processing', label: 'עיבוד חושי' },
] as const;

// Values must match the InsuranceType enum in src/types/index.ts
const INSURANCE_OPTIONS = [
  { value: 'clalit', label: 'כללית' },
  { value: 'maccabi', label: 'מכבי' },
  { value: 'meuhedet', label: 'מאוחדת' },
  { value: 'leumit', label: 'לאומית' },
  { value: 'private', label: 'פרטי בלבד' },
] as const;

// Values must match the SessionType enum in src/types/index.ts
const SESSION_TYPE_OPTIONS = [
  { value: 'in-person', label: 'פרונטלי' },
  { value: 'telehealth', label: 'טלה-מדיסין' },
  { value: 'home-visit', label: 'ביקור בית' },
] as const;

const LANGUAGE_OPTIONS = [
  { value: 'he', label: 'עברית' },
  { value: 'ar', label: 'ערבית' },
  { value: 'en', label: 'אנגלית' },
  { value: 'ru', label: 'רוסית' },
] as const;

// Inline chevron — rotates 180° when section is expanded
function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        'flex-shrink-0 text-text-secondary transition-transform duration-200',
        open ? 'rotate-180' : 'rotate-0'
      )}
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

// Funnel icon for the mobile "Show filters" button
function FunnelIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  );
}

/**
 * Collapsible filter section.
 *
 * Uses the CSS grid trick (`grid-rows-[0fr]` ↔ `grid-rows-[1fr]`) for a
 * smooth height transition without needing to know the content height.
 * The inner wrapper must have `overflow-hidden` to clip the content
 * when the row is animating to zero height.
 */
function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `filter-${title.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-center justify-between py-0.5 text-start"
      >
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
          {title}
        </h3>
        <ChevronIcon open={open} />
      </button>

      {/* Grid trick: animates between grid-rows-[0fr] and grid-rows-[1fr] */}
      <div
        id={panelId}
        className={cn(
          'grid transition-[grid-template-rows] duration-200',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <div className="flex flex-col gap-2 pb-0.5 pt-2.5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function CheckboxItem({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2.5">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className={cn(
          'h-4 w-4 cursor-pointer appearance-none rounded border-2 border-border transition-colors',
          'checked:border-primary checked:bg-primary',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1'
        )}
      />
      <span className="text-sm text-text-primary">{label}</span>
    </label>
  );
}

export default function FilterSidebar() {
  const tSearch = useTranslations('search');

  // Routing — derive all filter state from URL so the sidebar stays in
  // sync with the address bar (back/forward navigation, shareable URLs).
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const selectedSpecialties = searchParams.getAll('specialisation');
  const selectedInsurance = searchParams.getAll('insurance');
  const selectedSessionTypes = searchParams.getAll('sessionType');
  const selectedLanguages = searchParams.getAll('language');
  const acceptingOnly = searchParams.get('acceptingOnly') === 'true';

  // Mobile: controls whether the entire panel is visible
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const activeFilterCount =
    selectedSpecialties.length +
    selectedInsurance.length +
    selectedSessionTypes.length +
    selectedLanguages.length +
    (acceptingOnly ? 1 : 0);

  const hasFilters = activeFilterCount > 0;

  /** Rebuild the URL with an updated multi-value param and navigate. */
  function updateFilter(param: string, values: string[]) {
    const next = new URLSearchParams(searchParams.toString());
    next.delete(param);
    values.forEach((v) => next.append(param, v));
    next.delete('page'); // reset pagination when filters change
    const qs = next.toString();
    router.replace(pathname + (qs ? `?${qs}` : ''));
  }

  function toggleItem(param: string, value: string, current: string[]) {
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(param, next);
  }

  function clearAll() {
    const next = new URLSearchParams(searchParams.toString());
    ['specialisation', 'insurance', 'sessionType', 'language', 'acceptingOnly', 'page'].forEach(
      (p) => next.delete(p)
    );
    const qs = next.toString();
    router.replace(pathname + (qs ? `?${qs}` : ''));
  }

  function toggleAcceptingOnly() {
    const next = new URLSearchParams(searchParams.toString());
    if (acceptingOnly) {
      next.delete('acceptingOnly');
    } else {
      next.set('acceptingOnly', 'true');
    }
    next.delete('page');
    const qs = next.toString();
    router.replace(pathname + (qs ? `?${qs}` : ''));
  }

  return (
    <div className="md:w-72 md:flex-shrink-0">
      {/* Mobile toggle button — only visible below md breakpoint */}
      <button
        type="button"
        onClick={() => setSidebarOpen((prev) => !prev)}
        aria-expanded={sidebarOpen}
        aria-controls="filter-sidebar-panel"
        className={cn(
          'md:hidden mb-3 flex w-full items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-bg',
          sidebarOpen && 'bg-bg border-primary/30'
        )}
      >
        <FunnelIcon />
        <span className="flex-1 text-start">
          {sidebarOpen ? tSearch('hideFilters') : tSearch('showFilters')}
        </span>
        {activeFilterCount > 0 && (
          <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold leading-none text-white">
            {activeFilterCount}
          </span>
        )}
      </button>

      {/* Filter panel — hidden on mobile until toggled, always visible on md+ */}
      <aside
        id="filter-sidebar-panel"
        className={cn(
          'flex flex-col gap-4 rounded-lg border border-border bg-surface p-5 shadow-card',
          // Desktop: always shown as sticky sidebar
          'md:flex md:sticky md:top-20',
          // Mobile: toggled
          sidebarOpen ? 'flex' : 'hidden'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-text-primary">
            {tSearch('sortBy')}
          </h2>
          {hasFilters && (
            <button
              type="button"
              onClick={clearAll}
              className="text-xs font-medium text-primary hover:underline"
            >
              {tSearch('clearFilters')}
            </button>
          )}
        </div>

        <div className="h-px bg-border" />

        {/* Specialisation */}
        <FilterSection title={tSearch('filters.specialisation')}>
          {SPECIALTIES.map((s) => (
            <CheckboxItem
              key={s.value}
              label={s.label}
              checked={selectedSpecialties.includes(s.value)}
              onChange={() =>
                toggleItem('specialisation', s.value, selectedSpecialties)
              }
            />
          ))}
        </FilterSection>

        <div className="h-px bg-border" />

        {/* Insurance */}
        <FilterSection title={tSearch('filters.insurance')}>
          {INSURANCE_OPTIONS.map((opt) => (
            <CheckboxItem
              key={opt.value}
              label={opt.label}
              checked={selectedInsurance.includes(opt.value)}
              onChange={() =>
                toggleItem('insurance', opt.value, selectedInsurance)
              }
            />
          ))}
        </FilterSection>

        <div className="h-px bg-border" />

        {/* Session type */}
        <FilterSection title={tSearch('filters.sessionType')}>
          {SESSION_TYPE_OPTIONS.map((opt) => (
            <CheckboxItem
              key={opt.value}
              label={opt.label}
              checked={selectedSessionTypes.includes(opt.value)}
              onChange={() =>
                toggleItem('sessionType', opt.value, selectedSessionTypes)
              }
            />
          ))}
        </FilterSection>

        <div className="h-px bg-border" />

        {/* Language */}
        <FilterSection title={tSearch('filters.language')}>
          {LANGUAGE_OPTIONS.map((opt) => (
            <CheckboxItem
              key={opt.value}
              label={opt.label}
              checked={selectedLanguages.includes(opt.value)}
              onChange={() =>
                toggleItem('language', opt.value, selectedLanguages)
              }
            />
          ))}
        </FilterSection>

        <div className="h-px bg-border" />

        {/* Accepting patients toggle */}
        <label className="flex cursor-pointer items-center justify-between gap-3">
          <span className="text-sm font-medium text-text-primary">
            {tSearch('acceptingPatientsFilter')}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={acceptingOnly}
            onClick={toggleAcceptingOnly}
            className={cn(
              'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
              acceptingOnly ? 'bg-primary' : 'bg-border'
            )}
          >
            <span
              className={cn(
                'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200',
                acceptingOnly ? 'translate-x-4' : 'translate-x-0'
              )}
            />
          </button>
        </label>
      </aside>
    </div>
  );
}
