import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LockClosedIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import {
  format,
  isSameDay,
  parseISO,
  getHours,
  getMinutes,
  startOfDay,
} from 'date-fns';
import { getAppointmentKey, formatHour, calculateAppointmentLayout, getEffectiveEndDate } from './calendarUtils';

interface CalendarDayViewProps {
  currentDate: Date;
  appointments: any[];
  timeSlots: number[];
  onAppointmentClick: (appointment: any) => void;
  onNewAppointment: (date: Date | null, time?: { hour: number; minute: number } | null) => void;
  onDragStart: (appointment: any, event: React.DragEvent) => void;
  onDragOver: (day: Date, event: React.DragEvent, timeSlots: number[]) => void;
  onDrop: (day: Date, event: React.DragEvent, timeSlots: number[]) => void;
  onDragEnd: () => void;
  draggingAppointment: any;
  dragPreview: any;
  getAppointmentColor: (appointment: any) => string;
  isRecurringAppointment: (appointments: any[], appointmentId: any) => boolean;
  isAppointmentReadOnly: (appointment: any) => boolean;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
}

export default function CalendarDayView({ currentDate, appointments, timeSlots, onAppointmentClick, onNewAppointment, onDragStart, onDragOver, onDrop, onDragEnd, draggingAppointment, dragPreview, getAppointmentColor, isRecurringAppointment, isAppointmentReadOnly, getStatusColor, getStatusLabel }: CalendarDayViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [appointmentsBelow, setAppointmentsBelow] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const previousHour = Math.max(0, new Date().getHours() - 1);
      const scrollPosition = previousHour * 64;
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, []);

  const dayAppointments = useMemo(() => {
    return appointments.filter((apt: any) => {
      const aptDate = parseISO(apt.start_datetime);
      if (!isSameDay(aptDate, currentDate)) return false;
      if (apt.all_day) return false;
      // Exclude multi-day timed events (they're in the all-day row)
      const aptStartDay = startOfDay(parseISO(apt.start_datetime));
      const effectiveEnd = getEffectiveEndDate(apt.end_datetime, parseISO);
      const aptEndDay = startOfDay(effectiveEnd);
      if (aptEndDay.getTime() > aptStartDay.getTime()) return false;
      return true;
    });
  }, [appointments, currentDate]);

  useEffect(() => {
    const checkAppointmentsBelow = () => {
      if (!scrollContainerRef.current) return;

      const container = scrollContainerRef.current;
      const visibleBottom = container.scrollTop + container.clientHeight;
      const totalHeight = container.scrollHeight;

      const notAtBottom = visibleBottom < totalHeight - 10;

      if (!notAtBottom) {
        setAppointmentsBelow([]);
        return;
      }

      const below = dayAppointments.filter((apt: any) => {
        const startDate = parseISO(apt.start_datetime);
        const startHour = getHours(startDate);
        const startMinute = getMinutes(startDate);
        const appointmentTop = startHour * 64 + (startMinute / 60) * 64;
        return appointmentTop > visibleBottom - 32;
      });

      setAppointmentsBelow(below);
    };

    checkAppointmentsBelow();

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkAppointmentsBelow);
      return () => container.removeEventListener('scroll', checkAppointmentsBelow);
    }
  }, [dayAppointments]);

  const allDayAppointments = appointments.filter((apt: any) => {
    if (!apt.all_day) return false;
    const aptStart = startOfDay(parseISO(apt.start_datetime));
    // All-day events store inclusive end dates; skip getEffectiveEndDate
    const aptEnd = startOfDay(parseISO(apt.end_datetime));
    const current = startOfDay(currentDate);
    return current >= aptStart && current <= aptEnd;
  });

  const multiDayTimedAppointments = appointments.filter((apt: any) => {
    if (apt.all_day) return false;
    const aptStart = startOfDay(parseISO(apt.start_datetime));
    const effectiveEnd = getEffectiveEndDate(apt.end_datetime, parseISO);
    const aptEnd = startOfDay(effectiveEnd);
    if (aptEnd.getTime() <= aptStart.getTime()) return false; // not multi-day
    const current = startOfDay(currentDate);
    return current >= aptStart && current <= aptEnd;
  });

  const allDayRowAppointments = [...allDayAppointments, ...multiDayTimedAppointments];

  const appointmentsWithLayout = calculateAppointmentLayout(dayAppointments, parseISO, getHours, getMinutes);

  return (
    <div className="h-full relative">
      <div ref={scrollContainerRef} className="h-full overflow-y-scroll overflow-x-hidden custom-scrollbar">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          {/* Date bar */}
          <div className="flex">
            <div className="w-24 flex-shrink-0 border-r border-gray-200"></div>
            <div className="flex-1 min-h-16 flex items-center justify-center bg-purple-100 py-2">
              <span className="text-lg font-semibold text-purple-600">
                {format(currentDate, 'EEEE, MMMM d')}
              </span>
            </div>
          </div>

          {/* All Day row */}
          {allDayRowAppointments.length > 0 && (
            <div className="flex border-t border-gray-200">
              <div className="w-24 flex-shrink-0 border-r border-gray-200 flex items-center justify-center">
                <span className="text-xs font-medium text-gray-500">All Day</span>
              </div>
              <div className="flex-1 px-4 py-2 space-y-1">
                {allDayRowAppointments.map((apt: any) => {
                  const color = getAppointmentColor(apt);
                  const isRecurring = isRecurringAppointment(appointments, apt.id);
                  const isReadOnly = isAppointmentReadOnly(apt);
                  return (
                    <div
                      key={getAppointmentKey(apt)}
                      onClick={() => onAppointmentClick(apt)}
                      className={`text-white text-sm px-2 py-1 rounded ${
                        isReadOnly
                          ? 'cursor-default'
                          : 'cursor-pointer hover:brightness-110'
                      }`}
                      style={{ backgroundColor: color, opacity: isReadOnly ? 0.5 : 0.9 }}
                      title={isReadOnly ? 'Read-only (imported from secondary calendar)' : (apt.contact ? `Contact: ${apt.contact.name}` : '')}
                    >
                      <div className="flex items-center gap-1 font-medium">
                        {isReadOnly && <LockClosedIcon className="w-4 h-4 flex-shrink-0" />}
                        {isRecurring && <ArrowPathIcon className="w-4 h-4 flex-shrink-0" />}
                        <span>{apt.title}</span>
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
              </div>
            </div>
          )}
        </div>

        <div className="flex">
          <div className="w-24 flex-shrink-0 border-r border-gray-200">
            {timeSlots.map((hour: number) => (
              <div key={hour} className="h-16 border-b border-gray-200 px-3 py-2">
                <span className="text-sm text-gray-500">
                  {formatHour(hour)}
                </span>
              </div>
            ))}
          </div>

          <div
            className="flex-1 relative"
            onDragOver={(e: React.DragEvent) => onDragOver(currentDate, e, timeSlots)}
            onDrop={(e: React.DragEvent) => onDrop(currentDate, e, timeSlots)}
          >
            {timeSlots.map((hour: number, index: number) => (
              <div
                key={index}
                onClick={() => onNewAppointment(currentDate, { hour, minute: 0 })}
                className="h-16 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
              ></div>
            ))}

            {appointmentsWithLayout.map((appointment: any) => {
              const startDate = parseISO(appointment.start_datetime);
              const endDate = parseISO(appointment.end_datetime);
              const startHour = getHours(startDate);
              const startMinute = getMinutes(startDate);
              const endHour = getHours(endDate);
              const endMinute = getMinutes(endDate);
              // Treat midnight (00:00) as 24:00 so appointments ending at midnight render correctly
              const effectiveEndHour = (endHour === 0 && endMinute === 0) ? 24 : endHour;
              const duration = (effectiveEndHour - startHour) + (endMinute - startMinute) / 60;
              const startIndex = timeSlots.findIndex((t: number) => t === startHour);

              if (startIndex === -1) return null;

              const color = getAppointmentColor(appointment);
              const isRecurring = isRecurringAppointment(appointments, appointment.id);
              const isReadOnly = isAppointmentReadOnly(appointment);

              const widthPercent = 100 / appointment.totalColumns;
              const leftPercent = (appointment.column * widthPercent);

              const isDragging = draggingAppointment?.id === appointment.id;

              return (
                <div
                  key={getAppointmentKey(appointment)}
                  draggable={!isReadOnly}
                  onDragStart={isReadOnly ? undefined : (e: React.DragEvent) => onDragStart(appointment, e)}
                  onDragEnd={isReadOnly ? undefined : onDragEnd}
                  onClick={() => !isDragging && onAppointmentClick(appointment)}
                  className={`absolute rounded-lg px-2 py-1.5 shadow-md transition-all z-10 cursor-pointer ${
                    isReadOnly
                      ? ''
                      : 'cursor-move hover:brightness-110'
                  } ${isDragging ? 'opacity-40' : ''}`}
                  style={{
                    backgroundColor: color,
                    opacity: isReadOnly ? 0.5 : (isDragging ? 0.4 : 0.9),
                    top: `${startIndex * 64 + (startMinute / 60) * 64}px`,
                    height: `${duration * 64 - 4}px`,
                    minHeight: '60px',
                    left: `calc(${leftPercent}% + 8px)`,
                    width: `calc(${widthPercent}% - 16px)`,
                  }}
                  title={isReadOnly ? 'Read-only (imported from secondary calendar)' : (appointment.contact ? `Contact: ${appointment.contact.name}` : '')}
                >
                  <div className="flex items-center gap-1 mb-1">
                    {isReadOnly && <LockClosedIcon className="w-4 h-4 text-white flex-shrink-0" />}
                    {isRecurring && <ArrowPathIcon className="w-4 h-4 text-white flex-shrink-0" />}
                    <p className="text-white text-xs font-normal truncate">{appointment.title}</p>
                    {appointment.status && appointment.status !== 'scheduled' && (
                      <span
                        className="text-[9px] px-1 py-0.5 rounded bg-white bg-opacity-90 flex-shrink-0"
                        style={{ color: getStatusColor(appointment.status) }}
                        title={getStatusLabel(appointment.status)}
                      >
                        {getStatusLabel(appointment.status)}
                      </span>
                    )}
                  </div>
                  <p className="text-white text-[11px] font-light opacity-90">
                    {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                  </p>
                  {appointment.location && (
                    <p className="text-white text-xs opacity-80 mt-1">{appointment.location}</p>
                  )}
                </div>
              );
            })}

            {dragPreview && draggingAppointment && isSameDay(currentDate, dragPreview.start) && (
              (() => {
                const previewStartHour = getHours(dragPreview.start);
                const previewStartMinute = getMinutes(dragPreview.start);
                const previewEndHour = getHours(dragPreview.end);
                const previewEndMinute = getMinutes(dragPreview.end);
                const previewDuration = (previewEndHour - previewStartHour) + (previewEndMinute - previewStartMinute) / 60;
                const previewStartIndex = timeSlots.findIndex((t: number) => t === previewStartHour);

                if (previewStartIndex === -1) return null;

                const color = getAppointmentColor(draggingAppointment);

                return (
                  <div
                    className="absolute border-2 border-dashed rounded-lg p-3 pointer-events-none z-20"
                    style={{
                      backgroundColor: color,
                      opacity: 0.4,
                      borderColor: color,
                      top: `${previewStartIndex * 64 + (previewStartMinute / 60) * 64}px`,
                      height: `${previewDuration * 64 - 4}px`,
                      minHeight: '60px',
                      left: '8px',
                      right: '8px',
                    }}
                  >
                    <p className="text-white text-sm font-medium mb-1">{draggingAppointment.title}</p>
                    <p className="text-white text-xs opacity-90">
                      {format(dragPreview.start, 'h:mm a')} - {format(dragPreview.end, 'h:mm a')}
                    </p>
                    {draggingAppointment.location && (
                      <p className="text-white text-xs opacity-80 mt-1">{draggingAppointment.location}</p>
                    )}
                  </div>
                );
              })()
            )}

            {isSameDay(currentDate, new Date()) && (() => {
              const currentHour = getHours(currentTime);
              const currentMinute = getMinutes(currentTime);
              const timePosition = currentHour * 64 + (currentMinute / 60) * 64;
              return (
                <div
                  className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                  style={{ top: `${timePosition}px` }}
                >
                  <div className="w-2 h-2 rounded-full bg-purple-600 -ml-1"></div>
                  <div className="flex-1 h-0.5 bg-purple-600"></div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {appointmentsBelow.length > 0 && (
        <div className="absolute bottom-0 left-24 right-0 h-2 flex pointer-events-none z-30">
          {[...new Set(appointmentsBelow.map((apt: any) => getAppointmentColor(apt)))].map((color: string, index: number) => (
            <div
              key={index}
              className="flex-1 h-full"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
