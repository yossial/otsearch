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

export default function SearchBar({ initialQuery = '', size = 'default', onDark = false }: SearchBarProps) {
  const t = useTranslations('home');
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function submit(q: string) {
    setShowSuggestions(false);
    const params = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : '';
    router.push(`/${params}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    submit(query);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!showSuggestions || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveIndex(-1);
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      const s = suggestions[activeIndex];
      setQuery(s.label);
      submit(s.label);
    }
  }

  function selectSuggestion(s: Suggestion) {
    setQuery(s.label);
    submit(s.label);
  }

  const SuggestionDropdown = showSuggestions && suggestions.length > 0 ? (
    <ul
      role="listbox"
      className="absolute start-0 end-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-border bg-surface shadow-dropdown"
    >
      {suggestions.map((s, i) => (
        <li
          key={`${s.type}-${s.value}`}
          role="option"
          aria-selected={i === activeIndex}
          onMouseDown={(e) => { e.preventDefault(); selectSuggestion(s); }}
          className={`flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
            i === activeIndex ? 'bg-primary-light text-primary' : 'text-text-primary hover:bg-bg-alt'
          }`}
        >
          <span className="text-xs text-text-muted w-16 shrink-0 capitalize">{s.type}</span>
          <span>{s.label}</span>
        </li>
      ))}
    </ul>
  ) : null;

  if (size === 'hero') {
    const shadow = onDark
      ? 'shadow-[0_8px_48px_rgba(0,0,0,0.5)]'
      : 'shadow-[0_4px_32px_rgba(42,127,98,0.14)] ring-1 ring-primary/10 focus-within:shadow-[0_4px_40px_rgba(42,127,98,0.22)] focus-within:ring-primary/20';

    return (
      <div ref={containerRef} className="relative w-full">
        <form
          onSubmit={handleSubmit}
          className={`flex w-full items-center overflow-hidden rounded-2xl bg-surface transition-[box-shadow] duration-200 ${shadow}`}
        >
          <div className="flex flex-1 items-center gap-3 ps-5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="shrink-0 text-text-muted"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); setActiveIndex(-1); }}
              onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
              onKeyDown={handleKeyDown}
              placeholder={t('searchPlaceholder')}
              autoComplete="off"
              className="flex-1 border-0 bg-transparent py-5 text-base text-text-primary outline-none ring-0 placeholder:text-text-muted focus:border-0 focus:outline-none focus:ring-0"
            />
          </div>
          <div className="p-2">
            <button
              type="submit"
              className="rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary-dark"
            >
              {t('searchButton')}
            </button>
          </div>
        </form>
        {SuggestionDropdown}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className="flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-[border-color,box-shadow] duration-150 focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(42,127,98,0.15),0_2px_8px_rgba(0,0,0,0.06)]"
      >
        <input
          type="search"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); setActiveIndex(-1); }}
          onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
          onKeyDown={handleKeyDown}
          placeholder={t('searchPlaceholder')}
          autoComplete="off"
          className="flex-1 border-0 bg-transparent text-base text-text-primary outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 placeholder:text-text-muted"
        />
        <button
          type="submit"
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          {t('searchButton')}
        </button>
      </form>
      {SuggestionDropdown}
    </div>
  );
}
