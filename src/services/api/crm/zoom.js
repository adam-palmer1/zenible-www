/**
 * Zoom Integration API Service
 */

import { createRequest } from '../httpClient';

const request = createRequest('ZoomAPI');

const zoomAPI = {
  /** Initiate Zoom OAuth connection */
  getConnectUrl: () => request('/crm/zoom/connect', { method: 'GET' }),

  /** Handle OAuth callback */
  handleCallback: (code, state) => request('/crm/zoom/callback', {
    method: 'POST',
    body: JSON.stringify({ code, state }),
  }),

  /** Get connection status */
  getStatus: () => request('/crm/zoom/status', { method: 'GET' }),

  /** Disconnect Zoom */
  disconnect: () => request('/crm/zoom/disconnect', { method: 'DELETE' }),
};

export default zoomAPI;
