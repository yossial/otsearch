'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import NewAppointmentModal from './NewAppointmentModal';
import type { AppointmentData, AvailabilityData } from './ScheduleTabs';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Props {
  appointments: AppointmentData[];
  activePatients: Patient[];
  initialWeekStart: string;
  availability: AvailabilityData;
  onAppointmentCreated: (appt: AppointmentData) => void;
  onAppointmentUpdated: (appt: AppointmentData) => void;
}

// Calendar display range: 07:00 – 21:00 in 30-min increments
const DISPLAY_START_HOUR = 7;
const DISPLAY_END_HOUR = 21;
const SLOT_MINUTES = 30;
const TOTAL_SLOTS = ((DISPLAY_END_HOUR - DISPLAY_START_HOUR) * 60) / SLOT_MINUTES; // 28

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 border-blue-400 text-blue-800',
  confirmed: 'bg-green-100 border-green-400 text-green-800',
  completed: 'bg-gray-100 border-gray-400 text-gray-700',
  cancelled: 'bg-red-100 border-red-400 text-red-700',
  'no-show': 'bg-amber-100 border-amber-400 text-amber-800',
};

function formatHour(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Convert "HH:MM" string to minutes-from-midnight */
function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Position of an appointment in the grid */
function getAppointmentPosition(startTime: string, endTime: string) {
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);

  const startMins = startDate.getUTCHours() * 60 + startDate.getUTCMinutes();
  const endMins = endDate.getUTCHours() * 60 + endDate.getUTCMinutes();

  const displayStartMins = DISPLAY_START_HOUR * 60;

  const top = ((startMins - displayStartMins) / SLOT_MINUTES) * 32; // 32px per slot
  const height = Math.max(((endMins - startMins) / SLOT_MINUTES) * 32, 28);

  return { top, height };
}

export default function AppointmentCalendar({
  appointments,
  activePatients,
  initialWeekStart,
  availability,
  onAppointmentCreated,
  onAppointmentUpdated,
}: Props) {
  const t = useTranslations('dashboard.schedule');
  const [weekStart, setWeekStart] = useState(new Date(initialWeekStart));
  const [showModal, setShowModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState<AppointmentData | null>(null);

  // Build the 7 days of the current week
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Group appointments by date string YYYY-MM-DD (UTC)
  const apptsByDay = useMemo(() => {
    const map: Record<string, AppointmentData[]> = {};
    for (const appt of appointments) {
      const d = new Date(appt.startTime).toISOString().slice(0, 10);
      if (!map[d]) map[d] = [];
      map[d]!.push(appt);
    }
    return map;
  }, [appointments]);

  function prevWeek() {
    setWeekStart((d) => addDays(d, -7));
  }

  function nextWeek() {
    setWeekStart((d) => addDays(d, 7));
  }

  const timeLabels = Array.from({ length: TOTAL_SLOTS }, (_, i) =>
    formatHour((DISPLAY_START_HOUR * 60) + i * SLOT_MINUTES)
  );

  function getDefaultDuration() {
    // Try to get from availability for today
    const today = new Date().getDay();
    const entry = availability.weeklySchedule.find((s) => s.dayOfWeek === today);
    return entry?.sessionDuration ?? 45;
  }

  async function updateStatus(appt: AppointmentData, status: string) {
    try {
      const res = await fetch(`/api/appointments/${appt._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = await res.json() as AppointmentData;
        onAppointmentUpdated(data);
        setSelectedAppt(null);
      }
    } catch {
      // silently fail; could show toast in production
    }
  }

  return (
    <div className="space-y-4">
      {/* Calendar header: week navigation + new appointment */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="rounded border border-border p-1.5 text-sm text-text-muted hover:bg-bg-alt"
            aria-label="Previous week"
          >
            ←
          </button>
          <span className="text-sm text-text-primary">
            {weekStart.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
            {' – '}
            {addDays(weekStart, 6).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <button
            onClick={nextWeek}
            className="rounded border border-border p-1.5 text-sm text-text-muted hover:bg-bg-alt"
            aria-label="Next week"
          >
            →
          </button>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-normal text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark"
        >
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
            <path d="M12 5v14M5 12h14" />
          </svg>
          {t('newAppointment')}
        </button>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <div className="min-w-[640px]">
          {/* Day headers */}
          <div className="grid border-b border-border" style={{ gridTemplateColumns: '52px repeat(7, 1fr)' }}>
            <div className="border-e border-border" />
            {weekDays.map((day) => {
              const isToday = day.toDateString() === new Date().toDateString();
              return (
                <div
                  key={day.toISOString()}
                  className={`border-e border-border px-2 py-2 text-center text-xs last:border-e-0 ${isToday ? 'bg-primary/5 font-medium text-primary' : 'text-text-muted'}`}
                >
                  <div>{t(`days.${day.getDay()}` as `days.${0 | 1 | 2 | 3 | 4 | 5 | 6}`)}</div>
                  <div className="text-base">{day.getDate()}</div>
                </div>
              );
            })}
          </div>

          {/* Time grid */}
          <div className="relative">
            {/* Time labels + grid rows */}
            {timeLabels.map((label, slotIdx) => (
              <div
                key={label}
                className="grid border-b border-border/50"
                style={{ gridTemplateColumns: '52px repeat(7, 1fr)', height: '32px' }}
              >
                <div className="border-e border-border px-1.5 py-0.5 text-right text-[10px] text-text-muted leading-none">
                  {slotIdx % 2 === 0 ? label : ''}
                </div>
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className="border-e border-border/50 last:border-e-0"
                  />
                ))}
              </div>
            ))}

            {/* Appointment blocks — absolutely positioned over the grid */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{ paddingInlineStart: '52px' }}
            >
              <div className="grid h-full" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
                {weekDays.map((day) => {
                  const dateStr = day.toISOString().slice(0, 10);
                  const dayAppts = apptsByDay[dateStr] ?? [];

                  return (
                    <div key={dateStr} className="relative">
                      {dayAppts.map((appt) => {
                        const startStr = new Date(appt.startTime)
                          .toISOString()
                          .slice(11, 16);
                        const endStr = new Date(appt.endTime)
                          .toISOString()
                          .slice(11, 16);

                        const startMins = timeToMins(startStr);
                        const endMins = timeToMins(endStr);
                        const displayStartMins = DISPLAY_START_HOUR * 60;

                        if (startMins < displayStartMins || startMins >= DISPLAY_END_HOUR * 60) {
                          return null;
                        }

                        const { top, height } = getAppointmentPosition(appt.startTime, appt.endTime);
                        const colorClass =
                          STATUS_COLORS[appt.status] ?? STATUS_COLORS['scheduled']!;

                        const patientName =
                          typeof appt.patientId === 'object'
                            ? `${appt.patientId.firstName} ${appt.patientId.lastName}`
                            : '';

                        return (
                          <button
                            key={appt._id}
                            className={`pointer-events-auto absolute inset-x-0.5 overflow-hidden rounded border px-1 py-0.5 text-left text-[10px] leading-tight ${colorClass}`}
                            style={{ top: `${top}px`, height: `${height}px` }}
                            onClick={() => setSelectedAppt(appt)}
                            title={`${patientName} ${startStr}–${endStr}`}
                          >
                            <span className="block truncate font-medium">{patientName}</span>
                            <span className="block truncate opacity-75">
                              {startStr}–{endStr}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* No appointments message */}
      {appointments.length === 0 && (
        <p className="py-6 text-center text-sm text-text-muted">{t('noAppointments')}</p>
      )}

      {/* Appointment detail panel */}
      {selectedAppt && (
        <div className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-normal text-text-primary">
              {typeof selectedAppt.patientId === 'object'
                ? `${selectedAppt.patientId.firstName} ${selectedAppt.patientId.lastName}`
                : ''}
            </h3>
            <button
              onClick={() => setSelectedAppt(null)}
              className="text-text-muted hover:text-text-primary"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-text-muted">
            {new Date(selectedAppt.startTime).toLocaleString('he-IL')}
            {' – '}
            {new Date(selectedAppt.endTime).toLocaleTimeString('he-IL', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
          <p className="mt-1 text-sm text-text-muted">
            {selectedAppt.type === 'in-person'
              ? t('typeInPerson')
              : selectedAppt.type === 'telehealth'
              ? t('typeTelehealth')
              : t('typeHomeVisit')}
            {selectedAppt.location && ` · ${selectedAppt.location}`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(['confirmed', 'completed', 'cancelled', 'no-show'] as const).map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(selectedAppt, s)}
                disabled={selectedAppt.status === s}
                className={`rounded-lg border px-3 py-1 text-xs disabled:opacity-40 ${STATUS_COLORS[s] ?? ''}`}
              >
                {t(`status${s.charAt(0).toUpperCase()}${s.slice(1).replace('-', '')}` as
                  | 'statusScheduled'
                  | 'statusConfirmed'
                  | 'statusCompleted'
                  | 'statusCancelled'
                  | 'statusNoShow'
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* New appointment modal */}
      {showModal && (
        <NewAppointmentModal
          patients={activePatients}
          defaultDuration={getDefaultDuration()}
          onClose={() => setShowModal(false)}
          onCreated={onAppointmentCreated}
        />
      )}
    </div>
  );
}
