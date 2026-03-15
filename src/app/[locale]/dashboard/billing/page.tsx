import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
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
  const profile = await TherapistProfile.findOne({ userId: session.user.id })
    .select('subscriptionTier')
    .lean();

  const isPremium = profile?.subscriptionTier === 'premium';

  if (!isPremium) {
    return (
      <div className="min-h-screen bg-bg-alt">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="card p-8 text-center">
            <p className="text-lg font-normal text-text-primary">{t('premiumRequired')}</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-normal text-white hover:bg-primary-hover"
            >
              {/* back to dashboard */}
              ←
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-alt">
      <div className="mx-auto max-w-5xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="card overflow-hidden">
          <div className="gradient-bar" />
          <div className="flex items-center justify-between gap-4 p-5">
            <h1 className="text-xl font-normal text-text-primary">{t('title')}</h1>
            <Link
              href="/dashboard/billing/new"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-normal text-white hover:bg-primary-hover"
            >
              + {t('new')}
            </Link>
          </div>
        </div>

        {/* Invoice list */}
        <div className="card overflow-hidden">
          <InvoiceList locale={locale} />
        </div>

      </div>
    </div>
  );
}
