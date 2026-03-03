'use client';

import Image from 'next/image';
import { useRouter, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import type { TherapistProfilePublic } from '@/types';
import { cn } from '@/lib/utils';
import StarDisplay from '@/components/reviews/StarDisplay';

function stKey(st: string) {
  return st === 'in-person' ? 'inPerson' : st === 'home-visit' ? 'homeVisit' : 'telehealth';
}

export default function TherapistCard({ therapist }: { therapist: TherapistProfilePublic }) {
  const ot = therapist;
  const t = useTranslations('search');
  const locale = useLocale();
  const router = useRouter();

  const name =
    ot.displayName[locale as keyof typeof ot.displayName] ?? ot.displayName.he;

  const isPremium = ot.subscriptionTier === 'premium';

  const titleKey =
    ot.gender === 'male' ? 'therapistTitleMale'
    : ot.gender === 'female' ? 'therapistTitleFemale'
    : 'therapistTitle';

  return (
    <article
      onClick={() => router.push(`/therapist/${ot.slug}`)}
      className={cn(
        'flex cursor-pointer flex-col gap-4 rounded-lg bg-surface p-5 shadow-card transition-shadow duration-200 hover:shadow-card-hover',
        'sm:flex-row sm:items-start'
      )}
    >
      <div className="flex-shrink-0">
        <Image
          src={ot.photo ?? `https://i.pravatar.cc/150?u=${ot.slug}`}
          alt={name}
          width={64}
          height={64}
          className="h-16 w-16 rounded-full object-cover ring-2 ring-primary-light"
        />
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-text-primary">{name}</h3>
            <p className="text-sm text-text-secondary">{t(titleKey)}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {ot.isAcceptingPatients && (
              <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                {t('acceptingPatientsFilter')}
              </span>
            )}
            {isPremium && (
              <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">
                PRO
              </span>
            )}
          </div>
        </div>

        {/* Star rating — only shown when there are reviews */}
        {ot.ratingCount > 0 && (
          <div className="flex items-center gap-1.5">
            <StarDisplay rating={ot.ratingAvg} size="sm" />
            <span className="text-sm font-medium text-text-primary">{ot.ratingAvg.toFixed(1)}</span>
            <span className="text-sm text-text-muted">({ot.ratingCount})</span>
          </div>
        )}

        <div className="flex items-center gap-1 text-sm text-text-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" aria-hidden="true">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
          </svg>
          <span>{ot.location.city}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {ot.specialisations.slice(0, 3).map((spec) => (
            <span key={spec} className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary">
              {t(`specialisationLabels.${spec}`)}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs text-text-muted">{t('insuranceLabel')}</span>
            {ot.insuranceAccepted.map((ins) => (
              <span key={ins} className="rounded bg-bg-alt px-1.5 py-0.5 text-xs text-text-secondary">
                {t(`insurance.${ins}`)}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs text-text-muted">{t('sessionLabel')}</span>
            {ot.sessionTypes.map((st) => (
              <span key={st} className="rounded bg-bg-alt px-1.5 py-0.5 text-xs text-text-secondary">
                {t(`sessionTypes.${stKey(st)}`)}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {ot.feeRange ? (
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-medium text-text-muted">₪</span>
              <span className="text-sm text-text-primary">{ot.feeRange.min}–{ot.feeRange.max}</span>
              <span className="text-xs text-text-muted">/ {t('feePerSession')}</span>
            </div>
          ) : (
            <span className="text-xs text-text-muted">{t('noFeeInfo')}</span>
          )}
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <Link
              href={`/therapist/${ot.slug}/contact`}
              className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0c8f8a]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              {t('messageButton')}
            </Link>
            <Link
              href={`/therapist/${ot.slug}`}
              className="rounded-lg border border-primary px-3.5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-light"
            >
              {t('viewProfile')}
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
