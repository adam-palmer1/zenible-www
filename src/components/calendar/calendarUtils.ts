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
    return {
      ...apt,
      startTime: getHours(startDate) * 60 + getMinutes(startDate),
      endTime: getHours(endDate) * 60 + getMinutes(endDate),
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
