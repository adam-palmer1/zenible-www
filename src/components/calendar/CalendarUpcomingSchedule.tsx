import React from 'react';
import {
  format,
  addDays,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import { getAppointmentKey } from './calendarUtils';

interface CalendarUpcomingScheduleProps {
  appointments: any[];
  onAppointmentClick: (appointment: any) => void;
  selectedDate?: Date | null;
}

export default function CalendarUpcomingSchedule({ appointments, onAppointmentClick, selectedDate }: CalendarUpcomingScheduleProps) {
  const showingSpecificDay = selectedDate && !isToday(selectedDate);

  const displayedAppointments = showingSpecificDay
    ? appointments
        .filter((apt: any) => isSameDay(parseISO(apt.start_datetime), selectedDate))
        .sort((a: any, b: any) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
    : appointments
        .filter((apt: any) => new Date(apt.start_datetime) >= new Date())
        .sort((a: any, b: any) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())
        .slice(0, 5);

  const heading = showingSpecificDay
    ? `Schedule for ${format(selectedDate, 'MMM d')}`
    : 'Upcoming Schedule';

  const emptyMessage = showingSpecificDay
    ? `No appointments on ${format(selectedDate, 'MMM d')}`
    : 'No upcoming appointments';

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
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{heading}</h3>

      <div className="space-y-3 overflow-y-auto flex-1 scrollbar-hide">
        {displayedAppointments.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">{emptyMessage}</p>
        ) : (
          displayedAppointments.map((appointment: any) => {
            const startDate = parseISO(appointment.start_datetime);
            return (
              <button
                key={getAppointmentKey(appointment)}
                onClick={() => onAppointmentClick(appointment)}
                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
              >
                <p className="text-sm font-medium text-gray-900 truncate">{appointment.title}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {showingSpecificDay ? format(startDate, 'h:mm a') : formatDateLabel(startDate)}
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
