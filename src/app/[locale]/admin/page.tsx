import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export default async function AdminDashboardPage() {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (role !== 'admin') redirect('/');

  const t = await getTranslations('admin');

  // Fetch stats directly via DB rather than HTTP to avoid cookie complexity
  const { connectDB } = await import('@/lib/db');
  const { User } = await import('@/lib/db/models/User');
  const { TherapistProfile } = await import('@/lib/db/models/TherapistProfile');

  await connectDB();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    totalTherapists,
    activeTherapists,
    premiumTherapists,
    featuredTherapists,
    newUsersThisMonth,
    profileViewsResult,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'therapist' }),
    TherapistProfile.countDocuments({ isActive: true }),
    TherapistProfile.countDocuments({ subscriptionTier: 'premium' }),
    TherapistProfile.countDocuments({ isFeatured: true }),
    User.countDocuments({ createdAt: { $gte: startOfMonth } }),
    TherapistProfile.aggregate<{ total: number }>([
      { $group: { _id: null, total: { $sum: '$profileViews' } } },
    ]),
  ]);

  const totalProfileViews = profileViewsResult[0]?.total ?? 0;

  const stats = [
    { label: t('dashboard.stats.totalUsers'), value: totalUsers },
    { label: t('dashboard.stats.totalTherapists'), value: totalTherapists },
    { label: t('dashboard.stats.activeTherapists'), value: activeTherapists },
    { label: t('dashboard.stats.premiumSubscribers'), value: premiumTherapists },
    { label: t('dashboard.stats.featuredTherapists'), value: featuredTherapists },
    { label: t('dashboard.stats.newRegistrations'), value: newUsersThisMonth },
    { label: t('dashboard.stats.totalProfileViews'), value: totalProfileViews },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text-primary">{t('dashboard.title')}</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
      <p className="mt-1 text-2xl font-bold text-text-primary">{value.toLocaleString()}</p>
    </div>
  );
}
