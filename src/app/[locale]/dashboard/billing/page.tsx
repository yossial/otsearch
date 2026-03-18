import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';
import { TherapistProfile } from '@/lib/db/models/TherapistProfile';
import InvoiceList from '@/components/dashboard/billing/InvoiceList';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const t = await getTranslations('dashboard.billing');
  return { title: t('title') };
}

export default async function BillingPage() {
  const locale = await getLocale();
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (!session?.user || role !== 'therapist') redirect(`/${locale}/auth/login`);

  const t = await getTranslations('dashboard.billing');

  await connectDB();
  const user = await User.findById(session.user.id).select('therapistProfileId').lean();
  const profile = user?.therapistProfileId
    ? await TherapistProfile.findById(user.therapistProfileId).select('subscriptionTier').lean()
    : null;

  const isPremium = profile?.subscriptionTier === 'premium';

  if (!isPremium) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-primary/20 bg-primary-light px-6 py-5">
        <div className="flex items-start gap-3">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="mt-0.5 shrink-0 text-primary"
            aria-hidden="true"
          >
            <path d="M6 2 3 6l9 14 9-14-3-4Z" />
            <path d="M3 6h18" />
          </svg>
          <p className="font-normal text-text-primary">{t('premiumRequired')}</p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-normal tracking-wide text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-primary"
        >
          {t('upgradeCtaShort') ?? 'Upgrade'}
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-normal text-text-primary">{t('title')}</h1>
        <Link
          href="/dashboard/billing/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-normal text-white hover:bg-primary-dark"
        >
          + {t('new')}
        </Link>
      </div>

      {/* Invoice list */}
      <div className="card overflow-hidden">
        <InvoiceList locale={locale} />
      </div>
    </>
  );
}
