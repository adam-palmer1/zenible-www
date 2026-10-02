/**
 * Zoom Integration API Service
 *
 * Zoom is connected with per-user Server-to-Server OAuth credentials, so there
 * is no redirect flow — credentials are posted directly and validated server
 * side against Zoom before they are stored.
 */

import { createRequest } from '../httpClient';

const request = createRequest('ZoomAPI');

export interface ZoomStatus {
  is_connected: boolean;
  account?: {
    id: string;
    zoom_user_id: string;
    zoom_email?: string | null;
    account_id: string;
    is_active: boolean;
  } | null;
}

export interface ZoomConnectResult {
  success: boolean;
  message: string;
  zoom_email?: string | null;
}

const zoomAPI = {
  /** Save and validate Server-to-Server credentials. */
  connect: (accountId: string, clientId: string, clientSecret: string) =>
    request('/crm/zoom/connect', {
      method: 'POST',
      body: JSON.stringify({
        account_id: accountId,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    }) as Promise<ZoomConnectResult>,

  /** Current connection status. */
  getStatus: () => request('/crm/zoom/status', { method: 'GET' }) as Promise<ZoomStatus>,

  /** Re-validate the stored credentials against Zoom. */
  test: () => request('/crm/zoom/test', { method: 'POST', body: JSON.stringify({}) }) as Promise<ZoomConnectResult>,

  /** Remove the stored credentials. */
  disconnect: () => request('/crm/zoom/disconnect', { method: 'DELETE' }),
};

export default zoomAPI;
