'use client';

import Image from 'next/image';
import { useRouter } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import type { TherapistProfilePublic } from '@/types';
import StarDisplay from '@/components/reviews/StarDisplay';
import { FEATURES } from '@/lib/config/features';

const MAX_TAGS = 3;

export default function TherapistCard({ therapist }: { therapist: TherapistProfilePublic }) {
  const profile = therapist;
  const t = useTranslations('search');
  const locale = useLocale();
  const router = useRouter();

  const name =
    profile.displayName[locale as keyof typeof profile.displayName] ?? profile.displayName.he;

  const isPremium = profile.subscriptionTier === 'premium';

  const titleKey =
    profile.gender === 'male'
      ? 'therapistTitleMale'
      : profile.gender === 'female'
        ? 'therapistTitleFemale'
        : 'therapistTitle';

  const bio = profile.bio[locale as keyof typeof profile.bio] ?? profile.bio.he;

  const visibleSpecs = profile.specialisations.slice(0, MAX_TAGS);
  const extraSpecCount = profile.specialisations.length - MAX_TAGS;

  // Include both slugs and translated labels so client-side filter matches either
  const specSearchData = [
    ...profile.specialisations,
    ...profile.specialisations.map((s) => t(`specialisationLabels.${s}`)),
  ].join(' ');

  const feeLabel = FEATURES.showTherapistFee
    ? profile.feeRange && profile.feeRange.min > 0 && profile.feeRange.max >= profile.feeRange.min
      ? `₪${profile.feeRange.min}–${profile.feeRange.max}`
      : profile.feeRange && profile.feeRange.min > 0
        ? t('feeFrom', { min: profile.feeRange.min })
        : null
    : null;

  return (
    <article
      onClick={() => router.push(`/therapist/${profile.slug}`)}
      data-therapist-name={`${profile.displayName.he ?? ''} ${profile.displayName.en ?? ''} ${profile.displayName.ar ?? ''}`}
      data-therapist-city={profile.location?.city ?? ''}
      data-therapist-specs={specSearchData}
      className="card group relative flex cursor-pointer flex-col
                 shadow-[0_2px_16px_rgba(0,0,0,0.06)]
                 transition-[transform,box-shadow,border-color] duration-300 ease-spring
                 hover:-translate-y-1 hover:border-primary/20 hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]
                 active:translate-y-0 active:shadow-[0_2px_16px_rgba(0,0,0,0.06)]"
    >
      {/* Top row: accepting status (left) + fee (right) */}
      <div className="flex min-h-[1.75rem] items-center justify-between px-4 pt-3">
        {profile.isAcceptingPatients ? (
          <span className="rounded-full bg-success/10 px-2.5 py-1 text-[11px] font-normal leading-none text-success">
            {t('acceptingPatientsFilter')}
          </span>
        ) : (
          <span />
        )}
        {feeLabel && (
          <span className="text-sm font-normal text-text-secondary">{feeLabel}</span>
        )}
      </div>

      {/* Avatar — centered */}
      <div className="mt-3 flex justify-center">
        <div className="relative">
          <Image
            src={profile.photo ?? `https://i.pravatar.cc/150?u=${profile.slug}`}
            alt={name}
            width={80}
            height={80}
            className="h-20 w-20 rounded-full object-cover ring-2 ring-primary-light"
          />
          {isPremium && (
            <span className="absolute -end-1 -top-1 flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-normal leading-none text-text-accent shadow-sm">
              <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              {t('featuredLabel')}
            </span>
          )}
        </div>
      </div>

      {/* Identity — centered */}
      <div className="mt-2 px-4 text-center">
        <h3 className="text-base font-normal leading-snug text-text-primary">{name}</h3>
        <p className="mt-0.5 text-xs text-text-muted">{t(titleKey)}</p>

        {/* City */}
        <p className="mt-1 inline-flex items-center gap-1 text-xs font-normal text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="flex-shrink-0">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {profile.location.city}
        </p>

        {/* Rating (compact, only if has reviews and feature enabled) */}
        {FEATURES.showTherapistRating && profile.ratingCount > 0 && (
          <div className="mt-1 flex items-center justify-center gap-1">
            <StarDisplay rating={profile.ratingAvg} size="sm" />
            <span className="text-xs font-normal text-text-primary">{profile.ratingAvg.toFixed(1)}</span>
            <span className="text-xs text-text-muted">({profile.ratingCount})</span>
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
            className="whitespace-nowrap rounded-full border border-border px-2.5 py-0.5 text-[11px] font-normal text-text-secondary"
          >
            {t(`specialisationLabels.${spec}`)}
          </span>
        ))}
        {extraSpecCount > 0 && (
          <span className="whitespace-nowrap rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-normal text-white">
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
      <div className="px-4 pb-4 pt-2">
        <div className="border-t border-border pt-3">
          <button
            type="button"
            className="w-full rounded-lg bg-primary py-2.5 text-xs font-normal text-white transition-all duration-200 hover:bg-primary-dark group-hover:shadow-primary"
          >
            {t('viewProfile')}
          </button>
        </div>
      </div>
    </article>
  );
}
