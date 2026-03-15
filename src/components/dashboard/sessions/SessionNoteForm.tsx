'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

interface Goal {
  _id: string;
  title: string;
  status: string;
}

interface Appointment {
  _id: string;
  startTime: string;
  type: string;
}

interface SessionData {
  _id: string;
  date: string;
  duration: number;
  status: 'draft' | 'signed';
  signedAt?: string;
  notes?: {
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    freeText?: string;
  };
  goalsAddressed?: string[];
  fee?: number;
  appointmentId?: string;
}

interface SessionNoteFormProps {
  patientId: string;
  locale: string;
  goals?: Goal[];
  appointments?: Appointment[];
  session?: SessionData;
}

export default function SessionNoteForm({
  patientId,
  locale,
  goals = [],
  appointments = [],
  session,
}: SessionNoteFormProps) {
  const t = useTranslations('dashboard.sessions');
  const router = useRouter();

  const isNew = !session;
  const isSigned = session?.status === 'signed';

  const [mode, setMode] = useState<'soap' | 'freetext'>(
    session?.notes?.freeText && !session?.notes?.subjective ? 'freetext' : 'soap'
  );
  const [date, setDate] = useState(
    session?.date ? new Date(session.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
  );
  const [duration, setDuration] = useState<string>(session?.duration?.toString() ?? '');
  const [fee, setFee] = useState<string>(session?.fee?.toString() ?? '');
  const [appointmentId, setAppointmentId] = useState(session?.appointmentId ?? '');
  const [goalsAddressed, setGoalsAddressed] = useState<string[]>(session?.goalsAddressed ?? []);
  const [subjective, setSubjective] = useState(session?.notes?.subjective ?? '');
  const [objective, setObjective] = useState(session?.notes?.objective ?? '');
  const [assessment, setAssessment] = useState(session?.notes?.assessment ?? '');
  const [plan, setPlan] = useState(session?.notes?.plan ?? '');
  const [freeText, setFreeText] = useState(session?.notes?.freeText ?? '');

  const [saving, setSaving] = useState(false);
  const [signing, setSigning] = useState(false);
  const [unsigning, setUnsigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignConfirm, setShowSignConfirm] = useState(false);
  const [generatingDraft, setGeneratingDraft] = useState(false);

  const canSave = date.trim() !== '' && duration.trim() !== '';

  function buildNotes() {
    if (mode === 'freetext') return { freeText };
    return { subjective, objective, assessment, plan };
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        patientId,
        date,
        duration: parseInt(duration, 10),
        fee: fee ? parseFloat(fee) : undefined,
        appointmentId: appointmentId || undefined,
        goalsAddressed,
        notes: buildNotes(),
      };

      let res: Response;
      if (isNew) {
        res = await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/sessions/${session._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Error saving session');
      }

      const data = (await res.json()) as { session: SessionData };

      if (isNew) {
        router.push(`/dashboard/patients/${patientId}/sessions/${data.session._id}` as Parameters<typeof router.push>[0]);
      } else {
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSign() {
    if (!session) return;
    setSigning(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${session._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sign' }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Error signing session');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSigning(false);
      setShowSignConfirm(false);
    }
  }

  async function handleUnsign() {
    if (!session) return;
    setUnsigning(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions/${session._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unsign' }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? 'Error unsigning session');
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setUnsigning(false);
    }
  }

  function toggleGoal(goalId: string) {
    setGoalsAddressed((prev) =>
      prev.includes(goalId) ? prev.filter((g) => g !== goalId) : [...prev, goalId]
    );
  }

  async function handleAiDraft() {
    setGeneratingDraft(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/draft-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionDate: date,
          duration: duration ? parseInt(duration, 10) : undefined,
          goalsAddressed: goals.filter((g) => goalsAddressed.includes(g._id)).map((g) => g.title),
          mode,
        }),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? t('aiDraftError'));
      }
      const data = (await res.json()) as { draft: Record<string, string> };
      const draft = data.draft;
      if (mode === 'freetext') {
        if (draft.freeText) setFreeText(draft.freeText);
      } else {
        if (draft.subjective) setSubjective(draft.subjective);
        if (draft.objective) setObjective(draft.objective);
        if (draft.assessment) setAssessment(draft.assessment);
        if (draft.plan) setPlan(draft.plan);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('aiDraftError'));
    } finally {
      setGeneratingDraft(false);
    }
  }

  // Signed read-only view
  if (isSigned) {
    return (
      <div className="space-y-6">
        {/* Signed badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-sm font-normal text-green-700">
              {t('signed')} ✓
            </span>
            {session.signedAt && (
              <span className="text-sm text-text-muted">
                {t('signedOn')}: {new Date(session.signedAt).toLocaleDateString(locale)}
              </span>
            )}
          </div>
          <button
            onClick={handleUnsign}
            disabled={unsigning}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-normal text-text-secondary transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-50"
          >
            {unsigning ? '...' : t('unsign')}
          </button>
        </div>

        {/* Read-only fields */}
        <div className="card p-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="mb-1 text-xs font-normal uppercase tracking-wide text-text-muted">{t('date')}</p>
              <p className="text-sm text-text-primary">{new Date(session.date).toLocaleDateString(locale)}</p>
            </div>
            <div>
              <p className="mb-1 text-xs font-normal uppercase tracking-wide text-text-muted">{t('duration')}</p>
              <p className="text-sm text-text-primary">{session.duration}</p>
            </div>
            {session.fee != null && (
              <div>
                <p className="mb-1 text-xs font-normal uppercase tracking-wide text-text-muted">{t('fee')}</p>
                <p className="text-sm text-text-primary">₪{session.fee}</p>
              </div>
            )}
          </div>

          {session.notes && (
            <>
              {session.notes.freeText ? (
                <div>
                  <p className="mb-1 text-xs font-normal uppercase tracking-wide text-text-muted">{t('freeText')}</p>
                  <p className="whitespace-pre-wrap text-sm text-text-primary">{session.notes.freeText}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {session.notes.subjective && (
                    <div>
                      <p className="mb-1 text-xs font-normal uppercase tracking-wide text-text-muted">{t('subjective')}</p>
                      <p className="whitespace-pre-wrap text-sm text-text-primary">{session.notes.subjective}</p>
                    </div>
                  )}
                  {session.notes.objective && (
                    <div>
                      <p className="mb-1 text-xs font-normal uppercase tracking-wide text-text-muted">{t('objective')}</p>
                      <p className="whitespace-pre-wrap text-sm text-text-primary">{session.notes.objective}</p>
                    </div>
                  )}
                  {session.notes.assessment && (
                    <div>
                      <p className="mb-1 text-xs font-normal uppercase tracking-wide text-text-muted">{t('assessment')}</p>
                      <p className="whitespace-pre-wrap text-sm text-text-primary">{session.notes.assessment}</p>
                    </div>
                  )}
                  {session.notes.plan && (
                    <div>
                      <p className="mb-1 text-xs font-normal uppercase tracking-wide text-text-muted">{t('plan')}</p>
                      <p className="whitespace-pre-wrap text-sm text-text-primary">{session.notes.plan}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {goalsAddressed.length > 0 && goals.length > 0 && (
            <div>
              <p className="mb-1 text-xs font-normal uppercase tracking-wide text-text-muted">{t('goalsAddressed')}</p>
              <div className="flex flex-wrap gap-1.5">
                {goals
                  .filter((g) => goalsAddressed.includes(g._id))
                  .map((g) => (
                    <span key={g._id} className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs text-primary">
                      {g.title}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>

        <p className="text-xs text-text-muted">{t('encryptedNote')}</p>

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Header fields */}
      <div className="card p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Date */}
          <div>
            <label className="mb-1.5 block text-sm font-normal text-text-secondary">
              {t('date')} <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="mb-1.5 block text-sm font-normal text-text-secondary">
              {t('duration')} <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="480"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="45"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
            />
          </div>

          {/* Fee */}
          <div>
            <label className="mb-1.5 block text-sm font-normal text-text-secondary">{t('fee')}</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              placeholder="₪"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
            />
          </div>

          {/* Appointment link */}
          {appointments.length > 0 && (
            <div>
              <label className="mb-1.5 block text-sm font-normal text-text-secondary">{t('linkAppointment')}</label>
              <select
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none"
              >
                <option value="">—</option>
                {appointments.map((a) => (
                  <option key={a._id} value={a._id}>
                    {new Date(a.startTime).toLocaleDateString(locale)} — {a.type}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Goals addressed */}
        {goals.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-normal text-text-secondary">{t('goalsAddressed')}</p>
            <div className="flex flex-wrap gap-2">
              {goals
                .filter((g) => g.status === 'active')
                .map((g) => (
                  <label key={g._id} className="flex cursor-pointer items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={goalsAddressed.includes(g._id)}
                      onChange={() => toggleGoal(g._id)}
                      className="rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-text-secondary">{g.title}</span>
                  </label>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Note format toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode('soap')}
          className={`rounded-lg border px-4 py-2 text-sm font-normal transition-colors ${
            mode === 'soap'
              ? 'border-primary bg-primary text-white'
              : 'border-border bg-bg text-text-secondary hover:border-primary/30'
          }`}
        >
          {t('soapMode')}
        </button>
        <button
          onClick={() => setMode('freetext')}
          className={`rounded-lg border px-4 py-2 text-sm font-normal transition-colors ${
            mode === 'freetext'
              ? 'border-primary bg-primary text-white'
              : 'border-border bg-bg text-text-secondary hover:border-primary/30'
          }`}
        >
          {t('freeTextMode')}
        </button>
      </div>

      {/* Note fields */}
      <div className="card p-6 space-y-4">
        {mode === 'soap' ? (
          <>
            <div>
              <label className="mb-1.5 block text-sm font-normal text-text-secondary">
                {t('subjective')}
                <span className="ms-1 text-xs text-text-muted">— {t('subjectiveHint')}</span>
              </label>
              <textarea
                value={subjective}
                onChange={(e) => setSubjective(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none resize-y"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-normal text-text-secondary">
                {t('objective')}
                <span className="ms-1 text-xs text-text-muted">— {t('objectiveHint')}</span>
              </label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none resize-y"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-normal text-text-secondary">
                {t('assessment')}
                <span className="ms-1 text-xs text-text-muted">— {t('assessmentHint')}</span>
              </label>
              <textarea
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none resize-y"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-normal text-text-secondary">
                {t('plan')}
                <span className="ms-1 text-xs text-text-muted">— {t('planHint')}</span>
              </label>
              <textarea
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none resize-y"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="mb-1.5 block text-sm font-normal text-text-secondary">{t('freeText')}</label>
            <textarea
              value={freeText}
              onChange={(e) => setFreeText(e.target.value)}
              rows={10}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-primary focus:border-primary focus:outline-none resize-y"
            />
          </div>
        )}
      </div>

      <p className="text-xs text-text-muted">{t('encryptedNote')}</p>

      {/* Footer actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* AI Draft */}
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => { void handleAiDraft(); }}
            disabled={generatingDraft}
            className="inline-flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary-light px-3 py-2 text-sm font-normal text-primary transition-colors hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 8v4l3 3"/>
            </svg>
            {generatingDraft ? t('aiDraftGenerating') : t('aiDraft')}
          </button>
          <p className="text-2xs text-text-muted">{t('aiDraftHint')}</p>
        </div>

        <div className="flex gap-2">
          {/* Save Draft */}
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="rounded-lg border border-border px-4 py-2 text-sm font-normal text-text-secondary transition-colors hover:border-primary/30 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '...' : t('saveDraft')}
          </button>

          {/* Sign & Lock (only for existing draft sessions) */}
          {!isNew && (
            <button
              onClick={() => setShowSignConfirm(true)}
              disabled={signing || !canSave}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-normal text-white transition-colors hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {signing ? '...' : t('signAndLock')}
            </button>
          )}
        </div>
      </div>

      {/* Sign confirmation dialog */}
      {showSignConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-bg p-6 shadow-lg">
            <p className="mb-4 text-sm text-text-primary">{t('signConfirm')}</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSignConfirm(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-normal text-text-secondary hover:text-primary"
              >
                {/* common cancel */}
                ביטול
              </button>
              <button
                onClick={handleSign}
                disabled={signing}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-normal text-white hover:bg-primary-hover disabled:opacity-50"
              >
                {signing ? '...' : t('signAndLock')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
