/**
 * Statuses API Service
 * Handles contact status management (global + custom)
 */

import { createRequest } from '../httpClient';

const request = createRequest('StatusesAPI');

const statusesAPI = {
  /** Get all available statuses (global + custom) */
  getAvailable: () => request('/crm/statuses/available', { method: 'GET' }),

  /** Update global status (friendly_name, color, tooltip) */
  updateGlobal: (statusId, data) => request(`/crm/statuses/global/${statusId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  /** Create custom status */
  createCustom: (data) => request('/crm/statuses/custom', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /** Update custom status */
  updateCustom: (statusId, data) => request(`/crm/statuses/custom/${statusId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  /** Delete custom status */
  deleteCustom: (statusId) => request(`/crm/statuses/custom/${statusId}`, {
    method: 'DELETE',
  }),
};

export default statusesAPI;
