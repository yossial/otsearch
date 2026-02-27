'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function SearchBar() {
  const t = useTranslations('home');
  const router = useRouter();
  const [query, setQuery] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : '';
    router.push(`/search${params}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 shadow-[0_2px_8px_rgba(91,63,212,0.08)]"
    >
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('searchPlaceholder')}
        className="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-muted"
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
