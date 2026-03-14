import { notFound } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { getTherapistBySlug, incrementProfileViews } from '@/lib/db/therapists';
import { getMockTherapistBySlug } from '@/lib/mock-search';
import ContactForm from '@/components/contact/ContactForm';
import StarDisplay from '@/components/reviews/StarDisplay';
import { FEATURES } from '@/lib/config/features';
import ReviewsSection from '@/components/reviews/ReviewsSection';

interface TherapistProfilePageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<{ from?: string }>;
}

function stKey(st: string) {
  return st === 'in-person' ? 'inPerson' : st === 'home-visit' ? 'homeVisit' : 'telehealth';
}

export default async function TherapistProfilePage({ params, searchParams }: TherapistProfilePageProps) {
  const { slug } = await params;
  const { from } = await searchParams;
  const locale = await getLocale();
  const session = await auth();

  const therapist = await getTherapistBySlug(slug).catch((err: unknown) => {
    console.warn('[TherapistProfilePage] DB unavailable, falling back to mock data:', (err as Error).message);
    return getMockTherapistBySlug(slug);
  });

  if (!therapist) notFound();

  const sessionUserId = (session?.user as { id?: string } | undefined)?.id ?? null;
  const userRole = (session?.user as { role?: string } | undefined)?.role ?? null;
  const canEdit = !!session?.user &&
    (session.user as { therapistProfileId?: string | null }).therapistProfileId === therapist.id;

  if (!canEdit && userRole !== 'admin') {
    incrementProfileViews(slug);
  }

  const t = await getTranslations('profile');
  const tSearch = await getTranslations('search');
  const tContact = await getTranslations('contact');

  const name = therapist.displayName[locale as keyof typeof therapist.displayName] ?? therapist.displayName.he;
  const bio = therapist.bio[locale as keyof typeof therapist.bio] ?? therapist.bio.he;

  const titleKey =
    therapist.gender === 'male' ? 'therapistTitleMale'
    : therapist.gender === 'female' ? 'therapistTitleFemale'
    : 'therapistTitle';

  const fromDashboard = from === 'dashboard';
  const backHref = fromDashboard ? '/dashboard' : '/search';
  const backLabel = fromDashboard ? t('backToDashboard') : t('backToSearch');

  return (
    <div className="min-h-screen bg-bg-alt">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Back link */}
        <Link
          href={backHref}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-normal text-text-secondary transition-colors hover:text-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-directional" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
          {backLabel}
        </Link>

        {/* Hero card */}
        <div className="card mb-5 overflow-hidden">
          <div className="gradient-bar" />
          <div className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start">

              {/* Photo */}
              <div className="flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={therapist.photo ?? `https://i.pravatar.cc/150?u=${therapist.slug}`}
                  alt={name}
                  width={88}
                  height={88}
                  className="h-22 w-22 rounded-full object-cover ring-2 ring-border"
                />
              </div>

              {/* Info */}
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h1 className="text-xl font-normal text-text-primary">{name}</h1>
                    <p className="text-sm text-text-secondary">{t(titleKey)}</p>
                  </div>
                  {canEdit && (
                    <Link
                      href="/dashboard/edit"
                      className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-normal text-text-secondary transition-colors hover:border-primary hover:text-primary"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      {t('editProfile')}
                    </Link>
                  )}
                </div>

                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {therapist.subscriptionTier === 'premium' && (
                    <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-normal text-white">PRO</span>
                  )}
                  {therapist.isAcceptingPatients && (
                    <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-normal text-green-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                      {t('acceptingPatients')}
                    </span>
                  )}
                </div>

                {/* Stats row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
                  {FEATURES.showTherapistRating && therapist.ratingCount > 0 && (
                    <StarDisplay rating={therapist.ratingAvg} size="sm" showNumber count={therapist.ratingCount} />
                  )}
                  <span className="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
                    </svg>
                    {therapist.location.city}
                  </span>
                  {FEATURES.showTherapistFee && therapist.feeRange && (
                    <span>₪{therapist.feeRange.min}–{therapist.feeRange.max} / {t('feePerSession')}</span>
                  )}
                </div>

                {/* CTAs */}
                <div className="mt-1 flex flex-wrap gap-2">
                  <a
                    href="#contact"
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-normal tracking-wide text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-primary"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                    {tContact('title')}
                  </a>
                  {therapist.contactPhone && (
                    <a
                      href={`tel:${therapist.contactPhone}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-normal text-text-secondary transition-colors hover:border-primary hover:text-primary"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.25h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.84A16 16 0 0 0 15.06 16l.95-.95a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      {t('contactPhone')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start">

          {/* Main content */}
          <div className="flex flex-1 flex-col gap-4">

            {/* About */}
            {bio && (
              <section className="card p-4">
                <h2 className="mb-3 text-sm font-normal text-text-primary">{t('about')}</h2>
                <p className="text-sm leading-relaxed text-text-secondary">{bio}</p>
              </section>
            )}

            {/* Specialisations */}
            {(therapist.specialisations.length > 0 || (therapist.specialisationsOther?.length ?? 0) > 0) && (
              <section className="card p-4">
                <h2 className="mb-3 text-sm font-normal text-text-primary">{t('specialisations')}</h2>
                <div className="flex flex-wrap gap-2">
                  {therapist.specialisations.map((spec) => (
                    <span key={spec} className="rounded-full bg-primary-light px-3 py-1 text-sm font-normal text-primary">
                      {tSearch(`specialisationLabels.${spec}`)}
                    </span>
                  ))}
                  {therapist.specialisationsOther?.map((spec) => (
                    <span key={spec} className="rounded-full bg-bg-alt px-3 py-1 text-sm font-normal text-text-secondary">
                      {spec}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Session types */}
            {(therapist.sessionTypes.length > 0 || (therapist.sessionTypesOther?.length ?? 0) > 0) && (
              <section className="card p-4">
                <h2 className="mb-3 text-sm font-normal text-text-primary">{t('sessionTypes')}</h2>
                <div className="flex flex-wrap gap-2">
                  {therapist.sessionTypes.map((st) => (
                    <div key={st} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5">
                      {st === 'in-person' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                      )}
                      {st === 'telehealth' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <rect width="20" height="15" x="2" y="7" rx="2" ry="2" /><polyline points="17 2 12 7 7 2" />
                        </svg>
                      )}
                      {st === 'home-visit' && (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
                        </svg>
                      )}
                      <span className="text-sm font-normal text-text-primary">
                        {tSearch(`sessionTypes.${stKey(st)}`)}
                      </span>
                    </div>
                  ))}
                  {therapist.sessionTypesOther?.map((st) => (
                    <div key={st} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5">
                      <span className="text-sm font-normal text-text-secondary">{st}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Reviews */}
            <ReviewsSection slug={slug} sessionUserId={sessionUserId} userRole={userRole} />

            {/* Contact form */}
            <section id="contact" className="card p-4">
              <h2 className="mb-1 text-sm font-normal text-text-primary">{tContact('title')}</h2>
              <p className="mb-4 text-sm text-text-secondary">{tContact('subtitle', { name })}</p>
              <ContactForm therapistSlug={slug} therapistName={name} therapistEmail={therapist.contactEmail} />
            </section>
          </div>

          {/* Sidebar */}
          <aside className="flex flex-col gap-3 md:w-64 md:flex-shrink-0">

            {/* Insurance */}
            {therapist.insuranceAccepted.length > 0 && (
              <div className="card p-4">
                <h3 className="section-eyebrow mb-2.5">{t('insurance')}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {therapist.insuranceAccepted.map((ins) => (
                    <span key={ins} className="rounded-full bg-bg-alt px-2.5 py-1 text-xs font-normal text-text-secondary">
                      {tSearch(`insurance.${ins}`)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Languages */}
            {therapist.languages.length > 0 && (
              <div className="card p-4">
                <h3 className="section-eyebrow mb-2.5">{t('languages')}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {therapist.languages.map((lang) => (
                    <span key={lang} className="rounded-full bg-bg-alt px-2.5 py-1 text-xs font-normal text-text-secondary">
                      {tSearch(`languageLabels.${lang}`)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* MOH Licence */}
            {therapist.mohRegistrationNumber && (
              <div className="card p-4">
                <h3 className="section-eyebrow mb-2.5">{t('mohNumber')}</h3>
                <span className="mb-2 flex items-center gap-1.5 text-xs font-normal text-green-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                  {therapist.mohRegistrationNumber}
                </span>
                <a
                  href="https://practitioners.health.gov.il/Practitioners/14"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-xs text-primary hover:underline"
                >
                  {t('verifyLicence')} →
                </a>
              </div>
            )}

            {/* Location */}
            <div className="card p-4">
              <h3 className="section-eyebrow mb-2.5">{t('location')}</h3>
              <div className="flex items-center gap-1.5 text-sm text-text-secondary">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" />
                </svg>
                <span>{therapist.location.city}</span>
              </div>
              {therapist.location.address && (
                <p className="mt-1 text-xs text-text-muted">{therapist.location.address}</p>
              )}
            </div>

          </aside>
        </div>
      </div>
    </div>
  );
}
