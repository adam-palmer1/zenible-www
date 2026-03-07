/**
 * Meeting Intelligence (ZMI) API Service
 */

import { createRequest } from '../httpClient';

const request = createRequest('MeetingIntelligenceAPI');

const meetingIntelligenceAPI = {
  /** Get ZMI settings for current user */
  getSettings: () => request('/crm/meeting-intelligence/settings', { method: 'GET' }),

  /** Update ZMI settings */
  updateSettings: (data: { enabled: boolean }) => request('/crm/meeting-intelligence/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  /** Get upcoming meetings with meeting links */
  getUpcoming: () => request('/crm/meeting-intelligence/upcoming', { method: 'GET' }),

  /** Dispatch a bot to join a meeting */
  dispatchBot: (appointmentId: string) => request('/crm/meeting-intelligence/bot/join', {
    method: 'POST',
    body: JSON.stringify({ appointment_id: appointmentId }),
  }),

  /** Get bot session status */
  getBotStatus: (sessionId: string) => request(`/crm/meeting-intelligence/bot/${sessionId}/status`, { method: 'GET' }),

  /** Tell bot to leave */
  leaveBot: (sessionId: string) => request(`/crm/meeting-intelligence/bot/${sessionId}/leave`, { method: 'POST' }),

  /** List completed meetings */
  listMeetings: () => request('/crm/meeting-intelligence/meetings', { method: 'GET' }),

  /** Get meeting detail + transcript */
  getMeeting: (meetingId: string) => request(`/crm/meeting-intelligence/meetings/${meetingId}`, { method: 'GET' }),

  /** Get current month usage */
  getUsage: () => request('/crm/meeting-intelligence/usage', { method: 'GET' }),
};

export default meetingIntelligenceAPI;
