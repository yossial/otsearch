'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { AvailabilityData } from './ScheduleTabs';
import FormSelect from '@/components/ui/FormSelect';

interface WeeklyScheduleEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  sessionDuration: number;
  breakBetween: number;
  active: boolean;
}

interface ExceptionEntry {
  date: string;
  type: 'unavailable' | 'special_hours';
  startTime?: string;
  endTime?: string;
  reason?: string;
}

interface Props {
  initialAvailability: AvailabilityData;
}

const DAY_INDICES = [0, 1, 2, 3, 4, 5, 6] as const;

function buildInitialDays(
  weeklySchedule: AvailabilityData['weeklySchedule']
): WeeklyScheduleEntry[] {
  return DAY_INDICES.map((day) => {
    const existing = weeklySchedule.find((s) => s.dayOfWeek === day);
    return existing
      ? { ...existing, active: true }
      : {
          dayOfWeek: day,
          startTime: '09:00',
          endTime: '17:00',
          sessionDuration: 45,
          breakBetween: 15,
          active: false,
        };
  });
}

export default function AvailabilityForm({ initialAvailability }: Props) {
  const t = useTranslations('dashboard.schedule');

  const [days, setDays] = useState<WeeklyScheduleEntry[]>(
    buildInitialDays(initialAvailability.weeklySchedule)
  );
  const [bookingWindowDays, setBookingWindowDays] = useState(
    initialAvailability.bookingWindowDays
  );
  const [minNoticeHours, setMinNoticeHours] = useState(
    initialAvailability.minNoticeHours
  );
  const [exceptions, setExceptions] = useState<ExceptionEntry[]>(
    initialAvailability.exceptions.map((e) => ({
      ...e,
      date: typeof e.date === 'string' ? e.date.slice(0, 10) : '',
    }))
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New exception draft
  const [newException, setNewException] = useState<ExceptionEntry>({
    date: '',
    type: 'unavailable',
    startTime: '',
    endTime: '',
    reason: '',
  });

  function updateDay(
    dayOfWeek: number,
    field: keyof Omit<WeeklyScheduleEntry, 'dayOfWeek'>,
    value: string | number | boolean
  ) {
    setDays((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d))
    );
  }

  function addException() {
    if (!newException.date) return;
    setExceptions((prev) => [...prev, { ...newException }]);
    setNewException({ date: '', type: 'unavailable', startTime: '', endTime: '', reason: '' });
  }

  function removeException(index: number) {
    setExceptions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);

    const weeklySchedule = days
      .filter((d) => d.active)
      .map(({ active: _a, ...rest }) => rest);

    const payload = {
      weeklySchedule,
      exceptions: exceptions.map((e) => ({
        ...e,
        date: new Date(e.date).toISOString(),
      })),
      bookingWindowDays,
      minNoticeHours,
    };

    try {
      const res = await fetch('/api/availability', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json() as { error?: string };
        setSaveError(data.error ?? 'Save failed');
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch {
      setSaveError('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Weekly schedule */}
      <div className="card p-5">
        <h2 className="mb-4 text-base font-normal text-text-primary">{t('weeklySchedule')}</h2>
        <div className="space-y-3">
          {days.map((day) => (
            <div key={day.dayOfWeek} className="flex flex-wrap items-center gap-3">
              {/* Day toggle + label */}
              <label className="flex w-20 shrink-0 cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={day.active}
                  onChange={(e) => updateDay(day.dayOfWeek, 'active', e.target.checked)}
                  className="form-checkbox"
                />
                <span className="text-sm text-text-primary">
                  {t(`days.${day.dayOfWeek}` as `days.${0 | 1 | 2 | 3 | 4 | 5 | 6}`)}
                </span>
              </label>

              {day.active && (
                <>
                  {/* Start time */}
                  <input
                    type="time"
                    value={day.startTime}
                    onChange={(e) => updateDay(day.dayOfWeek, 'startTime', e.target.value)}
                    className="form-field w-28"
                    aria-label={`${t(`days.${day.dayOfWeek}` as `days.${0 | 1 | 2 | 3 | 4 | 5 | 6}`)} start`}
                  />
                  <span className="text-text-muted">–</span>
                  {/* End time */}
                  <input
                    type="time"
                    value={day.endTime}
                    onChange={(e) => updateDay(day.dayOfWeek, 'endTime', e.target.value)}
                    className="form-field w-28"
                    aria-label={`${t(`days.${day.dayOfWeek}` as `days.${0 | 1 | 2 | 3 | 4 | 5 | 6}`)} end`}
                  />
                  {/* Session duration */}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={5}
                      max={240}
                      value={day.sessionDuration}
                      onChange={(e) =>
                        updateDay(day.dayOfWeek, 'sessionDuration', parseInt(e.target.value, 10) || 45)
                      }
                      className="form-field w-16"
                      aria-label={t('sessionDuration')}
                    />
                    <span className="text-xs text-text-muted">{t('sessionDuration')}</span>
                  </div>
                  {/* Break */}
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={0}
                      max={120}
                      value={day.breakBetween}
                      onChange={(e) =>
                        updateDay(day.dayOfWeek, 'breakBetween', parseInt(e.target.value, 10) || 0)
                      }
                      className="form-field w-16"
                      aria-label={t('breakBetween')}
                    />
                    <span className="text-xs text-text-muted">{t('breakBetween')}</span>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Booking settings */}
      <div className="card p-5">
        <h2 className="mb-4 text-base font-normal text-text-primary">{t('bookingWindow')}</h2>
        <div className="flex flex-wrap gap-6">
          <div className="flex flex-col gap-1">
            <label className="form-label">{t('bookingWindow')}</label>
            <input
              type="number"
              min={1}
              max={365}
              value={bookingWindowDays}
              onChange={(e) => setBookingWindowDays(parseInt(e.target.value, 10) || 60)}
              className="form-field w-24"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="form-label">{t('minNotice')}</label>
            <input
              type="number"
              min={0}
              max={168}
              value={minNoticeHours}
              onChange={(e) => setMinNoticeHours(parseInt(e.target.value, 10) || 24)}
              className="form-field w-24"
            />
          </div>
        </div>
      </div>

      {/* Exceptions */}
      <div className="card p-5">
        <h2 className="mb-4 text-base font-normal text-text-primary">{t('exceptions')}</h2>

        {/* Existing exceptions */}
        {exceptions.length > 0 && (
          <ul className="mb-4 space-y-2">
            {exceptions.map((ex, i) => (
              <li key={i} className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                <span className="font-mono text-text-primary">{ex.date}</span>
                <span className="text-text-muted">
                  {ex.type === 'unavailable' ? t('exceptionUnavailable') : t('exceptionSpecialHours')}
                </span>
                {ex.type === 'special_hours' && ex.startTime && ex.endTime && (
                  <span className="text-text-muted">
                    {ex.startTime}–{ex.endTime}
                  </span>
                )}
                {ex.reason && <span className="text-text-muted">{ex.reason}</span>}
                <button
                  onClick={() => removeException(i)}
                  className="ms-auto text-xs text-red-500 hover:underline"
                  aria-label="Remove exception"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add new exception */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="form-label">{t('addException')}</label>
            <input
              type="date"
              value={newException.date}
              onChange={(e) => setNewException((p) => ({ ...p, date: e.target.value }))}
              className="form-field w-36"
            />
          </div>
          <FormSelect
            value={newException.type}
            onChange={(v) =>
              setNewException((p) => ({ ...p, type: v as 'unavailable' | 'special_hours' }))
            }
            options={[
              { value: 'unavailable', label: t('exceptionUnavailable') },
              { value: 'special_hours', label: t('exceptionSpecialHours') },
            ]}
            className="w-40"
          />
          {newException.type === 'special_hours' && (
            <>
              <input
                type="time"
                value={newException.startTime ?? ''}
                onChange={(e) => setNewException((p) => ({ ...p, startTime: e.target.value }))}
                className="form-field w-28"
              />
              <span className="text-text-muted">–</span>
              <input
                type="time"
                value={newException.endTime ?? ''}
                onChange={(e) => setNewException((p) => ({ ...p, endTime: e.target.value }))}
                className="form-field w-28"
              />
            </>
          )}
          <input
            type="text"
            placeholder={t('exceptions')}
            value={newException.reason ?? ''}
            onChange={(e) => setNewException((p) => ({ ...p, reason: e.target.value }))}
            className="form-field w-40"
          />
          <button
            onClick={addException}
            disabled={!newException.date}
            className="rounded-lg bg-secondary px-3 py-2 text-sm text-white hover:bg-secondary/80 disabled:opacity-50"
          >
            +
          </button>
        </div>
      </div>

      {/* Save */}
      {saveError && (
        <p className="text-sm text-red-600" role="alert">
          {saveError}
        </p>
      )}
      {saveSuccess && (
        <p className="text-sm text-green-600" role="status">
          ✓
        </p>
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-normal text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark disabled:opacity-50"
      >
        {saving ? '...' : t('saveAvailability')}
      </button>
    </div>
  );
}
