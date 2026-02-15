// Shared utility functions for calendar components

// Helper: Generate unique key for appointments (handles recurring)
// Recurring appointments share the same ID, so we need to use start_datetime too
export const getAppointmentKey = (appointment: any) => {
  return `${appointment.id}_${appointment.start_datetime}`;
};

// Helper: Check if appointment is recurring (multiple instances with same ID)
export const isRecurringAppointment = (appointments: any[], appointmentId: any) => {
  return appointments.filter(apt => apt.id === appointmentId).length > 1;
};

// Helper: Format hour for time slot display
export const formatHour = (hour: number) => {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour > 12) return `${hour - 12} PM`;
  return `${hour} AM`;
};

// Helper: Get the effective end date for display purposes.
// Appointments ending exactly at midnight (00:00:00) should display only on the previous day,
// not span into the next day. E.g., 11 PM Mon → 12 AM Tue should only show on Monday.
export const getEffectiveEndDate = (endDatetime: string, parseISO: (s: string) => Date): Date => {
  const end = parseISO(endDatetime);
  if (end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0) {
    return new Date(end.getTime() - 1);
  }
  return end;
};

// Helper: Check if a day is a weekend
export const isWeekend = (day: Date) => {
  const dayOfWeek = day.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6;
};

// Helper: Calculate appointment layout for overlapping appointments in time-based views
export const calculateAppointmentLayout = (dayAppointments: any[], parseISO: any, getHours: any, getMinutes: any) => {
  if (dayAppointments.length === 0) return [];

  const appointmentsWithLayout = dayAppointments.map((apt: any) => {
    const startDate = parseISO(apt.start_datetime);
    const endDate = parseISO(apt.end_datetime);
    const endMinutes = getHours(endDate) * 60 + getMinutes(endDate);
    return {
      ...apt,
      startTime: getHours(startDate) * 60 + getMinutes(startDate),
      // Treat midnight (00:00) as end-of-day (1440) so appointments ending at
      // midnight display correctly and overlap detection works
      endTime: endMinutes === 0 ? 24 * 60 : endMinutes,
    };
  });

  appointmentsWithLayout.sort((a: any, b: any) => {
    if (a.startTime !== b.startTime) return a.startTime - b.startTime;
    return (b.endTime - b.startTime) - (a.endTime - a.startTime);
  });

  const columns: any[][] = [];

  appointmentsWithLayout.forEach((apt: any) => {
    let column = 0;
    let placed = false;

    while (!placed) {
      if (!columns[column]) {
        columns[column] = [];
      }

      const isFree = columns[column].every((existing: any) => {
        return apt.startTime >= existing.endTime || apt.endTime <= existing.startTime;
      });

      if (isFree) {
        apt.column = column;
        columns[column].push(apt);
        placed = true;
      } else {
        column++;
      }
    }
  });

  appointmentsWithLayout.forEach((apt: any) => {
    let maxConcurrent = 0;

    appointmentsWithLayout.forEach((other: any) => {
      if (apt.startTime < other.endTime && apt.endTime > other.startTime) {
        maxConcurrent = Math.max(maxConcurrent, other.column + 1);
      }
    });

    apt.totalColumns = maxConcurrent;
  });

  return appointmentsWithLayout;
};

// Helper: Compute all-day/multi-day event layout with lane assignment for spanning display
// Includes: all all-day events + timed events that span multiple calendar days
// When multiDayOnly=true, only events spanning multiple days are included (for month view)
// When multiDayOnly=false, all all-day events are included too (for week view)
export const computeSpanningEventsLayout = (
  appointments: any[],
  visibleDays: Date[],
  parseISO: (s: string) => Date,
  isSameDay: (a: Date, b: Date) => boolean,
  startOfDay: (d: Date) => Date,
  multiDayOnly: boolean = false
): { events: any[]; laneCount: number } => {
  const numDays = visibleDays.length;
  const firstDay = startOfDay(visibleDays[0]);
  const lastDay = startOfDay(visibleDays[numDays - 1]);

  const allDayAppts = appointments.filter((apt: any) => {
    const aptStart = startOfDay(parseISO(apt.start_datetime));
    const effectiveEnd = getEffectiveEndDate(apt.end_datetime, parseISO);
    const aptEnd = startOfDay(effectiveEnd);
    const isMultiDay = aptEnd.getTime() > aptStart.getTime();
    // Include all-day events OR timed events spanning multiple days
    if (!apt.all_day && !isMultiDay) return false;
    // In multiDayOnly mode, skip single-day all-day events
    if (multiDayOnly && !isMultiDay) return false;
    return aptStart <= lastDay && aptEnd >= firstDay;
  });

  if (allDayAppts.length === 0) return { events: [], laneCount: 0 };

  const events = allDayAppts.map((apt: any) => {
    const aptStart = startOfDay(parseISO(apt.start_datetime));
    const effectiveEnd = getEffectiveEndDate(apt.end_datetime, parseISO);
    const aptEnd = startOfDay(effectiveEnd);

    let startCol = 0;
    let endCol = numDays - 1;

    for (let i = 0; i < numDays; i++) {
      if (isSameDay(visibleDays[i], aptStart)) startCol = i;
      if (isSameDay(visibleDays[i], aptEnd)) endCol = i;
    }

    if (aptStart < firstDay) startCol = 0;
    if (aptEnd > lastDay) endCol = numDays - 1;

    return {
      ...apt,
      startCol,
      endCol,
      continuesBefore: aptStart < firstDay,
      continuesAfter: aptEnd > lastDay,
      lane: 0,
    };
  });

  // Sort: wider spans first for better lane packing, then by start column
  events.sort((a: any, b: any) => {
    const spanA = a.endCol - a.startCol;
    const spanB = b.endCol - b.startCol;
    if (spanA !== spanB) return spanB - spanA;
    return a.startCol - b.startCol;
  });

  // Assign lanes using greedy algorithm
  const lanes: { startCol: number; endCol: number }[][] = [];

  events.forEach((event: any) => {
    let laneIdx = 0;
    let placed = false;

    while (!placed) {
      if (!lanes[laneIdx]) lanes[laneIdx] = [];

      const fits = lanes[laneIdx].every(
        (existing) => event.startCol > existing.endCol || event.endCol < existing.startCol
      );

      if (fits) {
        event.lane = laneIdx;
        lanes[laneIdx].push({ startCol: event.startCol, endCol: event.endCol });
        placed = true;
      } else {
        laneIdx++;
      }
    }
  });

  return { events, laneCount: lanes.length };
};
