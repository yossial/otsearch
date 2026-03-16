import { redirect } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { auth } from '@/lib/auth/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/db/models/User';
import { getTherapistProfileById } from '@/lib/db/therapists';
import { Patient } from '@/lib/db/models/Patient';
import { Appointment } from '@/lib/db/models/Appointment';
import { Invoice } from '@/lib/db/models/Invoice';
import { TreatmentSession } from '@/lib/db/models/TreatmentSession';
import mongoose from 'mongoose';
import DashboardCharts from '@/components/dashboard/DashboardCharts';

export async function generateMetadata() {
  const t = await getTranslations('dashboard');
  return { title: t('title') };
}

type Profile = Awaited<ReturnType<typeof getTherapistProfileById>>;

const COMPLETENESS_ITEMS = [
  'city',
  'bio',
  'specialisations',
  'sessionTypes',
  'insurance',
  'phone',
  'photo',
] as const;

function calcCompleteness(profile: Profile): { score: number; missing: string[] } {
  if (!profile) return { score: 0, missing: [] };
  const items: Array<{ key: string; done: boolean }> = [
    { key: 'city', done: !!profile.location.city },
    { key: 'bio', done: !!profile.bio.he },
    { key: 'specialisations', done: profile.specialisations.length > 0 },
    { key: 'sessionTypes', done: profile.sessionTypes.length > 0 },
    { key: 'insurance', done: profile.insuranceAccepted.length > 0 },
    { key: 'phone', done: !!profile.contactPhone },
    { key: 'photo', done: !!profile.photo },
  ];
  const done = items.filter((i) => i.done).length;
  return {
    score: Math.round((done / items.length) * 100),
    missing: items.filter((i) => !i.done).map((i) => i.key),
  };
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
}

export default async function DashboardPage() {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) redirect(`/${locale}/auth/login`);

  const t = await getTranslations('dashboard');

  let therapistProfileId = (session.user as { therapistProfileId?: string | null })
    .therapistProfileId;

  if (!therapistProfileId) {
    await connectDB();
    const dbUser = await User.findById(session.user.id).select('therapistProfileId').lean();
    if (!dbUser?.therapistProfileId) redirect(`/${locale}/onboarding/therapist`);
    therapistProfileId = String(dbUser.therapistProfileId);
  }

  const profile = await getTherapistProfileById(therapistProfileId);
  const { score: completenessScore, missing } = calcCompleteness(profile);
  const isPremium = profile?.subscriptionTier === 'premium';

  // ── Free tier: simple profile overview ────────────────────────────────────
  if (!isPremium) {
    const RING_R = 34;
    const RING_CIRCUM = 2 * Math.PI * RING_R;
    const ringOffset = RING_CIRCUM * (1 - completenessScore / 100);
    const ratingFull = profile ? Math.floor(profile.ratingAvg) : 0;
    const ratingHalf = profile ? profile.ratingAvg - ratingFull >= 0.5 : false;

    return (
      <>
        {completenessScore < 100 && profile && (
          <CompletenessCard
            score={completenessScore}
            missing={missing}
            ringR={RING_R}
            ringCircum={RING_CIRCUM}
            ringOffset={ringOffset}
            t={t}
          />
        )}

        {profile && (
          <div className="card p-6">
            <h2 className="mb-5 text-base font-normal text-text-primary">{t('profileStrength')}</h2>
            <div className="mb-5">
              <p className="section-eyebrow mb-2 text-text-muted">{t('rating')}</p>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => {
                    const filled = s <= ratingFull;
                    const half = !filled && s === ratingFull + 1 && ratingHalf;
                    return (
                      <svg
                        key={s}
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        className={filled || half ? 'text-accent' : 'text-border'}
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    );
                  })}
                </div>
                {profile.ratingCount > 0 ? (
                  <span className="text-sm font-normal text-text-primary">
                    {profile.ratingAvg.toFixed(1)}
                    <span className="ms-1 font-normal text-text-muted">({profile.ratingCount})</span>
                  </span>
                ) : (
                  <span className="text-sm text-text-muted">{t('noRating')}</span>
                )}
              </div>
            </div>
            <div>
              <p className="section-eyebrow mb-2 text-text-muted">{t('subscription')}</p>
              <span className="inline-block rounded-full border border-border bg-bg-alt px-3 py-1 text-xs font-normal text-text-secondary">
                {t('subscriptionFree')}
              </span>
            </div>
          </div>
        )}

        {/* Upgrade banner */}
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
            <div>
              <p className="font-normal text-text-primary">{t('upgradeTitle')}</p>
              <p className="mt-0.5 text-sm text-text-secondary">{t('upgradeDesc')}</p>
            </div>
          </div>
          <Link
            href="/dashboard/billing"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-normal tracking-wide text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-primary"
          >
            {t('upgradeCta')}
          </Link>
        </div>
      </>
    );
  }

  // ── Premium: full dashboard ────────────────────────────────────────────────
  await connectDB();

  const therapistId = session.user.id;
  const tid = new mongoose.Types.ObjectId(therapistId);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 1);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const eightWeeksAgo = new Date(now.getTime() - 8 * 7 * 24 * 60 * 60 * 1000);

  const [
    revenueAgg,
    lastMonthAgg,
    outstandingAgg,
    activePatientCount,
    newPatientsCount,
    weeklyApptCount,
    weeklyCompletedCount,
    unsignedNotesCount,
    todayAppts,
    outstandingPatientIds,
    overdueCount,
    atRiskCount,
    monthlyRevenueRaw,
    weeklySessionsRaw,
  ] = await Promise.all([
    Invoice.aggregate([
      { $match: { therapistId: tid, status: 'paid', paidAt: { $gte: monthStart } } },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Invoice.aggregate([
      {
        $match: {
          therapistId: tid,
          status: 'paid',
          paidAt: { $gte: lastMonthStart, $lt: lastMonthEnd },
        },
      },
      { $group: { _id: null, total: { $sum: '$total' } } },
    ]),
    Invoice.aggregate([
      { $match: { therapistId: tid, status: { $in: ['sent', 'overdue'] } } },
      { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
    ]),
    Patient.countDocuments({ therapistId, status: 'active' }),
    Patient.countDocuments({ therapistId, createdAt: { $gte: monthStart }, status: 'active' }),
    Appointment.countDocuments({
      therapistId,
      startTime: { $gte: weekStart, $lt: weekEnd },
      status: { $nin: ['cancelled'] },
    }),
    Appointment.countDocuments({
      therapistId,
      startTime: { $gte: weekStart, $lt: weekEnd },
      status: 'completed',
    }),
    TreatmentSession.countDocuments({ therapistId, status: 'draft' }),
    Appointment.find({
      therapistId,
      startTime: { $gte: todayStart, $lt: todayEnd },
      status: { $nin: ['cancelled'] },
    })
      .populate<{
        patientId: {
          _id: mongoose.Types.ObjectId;
          firstName: string;
          lastName: string;
          lastTreatmentDate: Date | null;
        };
      }>('patientId', 'firstName lastName lastTreatmentDate')
      .sort({ startTime: 1 })
      .lean(),
    Invoice.distinct('patientId', {
      therapistId,
      status: { $in: ['sent', 'overdue'] },
    }) as Promise<mongoose.Types.ObjectId[]>,
    Invoice.countDocuments({ therapistId, status: 'overdue' }),
    Patient.countDocuments({
      therapistId,
      status: 'active',
      lastTreatmentDate: { $lt: thirtyDaysAgo },
    }),
    // Monthly revenue for last 6 months
    Invoice.aggregate<{ _id: { year: number; month: number }; total: number }>([
      { $match: { therapistId: tid, status: 'paid', paidAt: { $gte: sixMonthsAgo } } },
      { $group: { _id: { year: { $year: '$paidAt' }, month: { $month: '$paidAt' } }, total: { $sum: '$total' } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    // Weekly completed sessions for last 8 weeks
    Appointment.aggregate<{ _id: string; count: number }>([
      { $match: { therapistId: tid, startTime: { $gte: eightWeeksAgo }, status: 'completed' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%V', date: '$startTime' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Build chart datasets
  const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONTH_NAMES_SHORT_HE = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יונ', 'יול', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];
  const monthNames = locale === 'he' ? MONTH_NAMES_SHORT_HE : MONTH_NAMES_SHORT;

  // Fill in any missing months so chart has 6 bars
  const revenueByMonth: { month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const found = monthlyRevenueRaw.find((r) => r._id.year === year && r._id.month === month);
    revenueByMonth.push({ month: monthNames[month - 1] ?? String(month), revenue: found?.total ?? 0 });
  }

  // Weekly sessions — take last 8 weeks
  const weeklySessionsData: { week: string; sessions: number }[] = weeklySessionsRaw.slice(-8).map((w, i) => ({
    week: `W${i + 1}`,
    sessions: w.count,
  }));
  // Pad to 8 weeks if fewer
  while (weeklySessionsData.length < 8) {
    weeklySessionsData.unshift({ week: `W${weeklySessionsData.length + 1}`, sessions: 0 });
  }

  const revenueThisMonth: number = revenueAgg[0]?.total ?? 0;
  const revenueLastMonth: number = lastMonthAgg[0]?.total ?? 0;
  const outstandingTotal: number = outstandingAgg[0]?.total ?? 0;
  const outstandingCount: number = outstandingAgg[0]?.count ?? 0;

  const revDelta = revenueLastMonth > 0
    ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
    : null;

  const outstandingSet = new Set(outstandingPatientIds.map(String));

  const todayList = todayAppts.map((appt) => {
    const pid = appt.patientId as {
      _id: mongoose.Types.ObjectId;
      firstName: string;
      lastName: string;
      lastTreatmentDate: Date | null;
    };
    return {
      id: String(appt._id),
      time: formatTime(new Date(appt.startTime)),
      patientName: `${pid.firstName} ${pid.lastName}`,
      patientId: String(pid._id),
      type: appt.type,
      status: appt.status,
      hasBalance: outstandingSet.has(String(pid._id)),
      isFirstVisit: !pid.lastTreatmentDate,
    };
  });

  const needsAttentionItems = [
    unsignedNotesCount > 0
      ? { key: 'notes', count: unsignedNotesCount, href: '/dashboard/patients' }
      : null,
    overdueCount > 0
      ? { key: 'invoices', count: overdueCount, href: '/dashboard/billing' }
      : null,
    atRiskCount > 0
      ? { key: 'atRisk', count: atRiskCount, href: '/dashboard/patients' }
      : null,
  ].filter(Boolean) as Array<{ key: string; count: number; href: string }>;

  const RING_R = 34;
  const RING_CIRCUM = 2 * Math.PI * RING_R;
  const ringOffset = RING_CIRCUM * (1 - completenessScore / 100);

  return (
    <>
      {/* ── Quick actions ──────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {[
          {
            href: '/dashboard/patients/new',
            label: t('overview.newPatient'),
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="22" y1="11" x2="16" y2="11" />
              </svg>
            ),
          },
          {
            href: '/dashboard/schedule',
            label: t('overview.scheduleAppt'),
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            ),
          },
          {
            href: '/dashboard/patients',
            label: t('overview.writeNote'),
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            ),
          },
          {
            href: '/dashboard/billing/new',
            label: t('overview.newInvoice'),
            icon: (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <line x1="1" y1="10" x2="23" y2="10" />
              </svg>
            ),
          },
        ].map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg px-3.5 py-2 text-sm font-normal text-text-secondary transition-colors hover:border-primary/40 hover:bg-primary-light hover:text-primary"
          >
            {icon}
            {label}
          </Link>
        ))}
      </div>

      {/* ── Today + Needs Attention ────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-2">

        {/* Today's schedule */}
        <div className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-normal text-text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-accent"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {t('overview.todaySchedule')}
            <span className="ms-auto rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">
              {new Date().toLocaleDateString(locale === 'he' ? 'he-IL' : locale === 'ar' ? 'ar' : 'en-GB', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </span>
          </h2>

          {todayList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-3 text-primary/25"
                aria-hidden="true"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <p className="text-sm text-text-muted">{t('overview.noAppointmentsToday')}</p>
              <Link
                href="/dashboard/schedule"
                className="mt-3 text-xs font-normal text-primary hover:underline"
              >
                {t('overview.scheduleAppt')} →
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {todayList.map((appt) => (
                <li key={appt.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="w-12 shrink-0 text-right text-sm font-normal tabular-nums text-primary rtl:text-left">
                    {appt.time}
                  </span>
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs ${
                      appt.type === 'telehealth'
                        ? 'bg-blue-50 text-blue-600'
                        : appt.type === 'home-visit'
                          ? 'bg-green-50 text-green-600'
                          : 'bg-primary-light text-primary'
                    }`}
                    title={appt.type}
                  >
                    {appt.type === 'telehealth' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                    ) : appt.type === 'home-visit' ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    )}
                  </span>
                  <Link
                    href={`/dashboard/patients/${appt.patientId}`}
                    className="min-w-0 flex-1 truncate text-sm font-normal text-text-primary hover:text-primary"
                  >
                    {appt.patientName}
                  </Link>
                  <div className="flex shrink-0 gap-1">
                    {appt.isFirstVisit && (
                      <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-normal text-primary">
                        {t('overview.firstVisit')}
                      </span>
                    )}
                    {appt.hasBalance && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-normal text-amber-700">
                        {t('overview.hasBalance')}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Needs attention */}
        <div className="card p-5">
          <h2 className="mb-4 flex items-center gap-2 text-base font-normal text-text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={needsAttentionItems.length > 0 ? 'text-amber-500' : 'text-text-muted'}
              aria-hidden="true"
            >
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            {t('overview.needsAttention')}
            {needsAttentionItems.length > 0 && (
              <span className="ms-auto flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs font-normal text-amber-700">
                {needsAttentionItems.length}
              </span>
            )}
          </h2>

          {needsAttentionItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mb-3 text-green-300"
                aria-hidden="true"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
              <p className="text-sm font-normal text-green-700">{t('overview.allClear')}</p>
              <p className="mt-1 text-xs text-text-muted">{t('overview.allClearSub')}</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {needsAttentionItems.map((item) => (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3 transition-colors hover:bg-amber-100"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-normal text-amber-700">
                      {item.count}
                    </span>
                    <span className="flex-1 text-sm font-normal text-amber-900">
                      {item.key === 'notes' && t('overview.signNotes')}
                      {item.key === 'invoices' && t('overview.reviewInvoices')}
                      {item.key === 'atRisk' && t('overview.atRiskPatients')}
                    </span>
                    {item.key === 'atRisk' && (
                      <span className="text-xs text-amber-600">{t('overview.atRiskSub')}</span>
                    )}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="shrink-0 text-amber-500 rtl:rotate-180"
                      aria-hidden="true"
                    >
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── KPI cards ──────────────────────────────────────────────── */}
      <div className="grid auto-rows-fr grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          value={`₪${revenueThisMonth.toLocaleString()}`}
          label={t('overview.revenueMonth')}
          sub={revDelta !== null ? `${revDelta >= 0 ? '+' : ''}${revDelta}% ${t('overview.vsLastMonth')}` : undefined}
          subColor={revDelta !== null ? (revDelta >= 0 ? 'green' : 'red') : undefined}
          iconClass="bg-green-50 text-green-600"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          }
        />
        <KpiCard
          value={`₪${outstandingTotal.toLocaleString()}`}
          label={t('overview.outstandingBalance')}
          sub={outstandingCount > 0 ? `${outstandingCount} ${t('overview.outstandingInvoices')}` : undefined}
          subColor={outstandingCount > 0 ? 'amber' : undefined}
          href="/dashboard/billing"
          iconClass="bg-amber-50 text-amber-600"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
            </svg>
          }
        />
        <KpiCard
          value={activePatientCount}
          label={t('overview.activePatients')}
          sub={newPatientsCount > 0 ? `+${newPatientsCount} ${t('overview.newThisMonth')}` : undefined}
          subColor="green"
          href="/dashboard/patients"
          iconClass="bg-blue-50 text-blue-600"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <KpiCard
          value={weeklyApptCount}
          label={t('overview.thisWeek')}
          sub={weeklyCompletedCount > 0 ? `${weeklyCompletedCount} ${t('schedule.statusCompleted').toLowerCase()}` : undefined}
          href="/dashboard/schedule"
          iconClass="bg-primary-light text-primary"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          }
        />
        <KpiCard
          value={unsignedNotesCount}
          label={t('overview.unsignedNotes')}
          sub={unsignedNotesCount === 0 ? t('overview.allSigned') : undefined}
          subColor={unsignedNotesCount > 0 ? 'red' : 'green'}
          urgent={unsignedNotesCount > 0}
          href={unsignedNotesCount > 0 ? '/dashboard/patients' : undefined}
          iconClass={unsignedNotesCount === 0 ? 'bg-green-50 text-green-600' : undefined}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          }
        />
      </div>

      {/* ── Charts ─────────────────────────────────────────────────── */}
      <DashboardCharts
        revenueData={revenueByMonth}
        sessionsData={weeklySessionsData}
        revenueLabel={t('overview.revenueMonth')}
        sessionsLabel={t('overview.thisWeek')}
      />

      {/* ── Profile completeness (when < 100%) ────────────────────── */}
      {completenessScore < 100 && profile && (
        <CompletenessCard
          score={completenessScore}
          missing={missing}
          ringR={RING_R}
          ringCircum={RING_CIRCUM}
          ringOffset={ringOffset}
          t={t}
        />
      )}
    </>
  );
}

// ── Shared components ──────────────────────────────────────────────────────

function KpiCard({
  value,
  label,
  sub,
  subColor,
  urgent,
  href,
  icon,
  iconClass,
}: {
  value: string | number;
  label: string;
  sub?: string;
  subColor?: 'green' | 'red' | 'amber';
  urgent?: boolean;
  href?: string;
  icon: React.ReactNode;
  iconClass?: string;
}) {
  const subColors = {
    green: 'text-green-600',
    red: 'text-red-500',
    amber: 'text-amber-600',
  };

  const resolvedIconClass = urgent
    ? 'bg-red-100 text-red-500'
    : (iconClass ?? 'bg-primary-light text-primary');

  const content = (
    <div
      className={`card flex h-full flex-col p-4 ${href ? 'cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-md' : ''} ${urgent ? 'border-red-100 bg-red-50/40' : ''}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${resolvedIconClass}`}>
          {icon}
        </span>
        <p className="text-xs leading-snug text-text-secondary">{label}</p>
      </div>
      <p className={`text-2xl font-normal tabular-nums ${urgent ? 'text-red-600' : 'text-text-primary'}`}>
        {value}
      </p>
      <p className={`mt-1 min-h-[1rem] text-xs ${sub && subColor ? subColors[subColor] : 'text-transparent'}`}>
        {sub ?? '\u00A0'}
      </p>
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{content}</Link>;
  }
  return content;
}

function CompletenessCard({
  score,
  missing,
  ringR,
  ringCircum,
  ringOffset,
  t,
}: {
  score: number;
  missing: string[];
  ringR: number;
  ringCircum: number;
  ringOffset: number;
  t: Awaited<ReturnType<typeof getTranslations>>;
}) {
  return (
    <div className="card p-6">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-normal text-text-primary">{t('completenessTitle')}</h2>
        <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-normal text-primary">
          {score}%
        </span>
      </div>

      <div className="flex items-center gap-5">
        <div className="relative shrink-0">
          <svg width="80" height="80" viewBox="0 0 80 80" aria-hidden="true">
            <circle cx="40" cy="40" r={ringR} fill="none" stroke="var(--color-bg-alt)" strokeWidth="7" />
            <circle
              cx="40"
              cy="40"
              r={ringR}
              fill="none"
              stroke="var(--color-primary)"
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={ringCircum}
              strokeDashoffset={ringOffset}
              transform="rotate(-90 40 40)"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-normal text-text-primary">{score}%</span>
          </div>
        </div>

        <ul className="flex-1 space-y-1.5">
          {COMPLETENESS_ITEMS.map((key) => {
            const done = !missing.includes(key);
            return (
              <li key={key} className="flex items-center gap-2">
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors ${
                    done ? 'bg-green-500' : 'border-2 border-border'
                  }`}
                >
                  {done && (
                    <svg
                      width="8"
                      height="8"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="white"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </span>
                <span
                  className={`text-xs ${done ? 'text-text-muted line-through' : 'font-normal text-text-primary'}`}
                >
                  {(t as (k: string) => string)(`completenessItems.${key}`)}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {missing.length > 0 && (
        <Link
          href="/dashboard/edit"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-normal text-primary hover:underline"
        >
          {t('completeProfile')}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="rtl:rotate-180"
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </Link>
      )}
    </div>
  );
}
