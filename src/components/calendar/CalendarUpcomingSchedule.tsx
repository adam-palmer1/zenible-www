import React from 'react';
import {
  format,
  addDays,
  isSameDay,
  isSameWeek,
  isSameMonth,
  isToday,
  parseISO,
} from 'date-fns';
import { getAppointmentKey } from './calendarUtils';

interface CalendarUpcomingScheduleProps {
  appointments: any[];
  onAppointmentClick: (appointment: any) => void;
  selectedDate?: Date | null;
  viewMode?: string;
  currentDate?: Date;
}

export default function CalendarUpcomingSchedule({ appointments, onAppointmentClick, selectedDate, viewMode, currentDate }: CalendarUpcomingScheduleProps) {
  const showingSpecificDay = selectedDate && !isToday(selectedDate);

  let displayedAppointments: any[];
  let heading: string;
  let emptyMessage: string;

  if (showingSpecificDay) {
    // Clicked a specific day on the mini calendar
    displayedAppointments = appointments
      .filter((apt: any) => isSameDay(parseISO(apt.start_datetime), selectedDate))
      .sort((a: any, b: any) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
    heading = `Schedule for ${format(selectedDate, 'MMM d')}`;
    emptyMessage = `No appointments on ${format(selectedDate, 'MMM d')}`;
  } else if (viewMode === 'weekly' && currentDate) {
    displayedAppointments = appointments
      .filter((apt: any) => {
        const aptDate = parseISO(apt.start_datetime);
        return isSameWeek(aptDate, currentDate, { weekStartsOn: 1 });
      })
      .sort((a: any, b: any) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
    heading = `Schedule for this week`;
    emptyMessage = 'No appointments this week';
  } else if (viewMode === 'monthly' && currentDate) {
    displayedAppointments = appointments
      .filter((apt: any) => isSameMonth(parseISO(apt.start_datetime), currentDate))
      .sort((a: any, b: any) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
    heading = `Schedule for ${format(currentDate, 'MMMM')}`;
    emptyMessage = `No appointments in ${format(currentDate, 'MMMM')}`;
  } else {
    // Daily view or default: show today's schedule
    const refDate = currentDate || new Date();
    displayedAppointments = appointments
      .filter((apt: any) => isSameDay(parseISO(apt.start_datetime), refDate))
      .sort((a: any, b: any) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
    heading = isToday(refDate)
      ? "Today's Schedule"
      : `Schedule for ${format(refDate, 'MMM d')}`;
    emptyMessage = isToday(refDate)
      ? 'No appointments today'
      : `No appointments on ${format(refDate, 'MMM d')}`;
  }

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

  const showFullDate = viewMode === 'weekly' || viewMode === 'monthly';

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
                  {showFullDate ? formatDateLabel(startDate) : format(startDate, 'h:mm a')}
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
