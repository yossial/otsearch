'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import TherapistCard from '@/components/search/TherapistCard';
import type { TherapistProfilePublic, SearchResult } from '@/types';

interface Props {
  initialProfiles: TherapistProfilePublic[];
  initialTotal: number;
  initialPage: number;
  totalPages: number;
  searchParamsStr: string;
}

export default function TherapistGrid({
  initialProfiles,
  initialTotal,
  initialPage,
  totalPages,
  searchParamsStr,
}: Props) {
  const t = useTranslations('search');
  const [profiles, setProfiles] = useState(initialProfiles);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(initialPage >= totalPages);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Keep a ref to the latest fetchMore to avoid stale closure in IntersectionObserver
  const fetchMoreRef = useRef<() => void>(() => {});

  const fetchMore = useCallback(async () => {
    if (loading || exhausted) return;
    setLoading(true);
    try {
      const nextPage = currentPage + 1;
      const qs = searchParamsStr
        ? `${searchParamsStr}&page=${nextPage}`
        : `page=${nextPage}`;
      const res = await fetch(`/api/therapists?${qs}`);
      if (!res.ok) return;
      const data: SearchResult = await res.json();
      setProfiles((prev) => [...prev, ...data.profiles]);
      setCurrentPage(nextPage);
      if (nextPage >= data.totalPages) setExhausted(true);
    } catch {
      // silently ignore network errors
    } finally {
      setLoading(false);
    }
  }, [loading, exhausted, currentPage, searchParamsStr]);

  useEffect(() => {
    fetchMoreRef.current = fetchMore;
  }, [fetchMore]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchMoreRef.current();
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []); // intentionally empty — observer is set up once, uses ref for latest fetchMore

  if (profiles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface py-20 text-center">
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
        <p className="text-base font-medium text-text-secondary">{t('noResults')}</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-4 text-sm text-text-secondary">
        {t('results', { count: initialTotal })}
      </p>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((therapist) => (
          <TherapistCard key={therapist.id} therapist={therapist} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-24" aria-hidden="true" />

      {loading && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-text-secondary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="animate-spin"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          {t('loadingMore')}
        </div>
      )}

      {exhausted && profiles.length > 0 && (
        <p className="py-6 text-center text-sm text-text-muted">{t('noMoreResults')}</p>
      )}
    </div>
  );
}
