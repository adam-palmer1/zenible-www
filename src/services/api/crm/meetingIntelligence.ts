/**
 * Meeting Intelligence (ZMI) API Service
 */

import { createRequest } from '../httpClient';

const request = createRequest('MeetingIntelligenceAPI');

const meetingIntelligenceAPI = {
  /** Get ZMI settings for current user */
  getSettings: () => request('/crm/meeting-intelligence/settings', { method: 'GET' }),

  /** Update ZMI settings */
  updateSettings: (data: { enabled?: boolean; caption_language?: string; recording_enabled?: boolean }) => request('/crm/meeting-intelligence/settings', {
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

  /** Dispatch a bot directly to a meeting link (no appointment needed) */
  dispatchBotToLink: (meetingLink: string) => request('/crm/meeting-intelligence/bot/join-link', {
    method: 'POST',
    body: JSON.stringify({ meeting_link: meetingLink }),
  }),

  /** Get bot session status */
  getBotStatus: (sessionId: string) => request(`/crm/meeting-intelligence/bot/${sessionId}/status`, { method: 'GET' }),

  /** Tell bot to leave */
  leaveBot: (sessionId: string) => request(`/crm/meeting-intelligence/bot/${sessionId}/leave`, { method: 'POST' }),

  /** Retry a failed bot dispatch */
  retryBot: (appointmentId: string) => request('/crm/meeting-intelligence/bot/retry', {
    method: 'POST',
    body: JSON.stringify({ appointment_id: appointmentId }),
  }),

  /** List completed meetings with optional search/filter */
  listMeetings: (params?: { search?: string; date_from?: string; date_to?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.date_from) searchParams.set('date_from', params.date_from);
    if (params?.date_to) searchParams.set('date_to', params.date_to);
    const qs = searchParams.toString();
    return request(`/crm/meeting-intelligence/meetings${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  /** Get meeting detail + transcript */
  getMeeting: (meetingId: string) => request(`/crm/meeting-intelligence/meetings/${meetingId}`, { method: 'GET' }),

  /** Delete a meeting */
  deleteMeeting: (meetingId: string) => request(`/crm/meeting-intelligence/meetings/${meetingId}`, {
    method: 'DELETE',
  }),

  /** Rename a meeting */
  renameMeeting: (meetingId: string, title: string) => request(`/crm/meeting-intelligence/meetings/${meetingId}`, {
    method: 'PATCH',
    body: JSON.stringify({ title }),
  }),

  /** Get current month usage */
  getUsage: () => request('/crm/meeting-intelligence/usage', { method: 'GET' }),

  /** Link contacts to a meeting */
  linkContacts: (meetingId: string, contactIds: string[]) => request(`/crm/meeting-intelligence/meetings/${meetingId}/contacts`, {
    method: 'POST',
    body: JSON.stringify({ contact_ids: contactIds }),
  }),

  /** Unlink a contact from a meeting */
  unlinkContact: (meetingId: string, contactId: string) => request(`/crm/meeting-intelligence/meetings/${meetingId}/contacts/${contactId}`, {
    method: 'DELETE',
  }),

  /** Get contacts linked to a meeting */
  getMeetingContacts: (meetingId: string) => request(`/crm/meeting-intelligence/meetings/${meetingId}/contacts`, { method: 'GET' }),

  /** Get usage history by month */
  getUsageHistory: (params?: { date_from?: string; date_to?: string }) => {
    const searchParams = new URLSearchParams();
    if (params?.date_from) searchParams.set('date_from', params.date_from);
    if (params?.date_to) searchParams.set('date_to', params.date_to);
    const qs = searchParams.toString();
    return request(`/crm/meeting-intelligence/usage/history${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  /** Get a scoped ZMI token for direct access to ZMI read endpoints */
  getZMIToken: () => request('/crm/meeting-intelligence/token', { method: 'POST' }) as Promise<{
    token: string;
    expires_in: number;
    zmi_base_url: string;
  }>,

  // ── Recording control ──────────────────────────────────────

  /** Start video recording for a bot session */
  startRecording: (sessionId: string) => request(`/crm/meeting-intelligence/bot/${sessionId}/start-recording`, { method: 'POST' }),

  /** Stop video recording for a bot session */
  stopRecording: (sessionId: string) => request(`/crm/meeting-intelligence/bot/${sessionId}/stop-recording`, { method: 'POST' }),

  /** Get recording status for a bot session */
  getRecordingStatus: (sessionId: string) => request(`/crm/meeting-intelligence/bot/${sessionId}/recording-status`, { method: 'GET' }),

  /** Get presigned URL for a meeting recording */
  getRecordingUrl: (meetingId: string) => request(`/crm/meeting-intelligence/meetings/${meetingId}/recording`, { method: 'GET' }) as Promise<{
    url: string;
    duration_ms: number | null;
    size_bytes: number | null;
  }>,

  /** Delete a meeting recording */
  deleteRecording: (meetingId: string) => request(`/crm/meeting-intelligence/meetings/${meetingId}/recording`, { method: 'DELETE' }),

  /** Create a share link for a meeting recording */
  createShareLink: (meetingId: string) => request(`/crm/meeting-intelligence/meetings/${meetingId}/share`, { method: 'POST' }) as Promise<{
    share_code: string;
    share_url: string;
  }>,

  /** Delete a share link for a meeting recording */
  deleteShareLink: (meetingId: string) => request(`/crm/meeting-intelligence/meetings/${meetingId}/share`, { method: 'DELETE' }),

  /** Get public recording by share code (no auth required) */
  getPublicRecording: (shareCode: string) => request(`/recordings/${shareCode}`, { method: 'GET' }) as Promise<{
    meeting_title: string | null;
    start_time: string | null;
    duration_ms: number | null;
    video_url: string;
    size_bytes: number | null;
  }>,
};

export default meetingIntelligenceAPI;
