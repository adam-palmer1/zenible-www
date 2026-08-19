/**
 * Booking Reminders API Service
 */

import { createRequest } from '../httpClient';

const request = createRequest('BookingRemindersAPI');

export interface BookingReminderRuleInput {
  slot: number;
  offset_hours: number;
  send_email: boolean;
  send_sms: boolean;
}

export interface BookingReminderRule extends BookingReminderRuleInput {
  id: string;
}

export interface BookingReminderListResponse {
  items: BookingReminderRule[];
}

export interface BookingReminderSmsTemplateResponse {
  template: string;
  sms_enabled: boolean;
}

const bookingRemindersAPI = {
  list: () =>
    request('/crm/booking-reminders', { method: 'GET' }) as Promise<BookingReminderListResponse>,

  replace: (rules: BookingReminderRuleInput[]) =>
    request('/crm/booking-reminders', {
      method: 'PUT',
      body: JSON.stringify({ rules }),
    }) as Promise<BookingReminderListResponse>,

  getSmsTemplate: () =>
    request('/crm/booking-reminders/sms-template', {
      method: 'GET',
    }) as Promise<BookingReminderSmsTemplateResponse>,

  // --- per-call-type overrides ---
  // An override REPLACES the global set for that call type's bookings. An
  // empty list is indistinguishable from no override: both inherit.

  listForCallType: (callTypeId: string) =>
    request(`/crm/booking-reminders/call-types/${callTypeId}`, {
      method: 'GET',
    }) as Promise<BookingReminderListResponse>,

  replaceForCallType: (callTypeId: string, rules: BookingReminderRuleInput[]) =>
    request(`/crm/booking-reminders/call-types/${callTypeId}`, {
      method: 'PUT',
      body: JSON.stringify({ rules }),
    }) as Promise<BookingReminderListResponse>,

  /** Drop the override so this call type inherits the global reminders again. */
  clearForCallType: (callTypeId: string) =>
    request(`/crm/booking-reminders/call-types/${callTypeId}`, {
      method: 'DELETE',
    }) as Promise<void>,
};

export default bookingRemindersAPI;
