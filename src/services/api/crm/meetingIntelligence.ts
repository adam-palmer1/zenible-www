/**
 * Meeting Intelligence (ZMI) API Service
 */

import { API_BASE_URL } from '@/config/api';
import { createRequest } from '../httpClient';

const request = createRequest('MeetingIntelligenceAPI');

/** Bot background upload/delete use multipart, so they bypass `request`
 *  (which forces a JSON Content-Type and would break the form boundary). */
const botBackgroundUrl = `${API_BASE_URL}/crm/meeting-intelligence/settings/bot-background`;

const authHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('access_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const meetingIntelligenceAPI = {
  /** Get ZMI settings for current user */
  getSettings: () => request('/crm/meeting-intelligence/settings', { method: 'GET' }),

  /** Update ZMI settings */
  updateSettings: (data: {
    enabled?: boolean;
    caption_language?: string;
    recording_enabled?: boolean;
    meeting_display_name?: string;
    auto_send_summary?: string;
    bot_display_name?: string;
    recording_notice_enabled?: boolean;
    recording_notice_message?: string;
  }) => request('/crm/meeting-intelligence/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  /** Upload the image shown on the bot's camera (JPEG/PNG/WebP, max 5MB) */
  uploadBotBackground: async (file: File): Promise<{ bot_background_url: string | null }> => {
    const formData = new FormData();
    formData.append('background', file);
    const response = await fetch(botBackgroundUrl, {
      method: 'POST',
      headers: authHeaders(),
      body: formData,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(err.detail || 'Failed to upload background');
    }
    return response.json();
  },

  /** Remove the custom background; the bot reverts to the default image */
  deleteBotBackground: async (): Promise<{ bot_background_url: string | null }> => {
    const response = await fetch(botBackgroundUrl, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Delete failed' }));
      throw new Error(err.detail || 'Failed to remove background');
    }
    return response.json();
  },

  /** Get upcoming meetings with meeting links */
  getUpcoming: () => request('/crm/meeting-intelligence/upcoming', { method: 'GET' }),

  /** Dispatch a bot to join a meeting */
  dispatchBot: (appointmentId: string, instanceStartDatetime?: string) => request('/crm/meeting-intelligence/bot/join', {
    method: 'POST',
    body: JSON.stringify({
      appointment_id: appointmentId,
      ...(instanceStartDatetime && { instance_start_datetime: instanceStartDatetime }),
    }),
  }),

  /** Dispatch a bot directly to a meeting link (no appointment needed) */
  dispatchBotToLink: (meetingLink: string) => request('/crm/meeting-intelligence/bot/join-link', {
    method: 'POST',
    body: JSON.stringify({ meeting_link: meetingLink }),
  }),

  /** Get all active bot sessions for the current user */
  getActiveBotSessions: () => request('/crm/meeting-intelligence/bot/active', { method: 'GET' }) as Promise<Array<{ session_id: string; status: string }>>,

  /** Get bot session status */
  getBotStatus: (sessionId: string) => request(`/crm/meeting-intelligence/bot/${sessionId}/status`, { method: 'GET' }),

  /** Enable real-time insights for a session (checks feature + credits) */
  enableInsights: (sessionId: string) => request(`/crm/meeting-intelligence/bot/${sessionId}/insights/enable`, { method: 'POST' }) as Promise<{ enabled: boolean; credits_remaining: number | null }>,

  /** Disable real-time insights for a session */
  disableInsights: (sessionId: string) => request(`/crm/meeting-intelligence/bot/${sessionId}/insights/disable`, { method: 'POST' }) as Promise<{ enabled: boolean }>,

  /** Get available call objectives for real-time insights */
  getInsightObjectives: () => request('/crm/meeting-intelligence/insights/objectives', { method: 'GET' }) as Promise<Array<{ id: string; label: string }>>,

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

  /** Bulk delete meetings */
  bulkDeleteMeetings: (meetingIds: string[]) => request(`/crm/meeting-intelligence/meetings/bulk-delete`, {
    method: 'POST',
    body: JSON.stringify({ meeting_ids: meetingIds }),
  }),

  /** Get persisted real-time insights for a meeting */
  getMeetingInsights: (meetingId: string) => request(`/crm/meeting-intelligence/meetings/${meetingId}/insights`, { method: 'GET' }),

  /** Trigger or re-trigger AI analysis for a meeting */
  analyzeMeeting: (meetingId: string, options?: { detailed?: boolean }) => request(`/crm/meeting-intelligence/meetings/${meetingId}/analyze`, {
    method: 'POST',
    body: options ? JSON.stringify(options) : undefined,
  }),

  /** Preview summary email recipients */
  getSummaryRecipients: (meetingId: string) => request(`/crm/meeting-intelligence/meetings/${meetingId}/summary-recipients`, {
    method: 'GET',
  }),

  /** Send meeting summary email */
  sendSummary: (meetingId: string, recipients: 'me' | 'all') => request(`/crm/meeting-intelligence/meetings/${meetingId}/send-summary`, {
    method: 'POST',
    body: JSON.stringify({ recipients }),
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
