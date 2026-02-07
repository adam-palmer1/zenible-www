import React, { useState, useEffect, useRef } from 'react';
import { LockClosedIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import {
  format,
  addDays,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';
import { getAppointmentKey } from './calendarUtils';

interface CalendarMonthViewProps {
  currentDate: Date;
  appointments: any[];
  onAppointmentClick: (appointment: any) => void;
  onNewAppointment: (date: Date | null, time?: { hour: number; minute: number } | null) => void;
  getAppointmentColor: (appointment: any) => string;
  isRecurringAppointment: (appointments: any[], appointmentId: any) => boolean;
  isAppointmentReadOnly: (appointment: any) => boolean;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
}

export default function CalendarMonthView({ currentDate, appointments, onAppointmentClick, onNewAppointment, getAppointmentColor, isRecurringAppointment, isAppointmentReadOnly, getStatusColor, getStatusLabel }: CalendarMonthViewProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [maxVisibleAppointments, setMaxVisibleAppointments] = useState(3);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    days.push(day);
    day = addDays(day, 1);
  }

  const numWeeks = Math.ceil(days.length / 7);

  useEffect(() => {
    const calculateMaxAppointments = () => {
      if (!gridRef.current) return;

      const gridHeight = gridRef.current.clientHeight;
      const cellHeight = gridHeight / numWeeks;

      const appointmentHeight = 20;
      const reservedHeight = 56;

      const availableHeight = cellHeight - reservedHeight;
      const maxAppts = Math.max(0, Math.floor(availableHeight / appointmentHeight));

      setMaxVisibleAppointments(maxAppts);
    };

    calculateMaxAppointments();

    const resizeObserver = new ResizeObserver(calculateMaxAppointments);
    if (gridRef.current) {
      resizeObserver.observe(gridRef.current);
    }

    return () => resizeObserver.disconnect();
  }, [numWeeks]);

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt: any) => {
      const aptDate = parseISO(apt.start_datetime);
      return isSameDay(aptDate, day);
    });
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="grid grid-cols-7 border-b border-gray-200 flex-shrink-0 pr-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>

      <div ref={gridRef} className="flex-1 overflow-y-auto scrollbar-hover">
        <div className="grid grid-cols-7 h-full" style={{ gridTemplateRows: 'repeat(auto-fit, minmax(0, 1fr))' }}>
        {days.map((day, index) => {
          const dayAppointments = getAppointmentsForDay(day);
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          const visibleAppointments = dayAppointments.slice(0, maxVisibleAppointments);
          const hiddenCount = dayAppointments.length - visibleAppointments.length;

          return (
            <div
              key={index}
              onClick={() => onNewAppointment(day)}
              className={`border-r border-b border-gray-200 p-2 cursor-pointer hover:bg-gray-50 overflow-hidden ${
                !isCurrentMonth ? 'bg-gray-50' : ''
              } ${isToday ? 'bg-purple-50' : ''}`}
            >
              <div className={`text-sm font-medium mb-1 ${
                !isCurrentMonth ? 'text-gray-400' : isToday ? 'text-purple-600' : 'text-gray-900'
              }`}>
                {format(day, 'd')}
              </div>
              <div className="space-y-1">
                {visibleAppointments.map((apt: any) => {
                  const color = getAppointmentColor(apt);
                  const isRecurring = isRecurringAppointment(appointments, apt.id);
                  const isReadOnly = isAppointmentReadOnly(apt);

                  return (
                    <div
                      key={getAppointmentKey(apt)}
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onAppointmentClick(apt);
                      }}
                      className={`text-xs text-white px-1 py-0.5 rounded cursor-pointer ${
                        isReadOnly
                          ? 'opacity-50'
                          : 'hover:brightness-110'
                      }`}
                      style={{ backgroundColor: color }}
                      title={isReadOnly ? 'Read-only (imported from secondary calendar)' : (apt.contact ? `Contact: ${apt.contact.name}` : '')}
                    >
                      <div className="flex items-center gap-1 truncate">
                        {isReadOnly && <LockClosedIcon className="w-3 h-3 flex-shrink-0" />}
                        {isRecurring && <ArrowPathIcon className="w-3 h-3 flex-shrink-0" />}
                        <span className="truncate">{format(parseISO(apt.start_datetime), 'h:mm a')} {apt.title}</span>
                        {apt.status && apt.status !== 'scheduled' && (
                          <span
                            className="text-[10px] px-1 py-0.5 rounded bg-white bg-opacity-90 flex-shrink-0"
                            style={{ color: getStatusColor(apt.status) }}
                            title={getStatusLabel(apt.status)}
                          >
                            {getStatusLabel(apt.status)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                {hiddenCount > 0 && (
                  <div className="text-xs text-gray-500">
                    {visibleAppointments.length === 0
                      ? `${dayAppointments.length} Appointment${dayAppointments.length > 1 ? 's' : ''}`
                      : `+${hiddenCount} more`
                    }
                  </div>
                )}
              </div>
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
