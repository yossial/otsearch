'use client';

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RevenuePoint {
  month: string;
  revenue: number;
}

interface SessionsPoint {
  week: string;
  sessions: number;
}

interface DashboardChartsProps {
  revenueData: RevenuePoint[];
  sessionsData: SessionsPoint[];
  revenueLabel: string;
  sessionsLabel: string;
}

function RevenueTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-sm">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm font-normal text-text-primary">₪{(payload[0]?.value ?? 0).toLocaleString()}</p>
    </div>
  );
}

function SessionsTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-surface px-3 py-2 shadow-sm">
      <p className="text-xs text-text-muted">{label}</p>
      <p className="text-sm font-normal text-text-primary">{payload[0]?.value ?? 0}</p>
    </div>
  );
}

export default function DashboardCharts({
  revenueData,
  sessionsData,
  revenueLabel,
  sessionsLabel,
}: DashboardChartsProps) {
  const hasRevenue = revenueData.some((d) => d.revenue > 0);
  const hasSessions = sessionsData.some((d) => d.sessions > 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Revenue trend */}
      <div className="card p-5">
        <p className="mb-4 text-xs font-normal uppercase tracking-wide text-text-muted">{revenueLabel}</p>
        {!hasRevenue ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-text-muted">—</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => v >= 1000 ? `₪${(v / 1000).toFixed(0)}k` : `₪${v}`}
              />
              <Tooltip content={<RevenueTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="var(--color-accent)"
                strokeWidth={2}
                fill="url(#revenueGrad)"
                dot={false}
                activeDot={{ r: 4, fill: 'var(--color-accent)', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Weekly sessions */}
      <div className="card p-5">
        <p className="mb-4 text-xs font-normal uppercase tracking-wide text-text-muted">{sessionsLabel}</p>
        {!hasSessions ? (
          <div className="flex h-40 items-center justify-center">
            <p className="text-sm text-text-muted">—</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={sessionsData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="week"
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip content={<SessionsTooltip />} />
              <Bar
                dataKey="sessions"
                fill="var(--color-primary)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
