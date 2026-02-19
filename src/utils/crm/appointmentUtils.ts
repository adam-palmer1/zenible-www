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
  return endDate.toISOString();
};

interface UserLike {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}

export const formatAppointmentTitle = (contact: ContactLike | null | undefined, _appointmentType: string, user?: UserLike | null): string => {
  // CLIENT: contact's first name, or business name if no first name
  const clientName = contact?.first_name || contact?.business_name || 'Contact';

  // ZENIBLE_USER: user's full name (first + last), or email prefix as fallback
  let zenibleUser = '';
  if (user) {
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    zenibleUser = fullName || user.email?.split('@')[0] || '';
  }

  return zenibleUser ? `Meet: ${clientName} / ${zenibleUser}` : `Meet: ${clientName}`;
};

export const prepareAppointmentData = (
  contact: ContactLike,
  startDateTime: string,
  appointmentType: string,
  customTitle: string | null = null,
  durationMinutes = 60,
  user?: UserLike | null
) => {
  return {
    contact_id: contact.id,
    title: customTitle || formatAppointmentTitle(contact, appointmentType, user),
    start_datetime: startDateTime,
    end_datetime: calculateEndDateTime(startDateTime, durationMinutes),
    appointment_type: appointmentType,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
};

export const isAppointmentOverdue = (startDateTime: string | null | undefined): boolean => {
  if (!startDateTime) return false;
  return new Date(startDateTime) <= new Date();
};

export const parseAppointmentDateTime = (datetimeString: string | null | undefined): { date: string; time: string } => {
  if (!datetimeString) {
    return { date: new Date().toISOString().split('T')[0], time: getNextHour() };
  }
  const date = new Date(datetimeString);
  if (isNaN(date.getTime())) {
    return { date: datetimeString, time: getNextHour() };
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
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
