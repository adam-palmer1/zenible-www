/**
 * Contact Statuses API Service
 * Handles contact-specific status management
 */

import { createRequest } from '../httpClient';

const request = createRequest('ContactStatusesAPI');

const contactStatusesAPI = {
  /** Get all available statuses (global + custom) */
  getAvailableStatuses: () => request('/crm/contact-statuses/available', { method: 'GET' }),

  /** Create a custom status */
  createCustomStatus: (statusData) => request('/crm/contact-statuses/custom', {
    method: 'POST',
    body: JSON.stringify(statusData),
  }),

  /** Update a custom status (including renaming) */
  updateCustomStatus: (statusId, statusData) => request(`/crm/contact-statuses/custom/${statusId}`, {
    method: 'PATCH',
    body: JSON.stringify(statusData),
  }),

  /** Delete a custom status */
  deleteCustomStatus: (statusId) => request(`/crm/contact-statuses/custom/${statusId}`, {
    method: 'DELETE',
  }),
};

export default contactStatusesAPI;
