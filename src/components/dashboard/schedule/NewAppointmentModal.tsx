'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { AppointmentData } from './ScheduleTabs';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Props {
  patients: Patient[];
  defaultDate?: string;
  defaultStartTime?: string;
  defaultDuration?: number;
  onClose: () => void;
  onCreated: (appointment: AppointmentData) => void;
}

export default function NewAppointmentModal({
  patients,
  defaultDate,
  defaultStartTime,
  defaultDuration = 45,
  onClose,
  onCreated,
}: Props) {
  const t = useTranslations('dashboard.schedule');

  const today = new Date().toISOString().slice(0, 10);

  const [patientId, setPatientId] = useState('');
  const [date, setDate] = useState(defaultDate ?? today);
  const [startTime, setStartTime] = useState(defaultStartTime ?? '09:00');
  const [duration, setDuration] = useState(defaultDuration);
  const [type, setType] = useState<'in-person' | 'telehealth' | 'home-visit'>('in-person');
  const [location, setLocation] = useState('');
  const [fee, setFee] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function calcEndTime(start: string, mins: number): string {
    const [h, m] = start.split(':').map(Number);
    const total = (h ?? 0) * 60 + (m ?? 0) + mins;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientId) {
      setError(t('selectPatient'));
      return;
    }
    setSaving(true);
    setError('');

    const endTime = calcEndTime(startTime, duration);

    const payload = {
      patientId,
      startTime: `${date}T${startTime}:00.000Z`,
      endTime: `${date}T${endTime}:00.000Z`,
      type,
      location: location || undefined,
      fee: fee ? parseFloat(fee) : undefined,
      bookedBy: 'therapist',
    };

    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json() as { appointment?: AppointmentData; error?: string };

      if (!res.ok) {
        setError(data.error ?? 'Error creating appointment');
      } else if (data.appointment) {
        onCreated(data.appointment);
        onClose();
      }
    } catch {
      setError('Network error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-normal text-text-primary">{t('newAppointment')}</h2>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-primary"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-text-muted">{t('selectPatient')}</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              required
              className="input text-sm"
            >
              <option value="">{t('selectPatient')}</option>
              {patients.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-text-muted">
              {/* generic date label */}
              {date}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="input text-sm"
            />
          </div>

          {/* Start time + duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-text-muted">
                {startTime}
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="input text-sm"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-text-muted">{t('sessionDuration')}</label>
              <input
                type="number"
                min={5}
                max={240}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10) || 45)}
                className="input text-sm"
              />
            </div>
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-text-muted">{t('appointmentType')}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as typeof type)}
              className="input text-sm"
            >
              <option value="in-person">{t('typeInPerson')}</option>
              <option value="telehealth">{t('typeTelehealth')}</option>
              <option value="home-visit">{t('typeHomeVisit')}</option>
            </select>
          </div>

          {/* Location */}
          {(type === 'in-person' || type === 'home-visit') && (
            <div className="flex flex-col gap-1">
              <label className="text-sm text-text-muted">{t('location')}</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input text-sm"
              />
            </div>
          )}

          {/* Fee */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-text-muted">{t('fee')}</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="input text-sm"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-4 py-2 text-sm text-text-muted hover:bg-bg-alt"
            >
              ✕
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-white hover:bg-primary-dark disabled:opacity-50"
            >
              {saving ? '...' : t('newAppointment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
