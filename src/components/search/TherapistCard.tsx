'use client';

import Image from 'next/image';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import type { TherapistProfilePublic } from '@/types';
import StarDisplay from '@/components/reviews/StarDisplay';
import { FEATURES } from '@/lib/config/features';

const MAX_TAGS = 3;

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

  const bio = ot.bio[locale as keyof typeof ot.bio] ?? ot.bio.he;

  const visibleSpecs = ot.specialisations.slice(0, MAX_TAGS);
  const extraSpecCount = ot.specialisations.length - MAX_TAGS;

  // Include both slugs and translated labels so client-side filter matches either
  const specSearchData = [
    ...ot.specialisations,
    ...ot.specialisations.map((s) => t(`specialisationLabels.${s}`)),
  ].join(' ');

  const feeLabel = FEATURES.showTherapistFee
    ? ot.feeRange && ot.feeRange.min > 0 && ot.feeRange.max >= ot.feeRange.min
      ? `₪${ot.feeRange.min}–${ot.feeRange.max}`
      : ot.feeRange && ot.feeRange.min > 0
        ? t('feeFrom', { min: ot.feeRange.min })
        : null
    : null;

  return (
    <article
      onClick={() => router.push(`/therapist/${ot.slug}`)}
      data-therapist-name={`${ot.displayName.he ?? ''} ${ot.displayName.en ?? ''} ${ot.displayName.ar ?? ''}`}
      data-therapist-city={ot.location?.city ?? ''}
      data-therapist-specs={specSearchData}
      className="group relative flex cursor-pointer flex-col rounded-[16px] bg-surface
                 shadow-[0_2px_16px_rgba(0,0,0,0.07)]
                 transition-[transform,box-shadow] duration-300 ease-spring
                 hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,0,0,0.13)]
                 active:translate-y-0 active:shadow-[0_2px_16px_rgba(0,0,0,0.07)]"
    >
      {/* Top row: accepting status (left) + fee (right) */}
      <div className="flex min-h-[1.75rem] items-center justify-between px-4 pt-3">
        {ot.isAcceptingPatients ? (
          <span className="rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-semibold leading-none text-success">
            {t('acceptingPatientsFilter')}
          </span>
        ) : (
          <span />
        )}
        {feeLabel && (
          <span className="text-sm font-semibold text-text-secondary">{feeLabel}</span>
        )}
      </div>

      {/* Avatar — centered */}
      <div className="mt-3 flex justify-center">
        <div className="relative">
          <Image
            src={ot.photo ?? `https://i.pravatar.cc/150?u=${ot.slug}`}
            alt={name}
            width={80}
            height={80}
            className="h-20 w-20 rounded-full object-cover ring-2 ring-primary-light"
          />
          {isPremium && (
            <span className="absolute -end-1 -top-1 flex items-center rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-bold leading-none text-text-accent">
              {t('featuredLabel')}
            </span>
          )}
        </div>
      </div>

      {/* Identity — centered */}
      <div className="mt-2 px-4 text-center">
        <h3 className="text-base font-bold leading-snug text-text-primary">{name}</h3>
        <p className="mt-0.5 text-xs text-text-muted">{t(titleKey)}</p>

        {/* City */}
        <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {ot.location.city}
        </p>

        {/* Rating (compact, only if has reviews and feature enabled) */}
        {FEATURES.showTherapistRating && ot.ratingCount > 0 && (
          <div className="mt-1 flex items-center justify-center gap-1">
            <StarDisplay rating={ot.ratingAvg} size="sm" />
            <span className="text-xs font-semibold text-text-primary">{ot.ratingAvg.toFixed(1)}</span>
            <span className="text-xs text-text-muted">({ot.ratingCount})</span>
          </div>
        )}
      </div>

      {/* Specialisation tags — wraps naturally, second row clipped vertically.
          Always rendered (even when empty) so bio/button sit at the same
          vertical position across all cards. */}
      <div className="mt-2 flex h-6 flex-wrap items-start justify-center gap-1.5 overflow-hidden px-3">
        {visibleSpecs.map((spec) => (
          <span
            key={spec}
            className="whitespace-nowrap rounded-full border border-border px-2.5 py-0.5 text-[11px] font-medium text-text-secondary"
          >
            {t(`specialisationLabels.${spec}`)}
          </span>
        ))}
        {extraSpecCount > 0 && (
          <span className="whitespace-nowrap rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-white">
            +{extraSpecCount}
          </span>
        )}
      </div>

      {/* Bio snippet — 1 line, always same height */}
      <p className="mt-1.5 line-clamp-2 px-4 text-center text-[11px] leading-relaxed text-text-muted">
        {bio ?? '\u00A0'}
      </p>

      {/* Spacer pushes button to bottom */}
      <div className="flex-1" />

      {/* View profile button */}
      <div className="px-4 pb-3 pt-2">
        <div className="border-t border-border pt-2.5">
          <button
            type="button"
            className="w-full rounded-lg border border-border py-1.5 text-[11px] font-bold uppercase tracking-widest text-text-secondary transition-colors hover:border-primary hover:text-primary"
          >
            {t('viewProfile')}
          </button>
        </div>
      </div>
    </article>
  );
}
