'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

interface SearchBarProps {
  initialQuery?: string;
  size?: 'default' | 'hero';
  onDark?: boolean;
}

// Terms for instant inline autocomplete — no network round-trip
const AUTOCOMPLETE_TERMS = [
  'Child Development',
  'Hand Rehabilitation',
  'Neurological Rehab',
  'Emotional Regulation',
  'Sensory Processing',
  'Geriatrics',
  'Ergonomics',
  'Vocational Rehab',
  'התפתחות הילד',
  'שיקום כף יד',
  'שיקום נוירולוגי',
  'ויסות רגשי',
  'עיבוד חושי',
  'גריאטריה',
  'ארגונומיה',
];

function getInlineSuggestion(q: string): string {
  if (q.trim().length < 2) return '';
  const lower = q.toLowerCase();
  return (
    AUTOCOMPLETE_TERMS.find(
      (term) => term.toLowerCase().startsWith(lower) && term.toLowerCase() !== lower
    ) ?? ''
  );
}

export default function SearchBar({ initialQuery = '', size = 'default', onDark = false }: SearchBarProps) {
  const t = useTranslations('home');
  const router = useRouter();
  const pathname = usePathname();
  const basePath = pathname.startsWith('/search') ? '/search' : '/';
  const [query, setQuery] = useState(initialQuery);
  const [inlineSuggestion, setInlineSuggestion] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const navDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced server navigation (500 ms)
  useEffect(() => {
    if (navDebounceRef.current) clearTimeout(navDebounceRef.current);
    navDebounceRef.current = setTimeout(() => {
      if (!isFocused) return;
      const trimmed = query.trim();
      const params = trimmed.length >= 2 ? `?q=${encodeURIComponent(trimmed)}` : '';
      setIsNavigating(true);
      router.push(`${basePath}${params}`, { scroll: false });
      setTimeout(() => setIsNavigating(false), 600);
    }, 500);
    return () => { if (navDebounceRef.current) clearTimeout(navDebounceRef.current); };
  }, [query, isFocused, router, basePath]);

  function applyClientFilter(q: string) {
    const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-therapist-name]'));
    const lower = q.toLowerCase().trim();
    // Mirror the 2-char minimum used by the debounce — avoids hiding cards on single keystrokes
    if (lower.length < 2) {
      cards.forEach((card) => { card.style.display = ''; });
      return;
    }
    const matches = (card: HTMLElement) => {
      const name = (card.dataset.therapistName ?? '').toLowerCase();
      const city = (card.dataset.therapistCity ?? '').toLowerCase();
      const specs = (card.dataset.therapistSpecs ?? '').toLowerCase();
      return name.includes(lower) || city.includes(lower) || specs.includes(lower);
    };
    // Only hide cards if at least one matches — prevents blank flash while server result loads
    if (!cards.some(matches)) return;
    cards.forEach((card) => { card.style.display = matches(card) ? '' : 'none'; });
  }

  function navigate(q: string) {
    const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
    router.push(`${basePath}${params}`, { scroll: false });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (navDebounceRef.current) clearTimeout(navDebounceRef.current);
    navigate(query);
  }

  function handleChange(value: string) {
    setQuery(value);
    setInlineSuggestion(getInlineSuggestion(value));
    applyClientFilter(value);
    // Debounce handles navigation for all cases including clearing
  }

  function acceptSuggestion() {
    if (!inlineSuggestion) return;
    if (navDebounceRef.current) clearTimeout(navDebounceRef.current);
    setQuery(inlineSuggestion);
    setInlineSuggestion('');
    applyClientFilter(inlineSuggestion);
    navigate(inlineSuggestion);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!inlineSuggestion) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      acceptSuggestion();
    } else if (e.key === 'ArrowRight' && inputRef.current?.selectionStart === query.length) {
      e.preventDefault();
      acceptSuggestion();
    } else if (e.key === 'Escape') {
      setInlineSuggestion('');
    }
  }

  function handleClear() {
    setQuery('');
    navigate('');
    applyClientFilter('');
    inputRef.current?.focus();
  }

  // The greyed-out completion that extends past the cursor
  const ghostRemainder =
    inlineSuggestion && inlineSuggestion.toLowerCase().startsWith(query.toLowerCase())
      ? inlineSuggestion.slice(query.length)
      : '';

  // ── Hero variant ─────────────────────────────────────────────────────────────
  if (size === 'hero') {
    const wrapClass = onDark
      ? 'shadow-[0_8px_48px_rgba(0,0,0,0.5)]'
      : 'border border-border/60 shadow-md focus-within:border-primary/30 focus-within:shadow-[0_4px_28px_rgba(0,0,128,0.10)]';

    return (
      <form
        onSubmit={handleSubmit}
        className={`flex w-full items-center gap-2 overflow-hidden rounded-full bg-surface ps-5 pe-2 transition-all duration-200 ${wrapClass}`}
      >
        {/* Search / spinner icon — leading */}
        {isNavigating ? (
          <svg className="h-[18px] w-[18px] shrink-0 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-muted" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        )}

        {/* Input + ghost overlay */}
        <div className="relative flex-1 overflow-hidden">
          {ghostRemainder && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-nowrap text-base"
            >
              <span style={{ visibility: 'hidden' }}>{query}</span>
              <span className="text-text-muted/55">{ghostRemainder}</span>
            </div>
          )}
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => { setIsFocused(true); setInlineSuggestion(getInlineSuggestion(query)); }}
            onBlur={() => { setIsFocused(false); setInlineSuggestion(''); }}
            onKeyDown={handleKeyDown}
            placeholder={t('searchPlaceholder')}
            autoComplete="off"
            aria-label={t('searchPlaceholder')}
            className="w-full border-0 bg-transparent py-4 text-base text-text-primary outline-none ring-0 placeholder:text-text-muted focus:border-0 focus:outline-none focus:ring-0"
          />
        </div>

        {/* Tab hint (shows while ghost is visible) */}
        {ghostRemainder && (
          <span className="shrink-0 rounded border border-border px-1.5 py-0.5 text-[10px] font-normal leading-none text-text-muted">
            Tab
          </span>
        )}

        {/* Clear button (shows when text entered, no ghost showing) */}
        {query.length > 0 && !ghostRemainder && (
          <button
            type="button"
            onClick={handleClear}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-bg-alt text-text-muted transition-colors hover:bg-border hover:text-text-primary"
            aria-label="Clear search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* Submit button — gold pill, trailing */}
        <button
          type="submit"
          className="my-2 shrink-0 rounded-full bg-accent px-5 py-2.5 text-sm font-normal text-text-accent transition-all duration-200 hover:bg-accent-dark hover:shadow-sm"
          aria-label={t('searchPlaceholder')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
        </button>
      </form>
    );
  }

  // ── Default (compact / sticky-bar) variant ──────────────────────────────────
  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 transition-[border-color,box-shadow] duration-150 focus-within:border-primary focus-within:shadow-focus"
    >
      {isNavigating ? (
        <svg className="h-4 w-4 shrink-0 animate-spin text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-muted" aria-hidden="true">
          <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
        </svg>
      )}

      <div className="relative flex-1 overflow-hidden">
        {ghostRemainder && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex items-center overflow-hidden whitespace-nowrap text-sm"
          >
            <span style={{ visibility: 'hidden' }}>{query}</span>
            <span className="text-text-muted/55">{ghostRemainder}</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { setIsFocused(true); setInlineSuggestion(getInlineSuggestion(query)); }}
          onBlur={() => { setIsFocused(false); setInlineSuggestion(''); }}
          onKeyDown={handleKeyDown}
          placeholder={t('searchPlaceholder')}
          autoComplete="off"
          className="w-full border-0 bg-transparent text-sm text-text-primary outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 placeholder:text-text-muted"
        />
      </div>

      {ghostRemainder && (
        <span className="shrink-0 rounded border border-border px-1 py-0.5 text-[10px] font-normal leading-none text-text-muted">
          Tab
        </span>
      )}

      {query.length > 0 && !ghostRemainder && (
        <button
          type="button"
          onClick={handleClear}
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bg-alt text-text-muted transition-colors hover:bg-border hover:text-text-primary"
          aria-label="Clear search"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </form>
  );
}
