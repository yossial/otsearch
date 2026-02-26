import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getOTBySlug, incrementProfileViews } from '@/lib/db/ots';

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

const LANGUAGE_LABELS: Record<string, string> = {
  he: 'עברית',
  ar: 'ערבית',
  en: 'אנגלית',
  ru: 'רוסית',
  fr: 'צרפתית',
};

interface OTProfilePageProps {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function OTProfilePage({ params }: OTProfilePageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const ot = await getOTBySlug(slug);

  if (!ot) notFound();

  // Fire-and-forget view counter — don't await
  incrementProfileViews(slug);

  const t = await getTranslations('profile');

  const name = ot.displayName[locale as keyof typeof ot.displayName] ?? ot.displayName.he;
  const bio = ot.bio[locale as keyof typeof ot.bio] ?? ot.bio.he;

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link href="/search" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-primary">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-directional" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
          חזרה לחיפוש
        </Link>

        {/* Profile header */}
        <div className="mb-6 flex flex-col gap-4 rounded-lg bg-surface p-6 shadow-card sm:flex-row sm:items-start">
          <div className="flex-shrink-0">
            <Image
              src={ot.photo ?? `https://i.pravatar.cc/150?u=${ot.slug}`}
              alt={name}
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover ring-4 ring-primary-light"
            />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex flex-wrap items-start gap-3">
              <div>
                <h1 className="text-2xl font-bold text-text-primary">{name}</h1>
                <p className="text-base text-text-secondary">מרפא/ה בעיסוק</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {ot.subscriptionTier === 'premium' && (
                  <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">PRO</span>
                )}
                {ot.isAcceptingPatients && (
                  <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    {t('acceptingPatients')}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-text-secondary">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span>{ot.location.city}</span>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          {/* Main content */}
          <div className="flex flex-1 flex-col gap-6">
            {/* About */}
            <section className="rounded-lg bg-surface p-6 shadow-card">
              <h2 className="mb-3 text-lg font-semibold text-text-primary">{t('about')}</h2>
              <p className="leading-relaxed text-text-secondary">{bio}</p>
            </section>

            {/* Specialisations */}
            <section className="rounded-lg bg-surface p-6 shadow-card">
              <h2 className="mb-3 text-lg font-semibold text-text-primary">{t('specialisations')}</h2>
              <div className="flex flex-wrap gap-2">
                {ot.specialisations.map((spec) => (
                  <span key={spec} className="rounded-full bg-primary-light px-3 py-1.5 text-sm font-medium text-primary">
                    {SPECIALTY_LABELS[spec] ?? spec}
                  </span>
                ))}
              </div>
            </section>

            {/* Session types */}
            <section className="rounded-lg bg-surface p-6 shadow-card">
              <h2 className="mb-3 text-lg font-semibold text-text-primary">{t('sessionTypes')}</h2>
              <div className="flex flex-wrap gap-3">
                {ot.sessionTypes.map((st) => (
                  <div key={st} className="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5">
                    {st === 'in-person' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                      </svg>
                    )}
                    {st === 'telehealth' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect width="20" height="15" x="2" y="7" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" />
                      </svg>
                    )}
                    {st === 'home-visit' && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                      </svg>
                    )}
                    <span className="text-sm font-medium text-text-primary">
                      {SESSION_TYPE_LABELS[st] ?? st}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-4 md:w-72 md:flex-shrink-0">
            <div className="rounded-lg bg-surface p-5 shadow-card">
              {/* Fee */}
              {ot.feeRange && (
                <div className="mb-4 flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-text-primary">
                    ₪{ot.feeRange.min}–₪{ot.feeRange.max}
                  </span>
                  <span className="text-sm text-text-muted">לטיפול</span>
                </div>
              )}

              {/* Phone button */}
              <a
                href={`tel:${ot.contactPhone}`}
                className="mb-3 flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0c8f8a]"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.25h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.84A16 16 0 0 0 15.06 16l.95-.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                {t('contactPhone')}
              </a>

              <p className="mb-4 text-center text-xs text-text-muted">{ot.contactPhone}</p>

              <div className="h-px bg-border" />

              {/* Insurance */}
              <div className="mt-4">
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{t('insurance')}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {ot.insuranceAccepted.map((ins) => (
                    <span key={ins} className="rounded-full bg-bg-alt px-2.5 py-1 text-xs font-medium text-text-secondary">
                      {INSURANCE_LABELS[ins] ?? ins}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 h-px bg-border" />

              {/* Languages */}
              <div className="mt-4">
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{t('languages')}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {ot.languages.map((lang) => (
                    <span key={lang} className="rounded-full bg-bg-alt px-2.5 py-1 text-xs font-medium text-text-secondary">
                      {LANGUAGE_LABELS[lang] ?? lang}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 h-px bg-border" />

              {/* Location */}
              <div className="mt-4">
                <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">{t('location')}</h3>
                <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>{ot.location.city}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
