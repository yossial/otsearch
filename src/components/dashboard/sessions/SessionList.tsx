'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';

interface Session {
  _id: string;
  date: string;
  duration: number;
  status: 'draft' | 'signed';
  goalsAddressed?: string[];
}

interface SessionListProps {
  patientId: string;
  locale: string;
}

export default function SessionList({ patientId, locale }: SessionListProps) {
  const t = useTranslations('dashboard.sessions');
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sessions?patientId=${encodeURIComponent(patientId)}&limit=50`);
      if (!res.ok) throw new Error('Failed to load sessions');
      const data = (await res.json()) as { sessions: Session[] };
      setSessions(data.sessions);
    } catch {
      setError('error');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    void fetchSessions();
  }, [fetchSessions]);

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-text-muted">
        <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return <p className="py-4 text-center text-sm text-red-600">{error}</p>;
  }

  if (sessions.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-text-muted">{t('noSessions')}</p>
        <button
          onClick={() =>
            router.push(`/dashboard/patients/${patientId}/sessions/new` as Parameters<typeof router.push>[0])
          }
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-normal text-white hover:bg-primary-hover"
        >
          {t('newSession')}
        </button>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {sessions.map((s) => (
        <button
          key={s._id}
          onClick={() =>
            router.push(
              `/dashboard/patients/${patientId}/sessions/${s._id}` as Parameters<typeof router.push>[0]
            )
          }
          className="flex w-full items-center justify-between px-4 py-3 text-start transition-colors hover:bg-bg-alt"
        >
          <div className="flex items-center gap-3">
            <div>
              <p className="text-sm font-normal text-text-primary">
                {new Date(s.date).toLocaleDateString(locale)}
              </p>
              <p className="text-xs text-text-muted">
                {s.duration} {t('duration').replace('(דק\')', '').trim()} ·{' '}
                {s.goalsAddressed?.length ?? 0} {t('goalsAddressed').toLowerCase()}
              </p>
            </div>
          </div>
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-normal ${
              s.status === 'signed'
                ? 'bg-green-50 text-green-700'
                : 'bg-yellow-50 text-yellow-700'
            }`}
          >
            {s.status === 'signed' ? t('statusSigned') : t('statusDraft')}
          </span>
        </button>
      ))}
    </div>
  );
}
