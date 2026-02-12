import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import {
  format,
  addDays,
  addMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';

interface CalendarMiniCalendarProps {
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  appointments: any[];
}

export default function CalendarMiniCalendar({ currentDate, onDateSelect, appointments }: CalendarMiniCalendarProps) {
  const [miniCalendarDate, setMiniCalendarDate] = useState(new Date());

  const monthStart = startOfMonth(miniCalendarDate);
  const monthEnd = endOfMonth(miniCalendarDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const hasAppointments = (day: Date) => {
    return appointments.some((apt: any) => isSameDay(parseISO(apt.start_datetime), day));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">{format(miniCalendarDate, 'MMMM yyyy')}</h3>
        <div className="flex gap-1">
          <button
            onClick={() => setMiniCalendarDate(addMonths(miniCalendarDate, -1))}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMiniCalendarDate(addMonths(miniCalendarDate, 1))}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {['M', 'T', 'W', 'Th', 'F', 'Sa', 'Su'].map((day, index) => (
          <div key={index} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, miniCalendarDate);
          const isToday = isSameDay(day, new Date());
          const isSelected = isSameDay(day, currentDate);
          const hasApts = hasAppointments(day);

          return (
            <button
              key={index}
              onClick={() => {
                onDateSelect(day);
                setMiniCalendarDate(day);
              }}
              className={`relative text-center text-sm py-1.5 rounded cursor-pointer ${
                isSelected
                  ? 'bg-purple-600 text-white font-semibold'
                  : isToday
                  ? 'bg-purple-100 text-purple-600 font-semibold'
                  : isCurrentMonth
                  ? 'text-gray-900 hover:bg-gray-100'
                  : 'text-gray-400'
              }`}
            >
              {format(day, 'd')}
              {hasApts && !isSelected && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-purple-600 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
