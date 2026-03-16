'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';

interface ProgressEntry {
  date: string;
  sessionId: string;
  rating: number;
  note?: string;
}

interface Goal {
  _id: string;
  title: string;
  description?: string;
  targetDate?: string;
  status: 'active' | 'achieved' | 'discontinued' | 'modified';
  achievedDate?: string;
  progressEntries: ProgressEntry[];
}

interface GoalsSectionProps {
  patientId: string;
  locale: string;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-50 text-green-700',
  achieved: 'bg-primary-light text-primary',
  discontinued: 'bg-red-50 text-red-600',
  modified: 'bg-yellow-50 text-yellow-700',
};

function StarRating({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= value ? 'text-accent' : 'text-border'}>★</span>
      ))}
    </span>
  );
}

export default function GoalsSection({ patientId, locale }: GoalsSectionProps) {
  const t = useTranslations('dashboard.goals');

  // ── List state ───────────────────────────────────────────────────────────────
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  // ── Form state ───────────────────────────────────────────────────────────────
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────────
  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch(`/api/goals?patientId=${patientId}`);
      if (!res.ok) throw new Error('Failed to fetch goals');
      const data = (await res.json()) as { goals: Goal[] };
      setGoals(data.goals);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => { void fetchGoals(); }, [fetchGoals]);

  // ── Form submit ───────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setFormError(null);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          title: title.trim(),
          description: description.trim() || undefined,
          targetDate: targetDate || undefined,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Error');
      }
      setTitle('');
      setDescription('');
      setTargetDate('');
      setFormOpen(false);
      // Directly re-fetch so the new goal appears immediately
      setLoading(true);
      await fetchGoals();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  // ── Status update ─────────────────────────────────────────────────────────────
  async function updateStatus(goalId: string, status: Goal['status']) {
    setStatusUpdating(goalId);
    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const data = (await res.json()) as { goal: Goal };
      setGoals((prev) => prev.map((g) => g._id === goalId ? data.goal : g));
    } catch {
      // silently fail
    } finally {
      setStatusUpdating(null);
    }
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  const statusLabel: Record<string, string> = {
    active: t('statusActive'),
    achieved: t('statusAchieved'),
    discontinued: t('statusDiscontinued'),
    modified: t('statusModified'),
  };

  return (
    <div className="space-y-4">
      {/* ── Add goal button / form ─────────────────────────────────────────────── */}
      {!formOpen ? (
        <div className="flex justify-end">
          <button
            onClick={() => setFormOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-normal text-white hover:bg-primary-hover"
          >
            + {t('add')}
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => { void handleSubmit(e); }}
          className="rounded-lg border border-primary/20 bg-primary-light p-4"
        >
          <h3 className="mb-3 text-sm font-normal text-text-primary">{t('add')}</h3>
          {formError && <p className="mb-2 text-xs text-red-600">{formError}</p>}
          <div className="space-y-3">
            <div>
              <label className="form-label">
                {t('titleLabel')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="form-field w-full"
              />
            </div>
            <div>
              <label className="form-label">{t('description')}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="form-field w-full resize-y"
              />
            </div>
            <div>
              <label className="form-label">{t('targetDate')}</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="form-field w-full"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-normal text-text-secondary hover:text-primary"
            >
              ✕
            </button>
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="rounded-lg bg-primary px-4 py-1.5 text-sm font-normal text-white hover:bg-primary-hover disabled:opacity-50"
            >
              {saving ? '...' : t('save')}
            </button>
          </div>
        </form>
      )}

      {/* ── Goal list ─────────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3 p-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-bg-alt" />
          ))}
        </div>
      ) : listError ? (
        <p className="p-6 text-sm text-red-600">{listError}</p>
      ) : goals.length === 0 ? (
        <p className="p-6 text-sm text-text-muted">{t('noGoals')}</p>
      ) : (
        <div className="divide-y divide-border">
          {goals.map((goal) => {
            const isExpanded = expanded.has(goal._id);
            const avgRating = goal.progressEntries.length > 0
              ? goal.progressEntries.reduce((s, e) => s + e.rating, 0) / goal.progressEntries.length
              : null;
            const lastEntry = goal.progressEntries[goal.progressEntries.length - 1];
            const isEditing = editing === goal._id;

            return (
              <div key={goal._id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-normal ${STATUS_COLORS[goal.status] ?? ''}`}>
                        {statusLabel[goal.status] ?? goal.status}
                      </span>
                      <h3 className="text-sm font-normal text-text-primary">{goal.title}</h3>
                    </div>
                    {goal.description && (
                      <p className="mt-1 text-xs text-text-muted">{goal.description}</p>
                    )}
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-text-muted">
                      {goal.targetDate && (
                        <span>{t('targetDate')}: {new Date(goal.targetDate).toLocaleDateString(locale)}</span>
                      )}
                      {avgRating !== null && (
                        <span>{t('avgRating')}: <StarRating value={Math.round(avgRating)} /></span>
                      )}
                      {lastEntry && (
                        <span>{t('lastProgress')}: {new Date(lastEntry.date).toLocaleDateString(locale)}</span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {goal.status === 'active' && (
                      <button
                        onClick={() => { void updateStatus(goal._id, 'achieved'); }}
                        disabled={statusUpdating === goal._id}
                        title={t('statusAchieved')}
                        className="rounded-lg border border-green-200 bg-green-50 px-2.5 py-1 text-xs text-green-700 transition-colors hover:bg-green-100 disabled:opacity-50"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      onClick={() => setEditing(isEditing ? null : goal._id)}
                      className="rounded-lg border border-border px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-primary/30 hover:text-primary"
                    >
                      {isEditing ? '✕' : '✎'}
                    </button>
                    <button
                      onClick={() => toggleExpand(goal._id)}
                      className="rounded-lg border border-border px-2.5 py-1 text-xs text-text-secondary transition-colors hover:border-primary/30 hover:text-primary"
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {isEditing && (
                  <div className="mt-3 flex flex-wrap gap-1.5 rounded-lg bg-bg-alt p-3">
                    {(['active', 'achieved', 'discontinued', 'modified'] as Goal['status'][]).map((s) => (
                      <button
                        key={s}
                        onClick={() => { void updateStatus(goal._id, s); setEditing(null); }}
                        disabled={statusUpdating === goal._id}
                        className={`rounded-full px-3 py-1 text-xs transition-colors disabled:opacity-50 ${goal.status === s ? (STATUS_COLORS[s] ?? '') + ' ring-1 ring-current' : 'border border-border bg-bg text-text-secondary hover:border-primary/30 hover:text-primary'}`}
                      >
                        {statusLabel[s]}
                      </button>
                    ))}
                  </div>
                )}

                {isExpanded && goal.progressEntries.length > 0 && (
                  <div className="mt-3 space-y-2 rounded-lg bg-bg-alt p-3">
                    <p className="text-xs font-normal uppercase tracking-wide text-text-muted">{t('progress')}</p>
                    {[...goal.progressEntries].reverse().map((entry, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-text-muted">{new Date(entry.date).toLocaleDateString(locale)}</span>
                          <StarRating value={entry.rating} />
                        </div>
                        {entry.note && <span className="text-text-secondary">{entry.note}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
