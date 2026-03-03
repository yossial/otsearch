'use client';

import Image from 'next/image';
import { useRouter, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import type { TherapistProfilePublic } from '@/types';
import { cn } from '@/lib/utils';
import StarDisplay from '@/components/reviews/StarDisplay';

export default function TherapistCard({ therapist }: { therapist: TherapistProfilePublic }) {
  const ot = therapist;
  const t = useTranslations('search');
  const locale = useLocale();
  const router = useRouter();

  const name =
    ot.displayName[locale as keyof typeof ot.displayName] ?? ot.displayName.he;

  const isPremium = ot.subscriptionTier === 'premium';

  const titleKey =
    ot.gender === 'male'
      ? 'therapistTitleMale'
      : ot.gender === 'female'
        ? 'therapistTitleFemale'
        : 'therapistTitle';

  const acceptingKey =
    ot.gender === 'male'
      ? 'acceptingPatientsMale'
      : ot.gender === 'female'
        ? 'acceptingPatientsFemale'
        : 'acceptingPatientsFilter';

  const extraSpecCount = ot.specialisations.length - 2;

  return (
    <article
      onClick={() => router.push(`/therapist/${ot.slug}`)}
      className="group flex cursor-pointer flex-col gap-4 rounded-2xl bg-surface p-4 shadow-card transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
    >
      {/* Header: round avatar + name + badges */}
      <div className="flex items-start gap-3">
        <div className="relative flex-shrink-0">
          <Image
            src={ot.photo ?? `https://i.pravatar.cc/150?u=${ot.slug}`}
            alt={name}
            width={64}
            height={64}
            className="h-16 w-16 rounded-full object-cover ring-2 ring-primary-light"
          />
          {isPremium && (
            <span className="absolute -end-1 -top-1 rounded-full bg-amber-400 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white shadow-sm">
              PRO
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate text-base font-bold text-text-primary">{name}</h3>
          <p className="text-xs text-text-secondary">{t(titleKey)}</p>

          {ot.isAcceptingPatients && (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              {t(acceptingKey)}
            </span>
          )}
        </div>
      </div>

      {/* Star rating */}
      {ot.ratingCount > 0 && (
        <div className="flex items-center gap-1.5">
          <StarDisplay rating={ot.ratingAvg} size="sm" />
          <span className="text-sm font-medium text-text-primary">{ot.ratingAvg.toFixed(1)}</span>
          <span className="text-xs text-text-muted">({ot.ratingCount})</span>
        </div>
      )}

      {/* City */}
      <div className="flex items-center gap-1 text-sm text-text-secondary">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="13"
          height="13"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0"
          aria-hidden="true"
        >
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <span>{ot.location.city}</span>
      </div>

      {/* Specialisation chips — max 2, then "+N more" */}
      <div className="flex flex-wrap gap-1.5">
        {ot.specialisations.slice(0, 2).map((spec) => (
          <span
            key={spec}
            className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary"
          >
            {t(`specialisationLabels.${spec}`)}
          </span>
        ))}
        {extraSpecCount > 0 && (
          <span className="rounded-full bg-bg-alt px-2.5 py-0.5 text-xs font-medium text-text-secondary">
            +{extraSpecCount}
          </span>
        )}
      </div>

      {/* Fee */}
      <div className={cn(!ot.feeRange && 'text-xs text-text-muted')}>
        {ot.feeRange ? (
          <div className="flex items-baseline gap-0.5">
            <span className="text-base font-semibold text-text-primary">
              ₪{ot.feeRange.min}–{ot.feeRange.max}
            </span>
            <span className="text-xs text-text-muted"> / {t('feePerSession')}</span>
          </div>
        ) : (
          t('noFeeInfo')
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
        <Link
          href={`/therapist/${ot.slug}`}
          className="flex w-full items-center justify-center rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          {t('viewProfile')}
        </Link>
        <Link
          href={`/therapist/${ot.slug}/contact`}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-border py-2 text-sm font-medium text-text-secondary transition-colors hover:border-primary/50 hover:text-primary"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect width="20" height="16" x="2" y="4" rx="2" />
            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
          </svg>
          {t('messageButton')}
        </Link>
      </div>
    </article>
  );
}
