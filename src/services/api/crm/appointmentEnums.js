/**
 * Appointment Enums API Service
 */

import { createRequest } from '../httpClient';

const request = createRequest('AppointmentEnumsAPI');

const appointmentEnumsAPI = {
  /** Get appointment enums */
  getEnums: () => request('/crm/appointments/enums', { method: 'GET' }),
};

export default appointmentEnumsAPI;
