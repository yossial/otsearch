'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import TherapistCard from '@/components/search/TherapistCard';
import type { TherapistProfilePublic, SearchResult } from '@/types';

const PREVIEW_ROWS = 2;
const PREVIEW_COLS = 5;
const PREVIEW_MAX = PREVIEW_ROWS * PREVIEW_COLS;

interface Props {
  initialProfiles: TherapistProfilePublic[];
  initialTotal: number;
  initialPage: number;
  totalPages: number;
  searchParamsStr: string;
  previewMode?: boolean;
}

export default function TherapistGrid({
  initialProfiles,
  initialTotal,
  initialPage,
  totalPages,
  searchParamsStr,
  previewMode = false,
}: Props) {
  const t = useTranslations('search');
  const [profiles, setProfiles] = useState(initialProfiles);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [loading, setLoading] = useState(false);
  const [exhausted, setExhausted] = useState(initialPage >= totalPages);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const prevSearchParamsRef = useRef(searchParamsStr);

  // Sync state when search/filter changes without remounting (avoids blank-screen flash).
  // Only searchParamsStr triggers the reset — the other props are read at effect-run time
  // (same RSC render), so they're always current without needing to be dependencies.
  useEffect(() => {
    if (prevSearchParamsRef.current === searchParamsStr) return;
    prevSearchParamsRef.current = searchParamsStr;
    setProfiles(initialProfiles);
    setCurrentPage(initialPage);
    setExhausted(initialPage >= totalPages);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsStr]);

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
        <p className="text-base font-normal text-text-secondary">{t('noResults')}</p>
      </div>
    );
  }

  const displayProfiles = previewMode ? profiles.slice(0, PREVIEW_MAX) : profiles;

  return (
    <div>
      <p className="mb-4 text-sm text-text-secondary">
        {t('results', { count: initialTotal })}
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {displayProfiles.map((therapist) => (
          <TherapistCard key={therapist.id} therapist={therapist} />
        ))}
      </div>

      {previewMode ? (
        <div className="mt-8 flex justify-center">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-primary px-8 py-3 text-sm font-normal text-primary transition-colors hover:bg-primary hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            {t('viewAllTherapists')}
          </Link>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
