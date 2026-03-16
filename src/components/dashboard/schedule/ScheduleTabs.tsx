'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import AppointmentCalendar from './AppointmentCalendar';
import AvailabilityForm from './AvailabilityForm';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
}

interface AppointmentPatient {
  _id: string;
  firstName: string;
  lastName: string;
}

export interface AppointmentData {
  _id: string;
  therapistId: string;
  patientId: AppointmentPatient;
  startTime: string;
  endTime: string;
  duration: number;
  type: string;
  status: string;
  location?: string;
  fee?: number;
}

interface ExceptionData {
  date: string;
  type: 'unavailable' | 'special_hours';
  startTime?: string;
  endTime?: string;
  reason?: string;
}

interface WeeklyScheduleEntry {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  sessionDuration: number;
  breakBetween: number;
}

export interface AvailabilityData {
  _id: string;
  therapistId: string;
  weeklySchedule: WeeklyScheduleEntry[];
  exceptions: ExceptionData[];
  bookingWindowDays: number;
  minNoticeHours: number;
}

interface Props {
  initialAvailability: AvailabilityData;
  initialAppointments: AppointmentData[];
  activePatients: Patient[];
  weekStart: string;
}

export default function ScheduleTabs({
  initialAvailability,
  initialAppointments,
  activePatients,
  weekStart,
}: Props) {
  const t = useTranslations('dashboard.schedule');
  const [activeTab, setActiveTab] = useState<'appointments' | 'availability'>('appointments');
  const [appointments, setAppointments] = useState<AppointmentData[]>(initialAppointments);

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-normal text-text-primary">{t('title')}</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="-mb-px flex gap-6" aria-label="Schedule tabs">
          <button
            onClick={() => setActiveTab('appointments')}
            className={`border-b-2 pb-2 text-sm transition-colors ${
              activeTab === 'appointments'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {t('appointmentsTab')}
          </button>
          <button
            onClick={() => setActiveTab('availability')}
            className={`border-b-2 pb-2 text-sm transition-colors ${
              activeTab === 'availability'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            {t('availabilityTab')}
          </button>
        </nav>
      </div>

      {/* Tab content */}
      {activeTab === 'appointments' ? (
        <AppointmentCalendar
          appointments={appointments}
          activePatients={activePatients}
          initialWeekStart={weekStart}
          availability={initialAvailability}
          onAppointmentCreated={(appt) => setAppointments((prev) => [...prev, appt])}
          onAppointmentUpdated={(updated) =>
            setAppointments((prev) =>
              prev.map((a) => (a._id === updated._id ? updated : a))
            )
          }
        />
      ) : (
        <AvailabilityForm initialAvailability={initialAvailability} />
      )}
    </div>
  );
}
