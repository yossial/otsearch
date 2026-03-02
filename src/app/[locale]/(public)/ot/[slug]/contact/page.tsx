import { notFound } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { getOTBySlug } from '@/lib/db/ots';
import { getMockOTBySlug } from '@/lib/mock-search';
import ContactForm from '@/components/contact/ContactForm';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

export default async function ContactPage({ params }: Props) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = await getTranslations('contact');
  const tSearch = await getTranslations('search');

  const ot = await getOTBySlug(slug).catch(() => getMockOTBySlug(slug));
  if (!ot) notFound();

  const name = ot.displayName[locale as keyof typeof ot.displayName] ?? ot.displayName.he;

  const [lng, lat] = ot.location.coordinates;
  const mapSrc = `https://maps.google.com/maps?q=${lat},${lng}&z=15&output=embed`;

  return (
    <div className="min-h-screen bg-bg">
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Back to profile */}
        <Link
          href={`/ot/${slug}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon-directional" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
          {t('backToProfile')}
        </Link>

        {/* OT mini-header */}
        <div className="mb-6 flex items-center gap-4 rounded-lg bg-surface p-5 shadow-card">
          <Image
            src={ot.photo ?? `https://i.pravatar.cc/150?u=${ot.slug}`}
            alt={name}
            width={56}
            height={56}
            className="h-14 w-14 flex-shrink-0 rounded-full object-cover ring-2 ring-primary-light"
          />
          <div>
            <h1 className="text-lg font-bold text-text-primary">{name}</h1>
            <p className="text-sm text-text-secondary">{tSearch('otTitle')} · {ot.location.city}</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {ot.specialisations.slice(0, 3).map((s) => (
                <span key={s} className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-medium text-primary">
                  {tSearch(`specialisationLabels.${s}`)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Two-column layout: form + map */}
        <div className="flex flex-col gap-6 md:flex-row md:items-start">

          {/* Contact form */}
          <div className="flex-1">
            <div className="rounded-lg bg-surface p-6 shadow-card">
              <h2 className="mb-1 text-xl font-bold text-text-primary">{t('title')}</h2>
              <p className="mb-6 text-sm text-text-secondary">{t('subtitle', { name })}</p>
              <ContactForm otSlug={slug} otName={name} otEmail={ot.contactEmail} />
            </div>
          </div>

          {/* Map + address */}
          <aside className="md:w-72 md:flex-shrink-0">
            <div className="overflow-hidden rounded-lg bg-surface shadow-card">
              <iframe
                title={t('mapTitle')}
                src={mapSrc}
                className="h-56 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{t('mapTitle')}</p>
                <p className="mt-1 text-sm text-text-primary">{ot.location.address}</p>
                <p className="text-sm text-text-muted">{ot.location.city}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
