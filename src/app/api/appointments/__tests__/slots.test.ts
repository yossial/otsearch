import { describe, it, expect } from 'vitest';
import { calculateSlots } from '@/lib/appointments/slots';
import type { WeeklyScheduleEntry, AvailabilityException } from '@/lib/db/models/TherapistAvailability';

// Sunday 2026-03-15 → dayOfWeek = 0
const SUNDAY = new Date('2026-03-15T00:00:00.000Z');

const baseSchedule: WeeklyScheduleEntry[] = [
  {
    dayOfWeek: 0, // Sunday
    startTime: '09:00',
    endTime: '12:00',
    sessionDuration: 60,
    breakBetween: 0,
  },
];

describe('calculateSlots', () => {
  it('returns empty array when no availability for that day', () => {
    // dayOfWeek=1 (Monday) not in schedule
    const monday = new Date('2026-03-16T00:00:00.000Z');
    const slots = calculateSlots(baseSchedule, [], [], monday);
    expect(slots).toHaveLength(0);
  });

  it('returns correct slots for a day with availability and no existing appointments', () => {
    const slots = calculateSlots(baseSchedule, [], [], SUNDAY);
    // 09:00–12:00 with 60-min sessions, no break → 3 slots
    expect(slots).toHaveLength(3);
    expect(slots[0]).toEqual({ startTime: '09:00', endTime: '10:00', available: true });
    expect(slots[1]).toEqual({ startTime: '10:00', endTime: '11:00', available: true });
    expect(slots[2]).toEqual({ startTime: '11:00', endTime: '12:00', available: true });
  });

  it('marks slot as unavailable when an appointment exists in that slot', () => {
    const existingAppointments = [
      {
        startTime: new Date('2026-03-15T08:00:00.000Z'), // 10:00 IL (UTC+2 during summer → but we use UTC here)
        endTime: new Date('2026-03-15T08:59:00.000Z'),
      },
    ];

    // Use a schedule where we can test overlap precisely with UTC dates
    const scheduleUTC: WeeklyScheduleEntry[] = [
      {
        dayOfWeek: 0,
        startTime: '08:00',
        endTime: '11:00',
        sessionDuration: 60,
        breakBetween: 0,
      },
    ];

    const slots = calculateSlots(scheduleUTC, [], existingAppointments, SUNDAY);
    // Slots: 08:00–09:00, 09:00–10:00, 10:00–11:00
    expect(slots).toHaveLength(3);
    // First slot 08:00–09:00 overlaps with appointment 08:00–08:59
    expect(slots[0]!.available).toBe(false);
    expect(slots[1]!.available).toBe(true);
    expect(slots[2]!.available).toBe(true);
  });

  it('handles exception date of type unavailable → returns no slots', () => {
    const exceptions: AvailabilityException[] = [
      {
        date: new Date('2026-03-15T00:00:00.000Z'),
        type: 'unavailable',
      },
    ];
    const slots = calculateSlots(baseSchedule, exceptions, [], SUNDAY);
    expect(slots).toHaveLength(0);
  });

  it('handles special_hours exception — uses exception times instead of weekly schedule', () => {
    const exceptions: AvailabilityException[] = [
      {
        date: new Date('2026-03-15T00:00:00.000Z'),
        type: 'special_hours',
        startTime: '14:00',
        endTime: '16:00',
      },
    ];
    const slots = calculateSlots(baseSchedule, exceptions, [], SUNDAY);
    // 14:00–16:00 with 60-min sessions → 2 slots
    expect(slots).toHaveLength(2);
    expect(slots[0]).toEqual({ startTime: '14:00', endTime: '15:00', available: true });
    expect(slots[1]).toEqual({ startTime: '15:00', endTime: '16:00', available: true });
  });

  it('handles break between sessions correctly', () => {
    const scheduleWithBreak: WeeklyScheduleEntry[] = [
      {
        dayOfWeek: 0,
        startTime: '09:00',
        endTime: '12:00',
        sessionDuration: 45,
        breakBetween: 15,
      },
    ];
    const slots = calculateSlots(scheduleWithBreak, [], [], SUNDAY);
    // step = 45+15 = 60 min. 09:00–12:00 = 180 min → 3 slots
    expect(slots).toHaveLength(3);
    expect(slots[0]).toEqual({ startTime: '09:00', endTime: '09:45', available: true });
    expect(slots[1]).toEqual({ startTime: '10:00', endTime: '10:45', available: true });
    expect(slots[2]).toEqual({ startTime: '11:00', endTime: '11:45', available: true });
  });
});
