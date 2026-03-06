'use client';

import Image from 'next/image';
import { useRouter, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import type { TherapistProfilePublic } from '@/types';
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
      className="group flex cursor-pointer flex-col rounded-xl border border-border bg-surface transition-[border-color,box-shadow] duration-200 hover:border-primary/30 hover:shadow-card-hover"
    >
      {/* PRO strip */}
      {isPremium && (
        <div className="flex justify-end px-4 pt-2.5">
          <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold leading-none text-text-inverse">
            {t('featuredLabel')}
          </span>
        </div>
      )}

      {/* Avatar + identity */}
      <div className={`flex items-start gap-3.5 px-4 ${isPremium ? 'pt-1.5' : 'pt-4'} pb-3`}>
        <Image
          src={ot.photo ?? `https://i.pravatar.cc/150?u=${ot.slug}`}
          alt={name}
          width={64}
          height={64}
          className="h-16 w-16 flex-shrink-0 rounded-full object-cover ring-2 ring-primary-light"
        />
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="truncate text-base font-bold text-text-primary">{name}</h3>
          <p className="mt-0.5 text-xs text-text-secondary">{t(titleKey)}</p>

          {ot.ratingCount > 0 && (
            <div className="mt-1.5 flex items-center gap-1">
              <StarDisplay rating={ot.ratingAvg} size="sm" />
              <span className="text-xs font-semibold text-text-primary">{ot.ratingAvg.toFixed(1)}</span>
              <span className="text-xs text-text-muted">({ot.ratingCount})</span>
            </div>
          )}

          <div className="mt-1.5 flex items-center gap-1 text-xs text-text-secondary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="11"
              height="11"
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
        </div>
      </div>

      <div className="mx-4 h-px bg-border" />

      {/* Specialisation chips */}
      <div className="flex flex-wrap gap-1.5 px-4 py-3">
        {ot.specialisations.slice(0, 2).map((spec) => (
          <span
            key={spec}
            className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary"
          >
            {t(`specialisationLabels.${spec}`)}
          </span>
        ))}
        {extraSpecCount > 0 && (
          <span className="rounded-full bg-bg-alt px-2.5 py-0.5 text-xs font-medium text-text-muted">
            +{extraSpecCount}
          </span>
        )}
        {ot.specialisations.length === 0 && (
          <span className="text-xs text-text-muted">—</span>
        )}
      </div>

      <div className="mx-4 h-px bg-border" />

      {/* Fee + accepting row */}
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="min-w-0">
          {ot.feeRange && ot.feeRange.min > 0 && ot.feeRange.max >= ot.feeRange.min ? (
            <span className="text-sm font-semibold text-text-primary">
              ₪{ot.feeRange.min}–{ot.feeRange.max}
              <span className="ms-0.5 text-xs font-normal text-text-muted"> / {t('feePerSession')}</span>
            </span>
          ) : ot.feeRange && ot.feeRange.min > 0 ? (
            <span className="text-sm font-semibold text-text-primary">
              {t('feeFrom', { min: ot.feeRange.min })}
            </span>
          ) : (
            <span className="text-xs text-text-muted">{t('noFeeInfo')}</span>
          )}
        </div>
        {ot.isAcceptingPatients && (
          <span className="flex flex-shrink-0 items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden="true" />
            {t(acceptingKey)}
          </span>
        )}
      </div>

      {/* Actions */}
      <div
        className="flex gap-2 px-4 pb-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Link
          href={`/therapist/${ot.slug}`}
          className="flex flex-1 items-center justify-center rounded-lg bg-primary py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          {t('viewProfile')}
        </Link>
        <Link
          href={`/therapist/${ot.slug}#contact`}
          className="flex flex-1 items-center justify-center rounded-lg border border-border py-2 text-sm font-medium text-text-secondary transition-colors hover:border-primary/50 hover:text-primary"
        >
          {t('messageButton')}
        </Link>
      </div>
    </article>
  );
}
