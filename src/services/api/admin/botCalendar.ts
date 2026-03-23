/**
 * Admin Bot Calendar API Service
 * Handles bot Google account OAuth setup and status
 */

import { createRequest } from '../httpClient';

const request = createRequest('AdminBotCalendarAPI');

const adminBotCalendarAPI = {
  async getBotCalendarStatus(): Promise<unknown> {
    return request('/admin/bot-calendar/status', { method: 'GET' });
  },

  async getBotCalendarConnectUrl(): Promise<unknown> {
    return request('/admin/bot-calendar/connect', { method: 'GET' });
  },

  async handleBotCalendarCallback(code: string, state: string): Promise<unknown> {
    const queryString = new URLSearchParams({ code, state }).toString();
    return request(`/admin/bot-calendar/callback?${queryString}`, {
      method: 'POST',
    });
  },
};

export default adminBotCalendarAPI;
