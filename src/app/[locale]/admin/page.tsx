import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export default async function AdminDashboardPage() {
  const session = await auth();
  const role = (session?.user as { role?: string | null } | undefined)?.role;
  if (role !== 'admin') redirect('/');

  const t = await getTranslations('admin');

  const { connectDB } = await import('@/lib/db');
  const { User } = await import('@/lib/db/models/User');
  const { TherapistProfile } = await import('@/lib/db/models/TherapistProfile');

  await connectDB();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  // Start of 6 months ago
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    totalUsers,
    totalTherapists,
    activeTherapists,
    premiumTherapists,
    featuredTherapists,
    newUsersThisMonth,
    profileViewsResult,
    monthlyRegistrations,
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
    User.aggregate<{ _id: { year: number; month: number }; count: number }>([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ]);

  const totalProfileViews = profileViewsResult[0]?.total ?? 0;

  // Build 6-month chart data (fill in missing months with 0)
  const chartMonths: { label: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const found = monthlyRegistrations.find((r) => r._id.year === year && r._id.month === month);
    chartMonths.push({
      label: d.toLocaleDateString('en', { month: 'short' }),
      count: found?.count ?? 0,
    });
  }

  const activeRate = totalTherapists > 0 ? Math.round((activeTherapists / totalTherapists) * 100) : 0;
  const premiumRate = totalTherapists > 0 ? Math.round((premiumTherapists / totalTherapists) * 100) : 0;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-text-primary">{t('dashboard.title')}</h1>

      {/* Stats grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label={t('dashboard.stats.totalUsers')} value={totalUsers} />
        <StatCard label={t('dashboard.stats.totalTherapists')} value={totalTherapists} />
        <StatCard label={t('dashboard.stats.activeTherapists')} value={activeTherapists} sub={`${activeRate}%`} />
        <StatCard label={t('dashboard.stats.premiumSubscribers')} value={premiumTherapists} sub={`${premiumRate}%`} />
        <StatCard label={t('dashboard.stats.featuredTherapists')} value={featuredTherapists} />
        <StatCard label={t('dashboard.stats.newRegistrations')} value={newUsersThisMonth} />
        <StatCard label={t('dashboard.stats.totalProfileViews')} value={totalProfileViews} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Registration trend chart */}
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">New registrations — last 6 months</h2>
          <BarChart months={chartMonths} />
        </div>

        {/* Platform health */}
        <div className="rounded-lg border border-border bg-surface p-5">
          <h2 className="mb-4 text-sm font-semibold text-text-primary">Platform health</h2>
          <div className="space-y-4">
            <RatioBar
              label="Active therapists"
              value={activeTherapists}
              total={totalTherapists}
              rate={activeRate}
              color="bg-green-500"
            />
            <RatioBar
              label="Premium subscribers"
              value={premiumTherapists}
              total={totalTherapists}
              rate={premiumRate}
              color="bg-primary"
            />
            <RatioBar
              label="Featured"
              value={featuredTherapists}
              total={totalTherapists}
              rate={totalTherapists > 0 ? Math.round((featuredTherapists / totalTherapists) * 100) : 0}
              color="bg-accent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">{label}</p>
      <div className="mt-1 flex items-baseline gap-1.5">
        <p className="text-2xl font-bold text-text-primary">{value.toLocaleString()}</p>
        {sub && <span className="text-xs font-medium text-text-muted">{sub}</span>}
      </div>
    </div>
  );
}

function BarChart({ months }: { months: { label: string; count: number }[] }) {
  const maxCount = Math.max(...months.map((m) => m.count), 1);
  const chartH = 80;

  return (
    <div className="flex items-end justify-between gap-2">
      {months.map((m) => {
        const barH = Math.max(Math.round((m.count / maxCount) * chartH), m.count > 0 ? 4 : 2);
        return (
          <div key={m.label} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-semibold text-text-primary">{m.count > 0 ? m.count : ''}</span>
            <div
              className="w-full rounded-t bg-primary"
              style={{ height: `${barH}px`, minHeight: '2px' }}
              title={`${m.label}: ${m.count}`}
            />
            <span className="text-[10px] text-text-muted">{m.label}</span>
          </div>
        );
      })}
    </div>
  );
}

function RatioBar({
  label,
  value,
  total,
  rate,
  color,
}: {
  label: string;
  value: number;
  total: number;
  rate: number;
  color: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="font-medium text-text-primary">{label}</span>
        <span className="text-text-muted">
          {value}/{total} <span className="font-semibold text-text-secondary">({rate}%)</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-bg-alt">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${rate}%` }} />
      </div>
    </div>
  );
}
