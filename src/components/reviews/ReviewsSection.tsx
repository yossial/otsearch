import { getTranslations } from 'next-intl/server';
import { getOTReviews } from '@/lib/db/ots';
import ReviewCard from './ReviewCard';
import ReviewForm from './ReviewForm';

interface Props {
  slug: string;
  sessionUserId: string | null;
  userRole: string | null;
}

export default async function ReviewsSection({ slug, sessionUserId, userRole }: Props) {
  const t = await getTranslations('reviews');
  const result = await getOTReviews(slug).catch(() => null);

  const canSubmit = !!sessionUserId && userRole !== 'ot';
  const hasReviews = !!result && result.total > 0;

  // Hide section entirely if nothing to show
  if (!hasReviews && !canSubmit) return null;

  const locale = 'en'; // server-side locale for date formatting

  return (
    <section id="reviews" className="rounded-lg bg-surface p-6 shadow-card">
      <h2 className="mb-4 text-lg font-semibold text-text-primary">
        {result && result.total > 0
          ? t('titleWithCount', { count: result.total })
          : t('title')}
      </h2>

      {hasReviews ? (
        <div className="mb-6 flex flex-col gap-3">
          {result!.reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              formattedDate={new Date(review.createdAt).toLocaleDateString(locale, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
          ))}
        </div>
      ) : (
        <p className="mb-6 text-sm text-text-muted">{t('noReviews')}</p>
      )}

      {sessionUserId && (
        <div className="border-t border-border pt-4">
          <h3 className="mb-3 text-sm font-semibold text-text-primary">{t('formTitle')}</h3>
          <ReviewForm slug={slug} isLoggedIn={!!sessionUserId} userRole={userRole} />
        </div>
      )}
      {!sessionUserId && (
        <div className="border-t border-border pt-4">
          <ReviewForm slug={slug} isLoggedIn={false} userRole={null} />
        </div>
      )}
    </section>
  );
}
