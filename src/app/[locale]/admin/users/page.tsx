import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';
import { TherapistProfile } from '@/lib/db/models/TherapistProfile';
import { getTranslations } from 'next-intl/server';
import UsersTable from '@/components/admin/UsersTable';
import { Link } from '@/i18n/navigation';

interface PageProps {
  searchParams: Promise<{ page?: string; role?: string; status?: string; q?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (role !== 'admin') redirect('/');

  const t = await getTranslations('admin');
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10));
  const limit = 20;
  const roleFilter = sp.role ?? '';
  const statusFilter = sp.status ?? '';
  const q = sp.q ?? '';

  await connectDB();

  const filter: Record<string, unknown> = {};
  if (roleFilter === 'unregistered') filter.role = null;
  else if (roleFilter) filter.role = roleFilter;
  if (statusFilter) filter.status = statusFilter;
  if (q.trim()) {
    const regex = { $regex: q.trim(), $options: 'i' };
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const skip = (page - 1) * limit;
  const [rawUsers, total] = await Promise.all([
    User.find(filter).select('-passwordHash -emailVerifyToken -passwordResetToken').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  const profileIds = rawUsers.map((u) => u.therapistProfileId).filter(Boolean);
  const profiles = await TherapistProfile.find({ _id: { $in: profileIds } }).select('_id subscriptionTier').lean();
  const tierMap = new Map(profiles.map((p) => [String(p._id), p.subscriptionTier]));

  const users = rawUsers.map((u) => ({
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role ?? null,
    status: (u.status as string | undefined) ?? 'active',
    therapistProfileId: u.therapistProfileId ? String(u.therapistProfileId) : null,
    subscriptionTier: u.therapistProfileId ? (tierMap.get(String(u.therapistProfileId)) ?? 'free') : null,
    createdAt: (u.createdAt as Date).toISOString(),
  }));

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">{t('users.title')}</h1>
        <span className="text-sm text-text-secondary">{t('users.total', { count: total })}</span>
      </div>

      {/* Filters */}
      <form className="mb-5 flex flex-wrap gap-3">
        <input
          name="q"
          defaultValue={q}
          placeholder={t('users.searchPlaceholder')}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none"
        />
        <select
          name="role"
          defaultValue={roleFilter}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none"
        >
          <option value="">{t('users.filterRoles.all')}</option>
          <option value="therapist">{t('users.filterRoles.therapist')}</option>
          <option value="admin">{t('users.filterRoles.admin')}</option>
          <option value="unregistered">{t('users.filterRoles.unregistered')}</option>
        </select>
        <select
          name="status"
          defaultValue={statusFilter}
          className="rounded border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none"
        >
          <option value="">{t('users.filterStatuses.all')}</option>
          <option value="active">{t('users.filterStatuses.active')}</option>
          <option value="suspended">{t('users.filterStatuses.suspended')}</option>
        </select>
        <button
          type="submit"
          className="rounded bg-primary px-4 py-2 text-sm font-semibold text-text-accent transition-colors hover:opacity-90"
        >
          {t('common.filter')}
        </button>
      </form>

      <UsersTable users={users} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-5 flex items-center gap-3 text-sm">
          {page > 1 && (
            <Link href={{ pathname: '/admin/users', query: { ...sp, page: String(page - 1) } }} className="rounded border border-border px-3 py-1.5 text-text-secondary hover:bg-bg-alt">
              {t('common.previous')}
            </Link>
          )}
          <span className="text-text-secondary">{t('common.page', { page, total: totalPages })}</span>
          {page < totalPages && (
            <Link href={{ pathname: '/admin/users', query: { ...sp, page: String(page + 1) } }} className="rounded border border-border px-3 py-1.5 text-text-secondary hover:bg-bg-alt">
              {t('common.next')}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
