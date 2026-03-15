'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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
const SLOT_HEIGHT = 32; // px per slot
const TOTAL_SLOTS = ((DISPLAY_END_HOUR - DISPLAY_START_HOUR) * 60) / SLOT_MINUTES; // 28
const TIME_COL_WIDTH = 52; // px

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

function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function getAppointmentPosition(startTime: string, endTime: string) {
  const startDate = new Date(startTime);
  const endDate = new Date(endTime);
  const startMins = startDate.getUTCHours() * 60 + startDate.getUTCMinutes();
  const endMins = endDate.getUTCHours() * 60 + endDate.getUTCMinutes();
  const displayStartMins = DISPLAY_START_HOUR * 60;
  const top = ((startMins - displayStartMins) / SLOT_MINUTES) * SLOT_HEIGHT;
  const height = Math.max(((endMins - startMins) / SLOT_MINUTES) * SLOT_HEIGHT, 28);
  return { top, height };
}

/** Returns px offset from top of grid for a given local time */
function getCurrentTimePx(now: Date): number {
  const mins = now.getHours() * 60 + now.getMinutes();
  const displayStartMins = DISPLAY_START_HOUR * 60;
  return ((mins - displayStartMins) / SLOT_MINUTES) * SLOT_HEIGHT;
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
  const [modalDate, setModalDate] = useState<string | undefined>(undefined);
  const [modalTime, setModalTime] = useState<string | undefined>(undefined);
  const [now, setNow] = useState(() => new Date());

  const scrollRef = useRef<HTMLDivElement>(null);

  // Build the 7 days of the current week
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );

  // Update current time every minute
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const timePx = getCurrentTimePx(new Date());
    const scrollTarget = Math.max(0, timePx - 100);
    scrollRef.current.scrollTop = scrollTarget;
  }, []); // intentionally run once on mount

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

  // Build off-hours map: offHours[dayOfWeek][slotIdx] = true means shaded
  const offHoursMap = useMemo(() => {
    const map: Record<number, boolean[]> = {};
    for (let dow = 0; dow <= 6; dow++) {
      const entry = availability.weeklySchedule.find((s) => s.dayOfWeek === dow);
      const slots: boolean[] = [];
      for (let i = 0; i < TOTAL_SLOTS; i++) {
        const slotStartMins = DISPLAY_START_HOUR * 60 + i * SLOT_MINUTES;
        if (!entry) {
          slots.push(true);
        } else {
          const workStart = timeToMins(entry.startTime);
          const workEnd = timeToMins(entry.endTime);
          slots.push(slotStartMins < workStart || slotStartMins >= workEnd);
        }
      }
      map[dow] = slots;
    }
    return map;
  }, [availability.weeklySchedule]);

  // Does the current week contain today?
  const weekContainsToday = useMemo(() => {
    const todayStr = now.toDateString();
    return weekDays.some((d) => d.toDateString() === todayStr);
  }, [weekDays, now]);

  const currentTimePx = useMemo(() => getCurrentTimePx(now), [now]);

  const prevWeek = useCallback(() => setWeekStart((d) => addDays(d, -7)), []);
  const nextWeek = useCallback(() => setWeekStart((d) => addDays(d, 7)), []);
  const goToToday = useCallback(() => {
    const today = new Date();
    // Find the start of current week (Sunday)
    const day = today.getDay();
    const start = new Date(today);
    start.setDate(today.getDate() - day);
    start.setHours(0, 0, 0, 0);
    setWeekStart(start);
  }, []);

  const timeLabels = useMemo(
    () =>
      Array.from({ length: TOTAL_SLOTS }, (_, i) =>
        formatHour(DISPLAY_START_HOUR * 60 + i * SLOT_MINUTES)
      ),
    []
  );

  function getDefaultDuration(dayOfWeek: number): number {
    const entry = availability.weeklySchedule.find((s) => s.dayOfWeek === dayOfWeek);
    return entry?.sessionDuration ?? 45;
  }

  const handleCellClick = useCallback(
    (day: Date, slotIdx: number) => {
      const dateStr = day.toISOString().slice(0, 10);
      const slotStartMins = DISPLAY_START_HOUR * 60 + slotIdx * SLOT_MINUTES;
      const timeStr = formatHour(slotStartMins);
      setModalDate(dateStr);
      setModalTime(timeStr);
      setShowModal(true);
    },
    []
  );

  async function updateStatus(appt: AppointmentData, status: string) {
    try {
      const res = await fetch(`/api/appointments/${appt._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const data = (await res.json()) as AppointmentData;
        onAppointmentUpdated(data);
        setSelectedAppt(null);
      }
    } catch {
      // silently fail
    }
  }

  const todayStr = now.toDateString();

  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Prev week */}
          <button
            onClick={prevWeek}
            className="rounded border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-alt"
            aria-label="Previous week"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <span className="text-sm font-medium text-text-primary">
            {weekStart.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
            {' – '}
            {addDays(weekStart, 6).toLocaleDateString('he-IL', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>

          {/* Next week */}
          <button
            onClick={nextWeek}
            className="rounded border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-alt"
            aria-label="Next week"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>

          {/* Today button */}
          <button
            onClick={goToToday}
            className="rounded border border-border px-3 py-2 text-sm text-text-muted hover:bg-bg-alt"
          >
            {t('today')}
          </button>
        </div>

        <button
          onClick={() => {
            setModalDate(undefined);
            setModalTime(undefined);
            setShowModal(true);
          }}
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

      {/* No appointments hint — shown above grid, centered */}
      {appointments.length === 0 && (
        <p className="text-center text-xs text-text-muted">
          {t('noAppointments')}
        </p>
      )}

      {/* Calendar grid */}
      <div className="overflow-x-auto rounded-xl border border-border bg-white">
        <div className="min-w-[640px]">
          {/* Day headers */}
          <div
            className="grid border-b border-border"
            style={{ gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(7, 1fr)` }}
          >
            <div className="border-e border-border" />
            {weekDays.map((day) => {
              const isToday = day.toDateString() === todayStr;
              return (
                <div
                  key={day.toISOString()}
                  className={`border-e border-border px-2 py-2 text-center text-xs last:border-e-0 ${
                    isToday
                      ? 'bg-blue-50/40 font-medium text-primary'
                      : 'text-text-muted'
                  }`}
                >
                  <div>
                    {t(`days.${day.getDay()}` as `days.${0 | 1 | 2 | 3 | 4 | 5 | 6}`)}
                  </div>
                  <div className="text-base">{day.getDate()}</div>
                </div>
              );
            })}
          </div>

          {/* Scrollable time grid */}
          <div
            ref={scrollRef}
            className="relative overflow-y-auto"
            style={{ maxHeight: '600px' }}
          >
            {/* Inner grid container — relative so the current-time line can be positioned inside */}
            <div className="relative">
              {/* Time slot rows */}
              {timeLabels.map((label, slotIdx) => {
                const isHourBoundary = slotIdx % 2 === 0;
                return (
                  <div
                    key={label}
                    className={`grid ${
                      isHourBoundary
                        ? 'border-b border-border/60'
                        : 'border-b border-border/25'
                    }`}
                    style={{
                      gridTemplateColumns: `${TIME_COL_WIDTH}px repeat(7, 1fr)`,
                      height: `${SLOT_HEIGHT}px`,
                    }}
                  >
                    {/* Time label */}
                    <div className="border-e border-border px-1.5 py-0.5 text-right text-[10px] text-text-muted leading-none">
                      {isHourBoundary ? label : ''}
                    </div>

                    {/* Day cells */}
                    {weekDays.map((day) => {
                      const dow = day.getDay();
                      const isToday = day.toDateString() === todayStr;
                      const isOffHours = offHoursMap[dow]?.[slotIdx] ?? true;

                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          onClick={() => handleCellClick(day, slotIdx)}
                          className={[
                            'border-e border-border/50 last:border-e-0 w-full h-full text-left',
                            'hover:bg-primary/5 cursor-pointer',
                            isToday ? 'bg-blue-50/40' : '',
                            isOffHours && !isToday ? 'bg-gray-50' : '',
                            isOffHours && isToday ? 'bg-blue-50/20' : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          aria-label={`${day.toLocaleDateString('he-IL')} ${label}`}
                        />
                      );
                    })}
                  </div>
                );
              })}

              {/* Current time indicator */}
              {weekContainsToday && (
                <div
                  className="pointer-events-none absolute z-10 flex items-center"
                  style={{
                    top: `${currentTimePx}px`,
                    insetInlineStart: `${TIME_COL_WIDTH}px`,
                    insetInlineEnd: '0',
                  }}
                >
                  {/* Circle at start of line */}
                  <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" style={{ marginInlineStart: '-5px' }} />
                  {/* Line */}
                  <div className="h-px flex-1 bg-red-500" />
                </div>
              )}

              {/* Appointment blocks — absolutely positioned over the grid */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{ paddingInlineStart: `${TIME_COL_WIDTH}px` }}
              >
                <div
                  className="grid h-full"
                  style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}
                >
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

                          if (
                            startMins < DISPLAY_START_HOUR * 60 ||
                            startMins >= DISPLAY_END_HOUR * 60
                          ) {
                            return null;
                          }

                          const { top, height } = getAppointmentPosition(
                            appt.startTime,
                            appt.endTime
                          );
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
                              <span className="block truncate font-medium">
                                {patientName}
                              </span>
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
      </div>

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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
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
                {t(
                  `status${s.charAt(0).toUpperCase()}${s.slice(1).replace('-', '')}` as
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
          defaultDate={modalDate}
          defaultStartTime={modalTime}
          defaultDuration={getDefaultDuration(
            modalDate ? new Date(modalDate).getDay() : new Date().getDay()
          )}
          onClose={() => {
            setShowModal(false);
            setModalDate(undefined);
            setModalTime(undefined);
          }}
          onCreated={onAppointmentCreated}
        />
      )}
    </div>
  );
}
