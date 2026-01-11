import { getContactDisplayName } from './contactUtils';

/**
 * Calculate end_datetime based on start_datetime and duration
 * @param {string} startDateTime - ISO 8601 datetime string (e.g., "2026-02-02T14:00:00")
 * @param {number} durationMinutes - Duration in minutes (default: 60)
 * @returns {string} ISO 8601 datetime string for end time
 */
export const calculateEndDateTime = (startDateTime, durationMinutes = 60) => {
  const startDate = new Date(startDateTime);
  const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
  return endDate.toISOString().slice(0, 19); // Remove milliseconds and Z
};

/**
 * Format appointment title based on contact and type
 * @param {Object} contact - Contact object
 * @param {string} appointmentType - 'call' or 'follow_up'
 * @returns {string} Formatted title (e.g., "Follow-up: John Doe" or "Call: Acme Corp")
 */
export const formatAppointmentTitle = (contact, appointmentType) => {
  const displayName = getContactDisplayName(contact, 'Contact');
  const typeLabel = appointmentType === 'call' ? 'Call' : 'Follow-up';
  return `${typeLabel}: ${displayName}`;
};

/**
 * Prepare complete appointment data object for API submission
 * @param {Object} contact - Contact object
 * @param {string} startDateTime - ISO 8601 datetime string
 * @param {string} appointmentType - 'call' or 'follow_up'
 * @param {string|null} customTitle - Optional custom title (defaults to formatted title)
 * @param {number} durationMinutes - Duration in minutes (default: 60)
 * @returns {Object} Complete appointment object ready for API
 */
export const prepareAppointmentData = (
  contact,
  startDateTime,
  appointmentType,
  customTitle = null,
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

/**
 * Check if appointment is overdue (start time is in the past)
 * @param {string} startDateTime - ISO 8601 datetime string
 * @returns {boolean} True if appointment is overdue
 */
export const isAppointmentOverdue = (startDateTime) => {
  if (!startDateTime) return false;
  return new Date(startDateTime) <= new Date();
};

/**
 * Parse ISO datetime string into separate date and time components
 * @param {string} datetimeString - ISO 8601 datetime string (e.g., "2026-02-02T14:00:00")
 * @returns {Object} Object with date (YYYY-MM-DD) and time (HH:MM) properties
 */
export const parseAppointmentDateTime = (datetimeString) => {
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

/**
 * Get next hour as HH:MM string
 * @returns {string} Next hour in HH:MM format (e.g., "15:00")
 */
export const getNextHour = () => {
  const now = new Date();
  now.setHours(now.getHours() + 1, 0, 0, 0);
  return now.toTimeString().slice(0, 5); // HH:MM format
};

/**
 * Get the next/closest appointment from an appointments array
 * Only considers scheduled appointments, sorted by soonest first
 * @param {Array} appointments - Array of appointment objects
 * @returns {Object|null} The next appointment or null if none
 */
export const getNextAppointment = (appointments) => {
  if (!appointments || !Array.isArray(appointments) || appointments.length === 0) {
    return null;
  }

  // Filter to only scheduled appointments
  const scheduledAppointments = appointments.filter(
    apt => apt.status === 'scheduled' && apt.start_datetime
  );

  if (scheduledAppointments.length === 0) {
    return null;
  }

  // Sort by start_datetime ascending (soonest first)
  const sorted = [...scheduledAppointments].sort((a, b) => {
    const dateA = new Date(a.start_datetime);
    const dateB = new Date(b.start_datetime);
    return dateA - dateB;
  });

  // Return the soonest appointment
  return sorted[0];
};

/**
 * Get all scheduled appointments sorted by date
 * @param {Array} appointments - Array of appointment objects
 * @returns {Array} Sorted scheduled appointments
 */
export const getScheduledAppointments = (appointments) => {
  if (!appointments || !Array.isArray(appointments)) {
    return [];
  }

  const scheduled = appointments.filter(apt => apt.status === 'scheduled');

  return [...scheduled].sort((a, b) => {
    const dateA = new Date(a.start_datetime);
    const dateB = new Date(b.start_datetime);
    return dateA - dateB;
  });
};
