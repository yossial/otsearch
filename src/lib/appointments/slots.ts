import type { WeeklyScheduleEntry, AvailabilityException } from '@/lib/db/models/TherapistAvailability';

export interface SlotTime {
  startTime: string;
  endTime: string;
  available: boolean;
}

interface ExistingAppointment {
  startTime: Date;
  endTime: Date;
}

/** Parse "HH:MM" into minutes since midnight */
function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Format minutes since midnight as "HH:MM" */
function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Calculate available time slots for a given date.
 *
 * @param weeklySchedule - The therapist's weekly schedule entries.
 * @param exceptions     - Date-level exceptions (unavailable / special_hours).
 * @param existingAppointments - Already-booked appointments for the requested date.
 * @param date           - The date to calculate slots for (only date portion is used).
 * @returns Array of slot objects with availability flags.
 */
export function calculateSlots(
  weeklySchedule: WeeklyScheduleEntry[],
  exceptions: AvailabilityException[],
  existingAppointments: ExistingAppointment[],
  date: Date
): SlotTime[] {
  const dateStr = date.toISOString().slice(0, 10); // YYYY-MM-DD

  // Check for an exception on this exact date
  const exception = exceptions.find((e) => {
    const exDate = e.date instanceof Date ? e.date : new Date(e.date);
    return exDate.toISOString().slice(0, 10) === dateStr;
  });

  if (exception?.type === 'unavailable') {
    return [];
  }

  // Determine start/end/duration from exception or weekly schedule
  const dayOfWeek = date.getDay(); // 0=Sunday, 6=Saturday

  let scheduleEntry: { startTime: string; endTime: string; sessionDuration: number; breakBetween: number } | null =
    null;

  if (exception?.type === 'special_hours' && exception.startTime && exception.endTime) {
    // Use the exception's special hours with fallback session settings from weekly schedule
    const weekly = weeklySchedule.find((s) => s.dayOfWeek === dayOfWeek);
    scheduleEntry = {
      startTime: exception.startTime,
      endTime: exception.endTime,
      sessionDuration: weekly?.sessionDuration ?? 45,
      breakBetween: weekly?.breakBetween ?? 0,
    };
  } else {
    const weekly = weeklySchedule.find((s) => s.dayOfWeek === dayOfWeek);
    if (!weekly) return [];
    scheduleEntry = weekly;
  }

  const slotStart = parseTime(scheduleEntry.startTime);
  const slotEnd = parseTime(scheduleEntry.endTime);
  const duration = scheduleEntry.sessionDuration;
  const breakTime = scheduleEntry.breakBetween;
  const step = duration + breakTime;

  if (duration <= 0 || step <= 0 || slotStart >= slotEnd) return [];

  const slots: SlotTime[] = [];

  for (let start = slotStart; start + duration <= slotEnd; start += step) {
    const end = start + duration;
    const startStr = formatTime(start);
    const endStr = formatTime(end);

    // Build Date objects for overlap check using UTC to avoid local timezone shifts
    const dayUTCMs = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    );
    const slotStartDate = new Date(dayUTCMs + start * 60000);
    const slotEndDate = new Date(dayUTCMs + end * 60000);

    // Check overlap: newStart < existingEnd && newEnd > existingStart
    const hasOverlap = existingAppointments.some((appt) => {
      const apptStart = appt.startTime instanceof Date ? appt.startTime : new Date(appt.startTime);
      const apptEnd = appt.endTime instanceof Date ? appt.endTime : new Date(appt.endTime);
      return slotStartDate < apptEnd && slotEndDate > apptStart;
    });

    slots.push({ startTime: startStr, endTime: endStr, available: !hasOverlap });
  }

  return slots;
}
