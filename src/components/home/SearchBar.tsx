'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

interface Suggestion {
  type: 'therapist' | 'city' | 'specialisation';
  label: string;
  value: string;
}

interface SearchBarProps {
  initialQuery?: string;
  size?: 'default' | 'hero';
  onDark?: boolean;
}

const TYPE_ICONS: Record<Suggestion['type'], React.ReactNode> = {
  therapist: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  city: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  specialisation: (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"/>
    </svg>
  ),
};

const POPULAR_SEARCHES = [
  { label: 'Child Development', query: 'paediatrics' },
  { label: 'Hand Rehabilitation', query: 'hand-therapy' },
  { label: 'Neurological Rehab', query: 'neurological' },
  { label: 'Mental Health', query: 'mental-health' },
];

export default function SearchBar({ initialQuery = '', size = 'default', onDark = false }: SearchBarProps) {
  const t = useTranslations('home');
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isNavigating, setIsNavigating] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch autocomplete suggestions
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json() as { suggestions: Suggestion[] };
        setSuggestions(data.suggestions);
      }
    } catch {
      setSuggestions([]);
    }
  }, []);

  // Debounced suggestion fetch (300ms)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => void fetchSuggestions(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, fetchSuggestions]);

  // Debounced live search navigation (500ms) — navigate on keydown
  useEffect(() => {
    if (navDebounceRef.current) clearTimeout(navDebounceRef.current);
    navDebounceRef.current = setTimeout(() => {
      // Only auto-navigate if focused (user is actively typing)
      if (!isFocused) return;
      const trimmed = query.trim();
      // Navigate to filtered results (or clear query if empty)
      const params = trimmed.length >= 2 ? `?q=${encodeURIComponent(trimmed)}` : '';
      setIsNavigating(true);
      router.push(`/${params}`);
      setTimeout(() => setIsNavigating(false), 600);
    }, 500);
    return () => { if (navDebounceRef.current) clearTimeout(navDebounceRef.current); };
  }, [query, isFocused, router]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setIsFocused(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function navigate(q: string) {
    setShowDropdown(false);
    setIsFocused(false);
    const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
    router.push(`/${params}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (navDebounceRef.current) clearTimeout(navDebounceRef.current);
    navigate(query);
  }

  function handleChange(value: string) {
    setQuery(value);
    setActiveIndex(-1);
    setShowDropdown(true);
    // If cleared, navigate immediately back to all results
    if (value === '') {
      if (navDebounceRef.current) clearTimeout(navDebounceRef.current);
      navigate('');
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setShowDropdown(false);
      setActiveIndex(-1);
      return;
    }
    if (!showDropdown || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const s = suggestions[activeIndex];
      if (navDebounceRef.current) clearTimeout(navDebounceRef.current);
      setQuery(s.label);
      navigate(s.label);
    }
  }

  function selectSuggestion(s: Suggestion) {
    if (navDebounceRef.current) clearTimeout(navDebounceRef.current);
    setQuery(s.label);
    navigate(s.label);
  }

  const showPopular = isFocused && query.trim().length === 0;
  const showSuggestions = showDropdown && suggestions.length > 0 && query.trim().length >= 2;

  const Dropdown = (showSuggestions || showPopular) ? (
    <div
      role="listbox"
      className="absolute start-0 end-0 top-full z-50 mt-1.5 overflow-hidden rounded-xl border border-border bg-surface shadow-dropdown"
    >
      {showPopular && (
        <>
          <div className="px-4 pb-1 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">Popular searches</p>
          </div>
          <ul>
            {POPULAR_SEARCHES.map((ps) => (
              <li key={ps.query}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); setQuery(ps.label); navigate(ps.label); }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-text-primary transition-colors hover:bg-bg-alt"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary">
                    {TYPE_ICONS.specialisation}
                  </span>
                  {ps.label}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {showSuggestions && (
        <ul>
          {suggestions.map((s, i) => (
            <li key={`${s.type}-${s.value}`}>
              <button
                type="button"
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
                className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  i === activeIndex
                    ? 'bg-primary-light text-primary'
                    : 'text-text-primary hover:bg-bg-alt'
                }`}
              >
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                  i === activeIndex ? 'bg-primary text-white' : 'bg-bg-alt text-text-muted'
                }`}>
                  {TYPE_ICONS[s.type]}
                </span>
                <span className="flex-1 text-start">{s.label}</span>
                <span className="text-xs capitalize text-text-muted">{s.type}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  ) : null;

  // ── Hero variant ────────────────────────────────────────────────────────────
  if (size === 'hero') {
    const ringClass = onDark
      ? 'shadow-[0_8px_48px_rgba(0,0,0,0.5)]'
      : 'border border-border shadow-sm focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(255,195,0,0.15)]';

    return (
      <div ref={containerRef} className="relative w-full">
        <form
          onSubmit={handleSubmit}
          className={`flex w-full items-center overflow-hidden rounded-xl bg-surface transition-all duration-150 ${ringClass}`}
        >
          <div className="flex flex-1 items-center gap-3 ps-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-text-muted"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onFocus={() => { setIsFocused(true); setShowDropdown(true); }}
              onKeyDown={handleKeyDown}
              placeholder={t('searchPlaceholder')}
              autoComplete="off"
              aria-label={t('searchPlaceholder')}
              className="flex-1 border-0 bg-transparent py-4 text-base text-text-primary outline-none ring-0 placeholder:text-text-muted focus:border-0 focus:outline-none focus:ring-0"
            />
            {/* Clear button */}
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => { setQuery(''); navigate(''); inputRef.current?.focus(); }}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg-alt text-text-muted transition-colors hover:bg-border hover:text-text-primary"
                aria-label="Clear search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>
          <div className="p-1.5">
            <button
              type="submit"
              className={`rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-text-accent transition-all hover:bg-primary/90 ${isNavigating ? 'opacity-70' : ''}`}
            >
              {isNavigating ? (
                <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : t('searchButton')}
            </button>
          </div>
        </form>
        {Dropdown}
      </div>
    );
  }

  // ── Default (sticky bar) variant ────────────────────────────────────────────
  return (
    <div ref={containerRef} className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 transition-[border-color,box-shadow] duration-150 focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(255,195,0,0.15)]"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-muted" aria-hidden="true">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref={inputRef}
          type="search"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { setIsFocused(true); setShowDropdown(true); }}
          onKeyDown={handleKeyDown}
          placeholder={t('searchPlaceholder')}
          autoComplete="off"
          className="flex-1 border-0 bg-transparent text-sm text-text-primary outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 placeholder:text-text-muted"
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => { setQuery(''); navigate(''); inputRef.current?.focus(); }}
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-bg-alt text-text-muted transition-colors hover:bg-border"
            aria-label="Clear search"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-1.5 text-sm font-semibold text-text-accent transition-colors hover:bg-primary/90"
        >
          {t('searchButton')}
        </button>
      </form>
      {Dropdown}
    </div>
  );
}
