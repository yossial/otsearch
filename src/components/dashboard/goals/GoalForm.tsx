'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface GoalFormProps {
  patientId: string;
  onCreated: () => void;
}

export default function GoalForm({ patientId, onCreated }: GoalFormProps) {
  const t = useTranslations('dashboard.goals');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
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
      setOpen(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-normal text-white hover:bg-primary-hover"
      >
        + {t('add')}
      </button>
    );
  }

  return (
    <form onSubmit={(e) => { void handleSubmit(e); }} className="rounded-lg border border-primary/20 bg-primary-light p-4">
      <h3 className="mb-3 text-sm font-normal text-text-primary">{t('add')}</h3>

      {error && <p className="mb-2 text-xs text-red-600">{error}</p>}

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
          onClick={() => setOpen(false)}
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
  );
}
