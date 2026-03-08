import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { TherapistProfile } from '@/lib/db/models/TherapistProfile';
import { getTranslations } from 'next-intl/server';
import TherapistsTable from '@/components/admin/TherapistsTable';
import { Link } from '@/i18n/navigation';

interface PageProps {
  searchParams: Promise<{ page?: string; tier?: string; featured?: string; active?: string; q?: string }>;
}

export default async function AdminTherapistsPage({ searchParams }: PageProps) {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (role !== 'admin') redirect('/');

  const t = await getTranslations('admin');
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10));
  const limit = 20;
  const tier = sp.tier ?? '';
  const featured = sp.featured ?? '';
  const active = sp.active ?? '';
  const q = sp.q ?? '';

  await connectDB();

  const filter: Record<string, unknown> = {};
  if (tier) filter.subscriptionTier = tier;
  if (featured === 'true') filter.isFeatured = true;
  else if (featured === 'false') filter.isFeatured = false;
  if (active === 'true') filter.isActive = true;
  else if (active === 'false') filter.isActive = false;
  if (q.trim()) {
    const regex = { $regex: q.trim(), $options: 'i' };
    filter.$or = [{ 'displayName.he': regex }, { 'displayName.en': regex }, { 'location.city': regex }];
  }

  const skip = (page - 1) * limit;
  const [docs, total] = await Promise.all([
    TherapistProfile.find(filter)
      .select('slug displayName location subscriptionTier isFeatured isActive isAcceptingPatients profileViews createdAt')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    TherapistProfile.countDocuments(filter),
  ]);

  const therapists = docs.map((d) => ({
    id: String(d._id),
    slug: d.slug,
    displayName: d.displayName as { he: string; en?: string },
    city: d.location?.city ?? '',
    subscriptionTier: d.subscriptionTier,
    isFeatured: d.isFeatured,
    isActive: d.isActive,
    isAcceptingPatients: d.isAcceptingPatients,
    profileViews: d.profileViews,
    createdAt: (d.createdAt as Date).toISOString(),
  }));

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">{t('therapists.title')}</h1>
        <span className="text-sm text-text-secondary">{t('therapists.total', { count: total })}</span>
      </div>

      {/* Filters */}
      <form className="mb-5 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder={t('therapists.searchPlaceholder')}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none"
        />
        <select
          name="tier"
          defaultValue={tier}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none"
        >
          <option value="">{t('therapists.filterTiers.all')}</option>
          <option value="free">{t('therapists.filterTiers.free')}</option>
          <option value="premium">{t('therapists.filterTiers.premium')}</option>
        </select>
        <select
          name="active"
          defaultValue={active}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none"
        >
          <option value="">{t('therapists.filterStatuses.all')}</option>
          <option value="true">{t('therapists.filterStatuses.active')}</option>
          <option value="false">{t('therapists.filterStatuses.inactive')}</option>
        </select>
        <select
          name="featured"
          defaultValue={featured}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none"
        >
          <option value="">{t('therapists.filterFeatured.all')}</option>
          <option value="true">{t('therapists.filterFeatured.yes')}</option>
          <option value="false">{t('therapists.filterFeatured.no')}</option>
        </select>
        <button
          type="submit"
          className="rounded bg-primary px-4 py-2 text-sm font-semibold text-text-accent transition-colors hover:opacity-90"
        >
          {t('common.filter')}
        </button>
      </form>

      <TherapistsTable therapists={therapists} />

      {totalPages > 1 && (
        <div className="mt-5 flex items-center gap-3 text-sm">
          {page > 1 && (
            <Link href={{ pathname: '/admin/therapists', query: { ...sp, page: String(page - 1) } }} className="rounded border border-border px-3 py-1.5 text-text-secondary hover:bg-bg-alt">
              {t('common.previous')}
            </Link>
          )}
          <span className="text-text-secondary">{t('common.page', { page, total: totalPages })}</span>
          {page < totalPages && (
            <Link href={{ pathname: '/admin/therapists', query: { ...sp, page: String(page + 1) } }} className="rounded border border-border px-3 py-1.5 text-text-secondary hover:bg-bg-alt">
              {t('common.next')}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
