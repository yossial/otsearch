'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface Props {
  slug: string;
  isLoggedIn: boolean;
  userRole: string | null;
}

export default function ReviewForm({ slug, isLoggedIn, userRole }: Props) {
  const t = useTranslations('reviews');
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error' | 'duplicate'>('idle');

  if (!isLoggedIn) {
    return (
      <p className="text-sm text-text-secondary">
        {t('loginPrompt')}{' '}
        <Link href="/auth/login" className="font-medium text-primary hover:underline">
          {t('loginLink')}
        </Link>
      </p>
    );
  }

  if (userRole === 'therapist') {
    return <p className="text-sm text-text-muted">{t('otCannotReview')}</p>;
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
        {t('submitSuccess')}
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) return;
    setStatus('loading');
    try {
      const res = await fetch(`/api/therapists/${slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, text }),
      });
      if (res.ok) {
        setStatus('success');
        router.refresh();
      } else if (res.status === 409) {
        setStatus('duplicate');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  }

  const starSize = 24;
  const activeRating = hovered || rating;

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-sm font-medium text-text-primary">{t('ratingLabel')}</p>
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => {
            const val = i + 1;
            return (
              <button
                key={i}
                type="button"
                onClick={() => setRating(val)}
                onMouseEnter={() => setHovered(val)}
                onMouseLeave={() => setHovered(0)}
                aria-label={`${val} stars`}
                className="transition-transform hover:scale-110"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width={starSize}
                  height={starSize}
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                  className={val <= activeRating ? 'text-amber-400' : 'text-gray-300'}
                >
                  <polygon
                    points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
                    fill={val <= activeRating ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            );
          })}
        </div>
        {rating === 0 && status !== 'idle' && (
          <p className="mt-1 text-xs text-red-500">{t('ratingRequired')}</p>
        )}
      </div>

      <div>
        <label htmlFor="review-text" className="mb-1.5 block text-sm font-medium text-text-primary">
          {t('textLabel')}
        </label>
        <textarea
          id="review-text"
          required
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('textPlaceholder')}
          minLength={20}
          maxLength={1000}
          className="w-full resize-none rounded-lg border border-border bg-bg px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
        />
        <p className="mt-1 text-right text-xs text-text-muted">{text.length}/1000</p>
      </div>

      {status === 'duplicate' && (
        <p className="rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-700">{t('alreadyReviewed')}</p>
      )}
      {status === 'error' && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{t('submitError')}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading' || rating === 0}
        className={cn(
          'flex w-full items-center justify-center rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60'
        )}
      >
        {status === 'loading' ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
