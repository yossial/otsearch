import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import type { OTProfilePublic } from '@/types';
import { cn } from '@/lib/utils';

const SPECIALTY_LABELS: Record<string, string> = {
  paediatrics: 'ילדים ופיתוח',
  neurological: 'שיקום נוירולוגי',
  'mental-health': 'בריאות הנפש',
  'hand-therapy': 'טיפול ביד',
  geriatrics: 'גריאטריה',
  'sensory-processing': 'עיבוד חושי',
  vocational: 'שיקום תעסוקתי',
  ergonomic: 'ארגונומיה',
};

const INSURANCE_LABELS: Record<string, string> = {
  clalit: 'כללית',
  maccabi: 'מכבי',
  meuhedet: 'מאוחדת',
  leumit: 'לאומית',
  private: 'פרטי',
};

const SESSION_TYPE_LABELS: Record<string, string> = {
  'in-person': 'פרונטלי',
  telehealth: 'טלה-מדיסין',
  'home-visit': 'ביקור בית',
};

interface OTCardProps {
  ot: OTProfilePublic;
  locale: string;
}

export default function OTCard({ ot, locale }: OTCardProps) {
  const name =
    ot.displayName[locale as keyof typeof ot.displayName] ??
    ot.displayName.he;

  const isPremium = ot.subscriptionTier === 'premium';

  return (
    <article
      className={cn(
        'relative flex flex-col gap-4 rounded-lg bg-surface p-5 shadow-card transition-shadow duration-200 hover:shadow-card-hover',
        'sm:flex-row sm:items-start'
      )}
    >
      {isPremium && (
        <span className="absolute end-4 top-4 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-white">
          PRO
        </span>
      )}

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
            <p className="text-sm text-text-secondary">מרפא/ה בעיסוק</p>
          </div>
          {ot.isAcceptingPatients && (
            <span className="flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              מקבל/ת מטופלים חדשים
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-sm text-text-secondary">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0" aria-hidden="true">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
          </svg>
          <span>{ot.location.city}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {ot.specialisations.slice(0, 3).map((spec) => (
            <span key={spec} className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-medium text-primary">
              {SPECIALTY_LABELS[spec] ?? spec}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs text-text-muted">ביטוח:</span>
            {ot.insuranceAccepted.map((ins) => (
              <span key={ins} className="rounded bg-bg-alt px-1.5 py-0.5 text-xs text-text-secondary">
                {INSURANCE_LABELS[ins] ?? ins}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs text-text-muted">טיפול:</span>
            {ot.sessionTypes.map((st) => (
              <span key={st} className="rounded bg-bg-alt px-1.5 py-0.5 text-xs text-text-secondary">
                {SESSION_TYPE_LABELS[st] ?? st}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <span className="text-sm font-medium text-text-secondary">
            {ot.feeRange ? (
              <>₪{ot.feeRange.min}–₪{ot.feeRange.max}{' '}<span className="text-xs font-normal text-text-muted">לטיפול</span></>
            ) : (
              <span className="text-xs text-text-muted">מחיר לפי פניה</span>
            )}
          </span>
          <div className="flex items-center gap-2">
            <a href={`tel:${ot.contactPhone}`} className="flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#0c8f8a]">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.25h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.84A16 16 0 0 0 15.06 16l.95-.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              התקשר
            </a>
            <Link href={`/ot/${ot.slug}`} className="rounded-lg border border-primary px-3.5 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary-light">
              צפה בפרופיל
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
