'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

interface SearchBarProps {
  initialQuery?: string;
  size?: 'default' | 'hero';
  onDark?: boolean;
}

export default function SearchBar({ initialQuery = '', size = 'default', onDark = false }: SearchBarProps) {
  const t = useTranslations('home');
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : '';
    router.push(`/${params}`);
  }

  if (size === 'hero') {
    const shadow = onDark
      ? 'shadow-[0_8px_48px_rgba(0,0,0,0.5)]'
      : 'shadow-[0_4px_32px_rgba(245,119,153,0.14)] ring-1 ring-primary/10 focus-within:shadow-[0_4px_40px_rgba(245,119,153,0.22)] focus-within:ring-primary/20';

    return (
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
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
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
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] transition-[border-color,box-shadow] duration-150 focus-within:border-primary focus-within:shadow-[0_0_0_3px_rgba(245,119,153,0.12),0_2px_8px_rgba(0,0,0,0.06)]"
    >
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('searchPlaceholder')}
        className="flex-1 border-0 bg-transparent text-base text-text-primary outline-none ring-0 focus:border-0 focus:outline-none focus:ring-0 placeholder:text-text-muted"
      />
      <button
        type="submit"
        className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
      >
        {t('searchButton')}
      </button>
    </form>
  );
}
