import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LockClosedIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import {
  format,
  addDays,
  startOfWeek,
  isSameDay,
  parseISO,
  getHours,
  getMinutes,
  startOfDay,
} from 'date-fns';
import { getAppointmentKey, formatHour, isWeekend, calculateAppointmentLayout, computeSpanningEventsLayout, getEffectiveEndDate } from './calendarUtils';

interface CalendarWeekViewProps {
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

export default function CalendarWeekView({ currentDate, appointments, timeSlots, onAppointmentClick, onNewAppointment, onDragStart, onDragOver, onDrop, onDragEnd, draggingAppointment, dragPreview, getAppointmentColor, isRecurringAppointment, isAppointmentReadOnly, getStatusColor, getStatusLabel }: CalendarWeekViewProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [appointmentsBelow, setAppointmentsBelow] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const days = useMemo(() => {
    const currentWeekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
    const result: Date[] = [];
    for (let d = 0; d < 7; d++) {
      result.push(addDays(currentWeekStart, d));
    }
    return result;
  }, [currentDate]);

  const allDayLayout = useMemo(() => {
    return computeSpanningEventsLayout(appointments, days, parseISO, isSameDay, startOfDay);
  }, [appointments, days]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const previousHour = Math.max(0, new Date().getHours() - 1);
      const scrollPosition = previousHour * 64;
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, []);

  useEffect(() => {
    const checkAppointmentsBelow = () => {
      if (!scrollContainerRef.current) return;

      const container = scrollContainerRef.current;
      const visibleBottom = container.scrollTop + container.clientHeight;
      const totalHeight = container.scrollHeight;

      const weekAppointments = appointments.filter((apt: any) => {
        const aptDate = parseISO(apt.start_datetime);
        if (!days.some((day: Date) => isSameDay(aptDate, day))) return false;
        if (apt.all_day) return false;
        // Exclude multi-day timed events (they're in the spanning section)
        const aptStartDay = startOfDay(parseISO(apt.start_datetime));
        const aptEndDay = startOfDay(parseISO(apt.end_datetime));
        if (aptEndDay.getTime() > aptStartDay.getTime()) return false;
        return true;
      });

      const notAtBottom = visibleBottom < totalHeight - 10;

      if (!notAtBottom) {
        setAppointmentsBelow([]);
        return;
      }

      const below = weekAppointments.filter((apt: any) => {
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
  }, [appointments, days]);

  const getAppointmentsForDay = (day: Date) => {
    return appointments.filter((apt: any) => {
      const aptDate = parseISO(apt.start_datetime);
      if (!isSameDay(aptDate, day)) return false;
      if (apt.all_day) return false;
      // Exclude multi-day timed events (they're in the spanning section)
      // Appointments ending exactly at midnight are NOT multi-day
      const aptStartDay = startOfDay(parseISO(apt.start_datetime));
      const effectiveEnd = getEffectiveEndDate(apt.end_datetime, parseISO);
      const aptEndDay = startOfDay(effectiveEnd);
      if (aptEndDay.getTime() > aptStartDay.getTime()) return false;
      return true;
    });
  };

  return (
    <div className="h-full relative">
      <div ref={scrollContainerRef} className="h-full overflow-y-auto overflow-x-auto custom-scrollbar">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          {/* Day labels */}
          <div className="flex">
            <div className="w-16 md:w-24 flex-shrink-0 border-r border-gray-200"></div>
            <div className="flex-1 flex">
              {days.map((day: Date, dayIndex: number) => {
                const weekend = isWeekend(day);
                return (
                  <div key={dayIndex} className={`flex-1 min-w-[60px] md:min-w-[100px] border-r border-gray-200 last:border-r-0 ${weekend ? 'bg-gray-50' : ''}`}>
                    <div className={`py-2 flex items-center justify-center gap-1 ${
                      isSameDay(day, new Date()) ? 'bg-purple-100' : ''
                    }`}>
                      <span className="text-sm font-medium text-gray-600">{format(day, 'EEE')}</span>
                      <span className={`text-lg font-semibold ${
                        isSameDay(day, new Date()) ? 'text-purple-600' : 'text-gray-900'
                      }`}>{format(day, 'd')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* All-day / multi-day spanning events */}
          {allDayLayout.laneCount > 0 && (
            <div className="flex border-t border-gray-100">
              <div className="w-16 md:w-24 flex-shrink-0 border-r border-gray-200"></div>
              <div className="flex-1 relative flex" style={{ minHeight: `${allDayLayout.laneCount * 24 + 4}px` }}>
                {/* Day column dividers to match the grid below */}
                {days.map((_: Date, i: number) => {
                  const weekend = isWeekend(days[i]);
                  return (
                    <div key={i} className={`flex-1 min-w-[60px] md:min-w-[100px] border-r border-gray-200 last:border-r-0 ${weekend ? 'bg-gray-50' : ''}`}></div>
                  );
                })}
                {/* Spanning event bars overlaid on the column dividers */}
                {allDayLayout.events.map((event: any) => {
                  const color = getAppointmentColor(event);
                  const isRecurring = isRecurringAppointment(appointments, event.id);
                  const isReadOnly = isAppointmentReadOnly(event);
                  return (
                    <div
                      key={getAppointmentKey(event)}
                      onClick={() => onAppointmentClick(event)}
                      className={`absolute text-white text-xs px-2 py-0.5 truncate flex items-center gap-0.5 cursor-pointer ${
                        isReadOnly
                          ? 'opacity-60'
                          : 'bg-opacity-90 hover:bg-opacity-100 hover:brightness-110'
                      }`}
                      style={{
                        backgroundColor: color,
                        left: `calc(${(event.startCol / 7) * 100}% + 2px)`,
                        width: `calc(${((event.endCol - event.startCol + 1) / 7) * 100}% - 4px)`,
                        top: `${event.lane * 24 + 2}px`,
                        height: '22px',
                        lineHeight: '22px',
                        borderRadius: `${event.continuesBefore ? '0' : '4px'} ${event.continuesAfter ? '0' : '4px'} ${event.continuesAfter ? '0' : '4px'} ${event.continuesBefore ? '0' : '4px'}`,
                      }}
                      title={isReadOnly ? 'Read-only (imported from secondary calendar)' : undefined}
                    >
                      {isReadOnly && <LockClosedIcon className="w-3 h-3 flex-shrink-0" />}
                      {isRecurring && <ArrowPathIcon className="w-3 h-3 flex-shrink-0" />}
                      <span className="truncate">{event.title}</span>
                      {event.status && event.status !== 'scheduled' && (
                        <span
                          className="text-[10px] px-1 py-0.5 rounded bg-white bg-opacity-90 flex-shrink-0"
                          style={{ color: getStatusColor(event.status) }}
                          title={getStatusLabel(event.status)}
                        >
                          {getStatusLabel(event.status)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="flex">
          <div className="w-16 md:w-24 flex-shrink-0 border-r border-gray-200">
            {timeSlots.map((hour: number) => (
              <div key={hour} className="h-16 border-b border-gray-200 px-3 py-2">
                <span className="text-sm text-gray-500">
                  {formatHour(hour)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex-1 flex relative">
            {days.map((day: Date, dayIndex: number) => {
              const dayAppointments = getAppointmentsForDay(day);
              const appointmentsWithLayout = calculateAppointmentLayout(dayAppointments, parseISO, getHours, getMinutes);
              const weekend = isWeekend(day);

              return (
                <div
                  key={dayIndex}
                  className="flex-1 min-w-[60px] md:min-w-[100px] border-r border-gray-200 last:border-r-0 relative"
                    onDragOver={(e: React.DragEvent) => onDragOver(day, e, timeSlots)}
                    onDrop={(e: React.DragEvent) => onDrop(day, e, timeSlots)}
                  >
                    {timeSlots.map((hour: number, timeIndex: number) => (
                      <div
                        key={timeIndex}
                        onClick={() => onNewAppointment(day, { hour, minute: 0 })}
                        className={`h-16 border-b border-gray-200 cursor-pointer hover:bg-gray-100 ${
                          isSameDay(day, new Date()) ? 'bg-purple-50' : weekend ? 'bg-gray-50' : ''
                        }`}
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
                          className={`absolute rounded-lg px-2 py-1 shadow-sm transition-all z-10 cursor-pointer overflow-hidden ${
                            isReadOnly
                              ? ''
                              : 'cursor-move hover:brightness-110'
                          } ${isDragging ? 'opacity-40' : ''}`}
                          style={{
                            backgroundColor: color,
                            opacity: isReadOnly ? 0.5 : (isDragging ? 0.4 : 0.9),
                            top: `${startIndex * 64 + (startMinute / 60) * 64}px`,
                            height: `${duration * 64 - 4}px`,
                            minHeight: '24px',
                            left: `calc(${leftPercent}% + 2px)`,
                            width: `calc(${widthPercent}% - 4px)`,
                          }}
                          title={isReadOnly ? 'Read-only (imported from secondary calendar)' : (appointment.contact ? `Contact: ${appointment.contact.name}` : '')}
                        >
                          <div className="flex items-center gap-1 min-w-0">
                            {isReadOnly && <LockClosedIcon className="w-3 h-3 text-white flex-shrink-0" />}
                            {isRecurring && <ArrowPathIcon className="w-3 h-3 text-white flex-shrink-0" />}
                            <p className="text-white text-[11px] font-normal truncate min-w-0">{appointment.title}</p>
                          </div>
                          {duration >= 0.75 && (
                            <p className="text-white text-[10px] font-light opacity-90 truncate">
                              {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {dragPreview && draggingAppointment && isSameDay(day, dragPreview.start) && (
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
                            className="absolute border-2 border-dashed rounded-lg p-2 pointer-events-none z-20"
                            style={{
                              backgroundColor: color,
                              opacity: 0.4,
                              borderColor: color,
                              top: `${previewStartIndex * 64 + (previewStartMinute / 60) * 64}px`,
                              height: `${previewDuration * 64 - 4}px`,
                              minHeight: '30px',
                              left: '2px',
                              right: '2px',
                            }}
                          >
                            <p className="text-white text-xs font-medium truncate">{draggingAppointment.title}</p>
                            <p className="text-white text-xs opacity-90">
                              {format(dragPreview.start, 'h:mm a')} - {format(dragPreview.end, 'h:mm a')}
                            </p>
                          </div>
                        );
                      })()
                    )}

                  </div>
                );
              })}

              {(() => {
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
          {days.map((day: Date, dayIndex: number) => {
            const dayApptsBelow = appointmentsBelow.filter((apt: any) => {
              const aptDate = parseISO(apt.start_datetime);
              return isSameDay(aptDate, day);
            });

            const colors = [...new Set(dayApptsBelow.map((apt: any) => getAppointmentColor(apt)))];

            return (
              <div key={dayIndex} className="flex-1 min-w-[60px] md:min-w-[100px] flex h-full">
                {colors.length > 0 ? (
                  colors.map((color: string, colorIndex: number) => (
                    <div
                      key={colorIndex}
                      className="flex-1 h-full"
                      style={{ backgroundColor: color }}
                    />
                  ))
                ) : (
                  <div className="flex-1 h-full" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
