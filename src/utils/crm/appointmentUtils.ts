import { getContactDisplayName } from './contactUtils';

interface ContactLike {
  id: string;
  first_name?: string | null;
  last_name?: string | null;
  business_name?: string | null;
  email?: string | null;
}

interface AppointmentLike {
  start_datetime?: string | null;
  deleted_at?: string | null;
  [key: string]: unknown;
}

export const calculateEndDateTime = (startDateTime: string, durationMinutes = 60): string => {
  const startDate = new Date(startDateTime);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  // Format as local time to match start_datetime format (not UTC via toISOString)
  const year = endDate.getFullYear();
  const month = String(endDate.getMonth() + 1).padStart(2, '0');
  const day = String(endDate.getDate()).padStart(2, '0');
  const hours = String(endDate.getHours()).padStart(2, '0');
  const minutes = String(endDate.getMinutes()).padStart(2, '0');
  const seconds = String(endDate.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
};

export const formatAppointmentTitle = (contact: ContactLike | null | undefined, appointmentType: string): string => {
  const displayName = getContactDisplayName(contact, 'Contact');
  const typeLabel = appointmentType === 'call' ? 'Call' : 'Follow-up';
  return `${typeLabel}: ${displayName}`;
};

export const prepareAppointmentData = (
  contact: ContactLike,
  startDateTime: string,
  appointmentType: string,
  customTitle: string | null = null,
  durationMinutes = 60
) => {
  return {
    contact_id: contact.id,
    title: customTitle || formatAppointmentTitle(contact, appointmentType),
    start_datetime: startDateTime,
    end_datetime: calculateEndDateTime(startDateTime, durationMinutes),
    appointment_type: appointmentType
    // Note: status is auto-set by backend to 'scheduled' on create
  };
};

export const isAppointmentOverdue = (startDateTime: string | null | undefined): boolean => {
  if (!startDateTime) return false;
  return new Date(startDateTime) <= new Date();
};

export const parseAppointmentDateTime = (datetimeString: string | null | undefined): { date: string; time: string } => {
  if (!datetimeString) {
    return {
      date: new Date().toISOString().split('T')[0],
      time: getNextHour()
    };
  }

  // Handle ISO format with time (YYYY-MM-DDTHH:MM:SS)
  if (datetimeString.includes('T')) {
    const [datePart, timePart] = datetimeString.split('T');
    const timeOnly = timePart ? timePart.split(':').slice(0, 2).join(':') : getNextHour();
    return {
      date: datePart,
      time: timeOnly
    };
  }

  // Handle date-only format
  return {
    date: datetimeString,
    time: getNextHour()
  };
};

export const getNextHour = (): string => {
  const now = new Date();
  now.setHours(now.getHours() + 1, 0, 0, 0);
  return now.toTimeString().slice(0, 5); // HH:MM format
};

export const getNextAppointment = (appointments: AppointmentLike[] | null | undefined): AppointmentLike | null => {
  if (!appointments || !Array.isArray(appointments) || appointments.length === 0) {
    return null;
  }

  // Filter to active appointments (not deleted)
  const activeAppointments = appointments.filter(
    apt => !apt.deleted_at && apt.start_datetime
  );

  if (activeAppointments.length === 0) {
    return null;
  }

  // Sort by start_datetime ascending (soonest first)
  const sorted = [...activeAppointments].sort((a, b) => {
    const dateA = new Date(a.start_datetime!).getTime();
    const dateB = new Date(b.start_datetime!).getTime();
    return dateA - dateB;
  });

  // Return the soonest appointment
  return sorted[0];
};

export const getScheduledAppointments = (appointments: AppointmentLike[] | null | undefined): AppointmentLike[] => {
  if (!appointments || !Array.isArray(appointments)) {
    return [];
  }

  const active = appointments.filter(apt => !apt.deleted_at && apt.start_datetime);

  return [...active].sort((a, b) => {
    const dateA = new Date(a.start_datetime!).getTime();
    const dateB = new Date(b.start_datetime!).getTime();
    return dateA - dateB;
  });
};
