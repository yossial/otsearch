import type { ReviewPublic } from '@/types';
import StarDisplay from './StarDisplay';

interface Props {
  review: ReviewPublic;
  formattedDate: string;
}

export default function ReviewCard({ review, formattedDate }: Props) {
  return (
    <div className="rounded-lg border border-border bg-bg p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">{review.reviewerName}</span>
          <StarDisplay rating={review.rating} size="sm" />
        </div>
        <span className="text-xs text-text-muted">{formattedDate}</span>
      </div>
      <p className="text-sm leading-relaxed text-text-secondary">{review.text}</p>
    </div>
  );
}
