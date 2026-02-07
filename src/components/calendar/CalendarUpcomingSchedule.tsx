import React from 'react';
import {
  format,
  addDays,
  isSameDay,
  parseISO,
} from 'date-fns';
import { getAppointmentKey } from './calendarUtils';

interface CalendarUpcomingScheduleProps {
  appointments: any[];
  onAppointmentClick: (appointment: any) => void;
}

export default function CalendarUpcomingSchedule({ appointments, onAppointmentClick }: CalendarUpcomingScheduleProps) {
  const upcomingAppointments = appointments
    .filter((apt: any) => new Date(apt.start_datetime) >= new Date())
    .sort((a: any, b: any) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
    .slice(0, 20);

  const formatDateLabel = (date: Date) => {
    const today = new Date();
    const tomorrow = addDays(today, 1);

    if (isSameDay(date, today)) {
      return `Today, ${format(date, 'h:mm a')}`;
    } else if (isSameDay(date, tomorrow)) {
      return `Tomorrow, ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, h:mm a');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 flex-1 overflow-hidden flex flex-col">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">Upcoming Schedule</h3>

      <div className="space-y-3 overflow-y-auto flex-1 scrollbar-hide">
        {upcomingAppointments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">No upcoming appointments</p>
        ) : (
          upcomingAppointments.map((appointment: any) => {
            const startDate = parseISO(appointment.start_datetime);
            return (
              <button
                key={getAppointmentKey(appointment)}
                onClick={() => onAppointmentClick(appointment)}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <p className="text-sm font-medium text-gray-900 truncate">{appointment.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDateLabel(startDate)}
                </p>
                {appointment.location && (
                  <p className="text-xs text-gray-400 mt-1 truncate">{appointment.location}</p>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
