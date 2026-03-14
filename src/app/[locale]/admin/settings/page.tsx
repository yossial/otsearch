import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { getSettings } from '@/lib/db/models/SiteSettings';
import { getTranslations } from 'next-intl/server';
import SettingsForm from '@/components/admin/SettingsForm';

export default async function AdminSettingsPage() {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (role !== 'admin') redirect('/');

  const [settings, t] = await Promise.all([getSettings(), getTranslations('admin')]);

  const settingsData = {
    showTherapistFee: settings.showTherapistFee,
    showTherapistRating: settings.showTherapistRating,
    showTherapistMap: settings.showTherapistMap,
    featuredSectionEnabled: settings.featuredSectionEnabled,
    newRegistrationsEnabled: settings.newRegistrationsEnabled,
    requireAdminApproval: settings.requireAdminApproval,
    contactEmail: settings.contactEmail,
    defaultSortOrder: settings.defaultSortOrder,
    premiumMonthlyPrice: settings.premiumMonthlyPrice,
    premiumAnnualPrice: settings.premiumAnnualPrice,
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-normal text-text-primary">{t('settings.title')}</h1>
      <SettingsForm settings={settingsData} />
    </div>
  );
}
