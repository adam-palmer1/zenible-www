/**
 * Industries API Service
 */

import { createRequest } from '../httpClient';

const request = createRequest('IndustriesAPI');

const industriesAPI = {
  /** Get list of all industries */
  list: () => request('/crm/industries/', { method: 'GET' }),

  /** Get specific industry by ID */
  get: (industryId: string) => request(`/crm/industries/${industryId}`, { method: 'GET' }),

  /** Create new industry (admin only) */
  create: (data: unknown) => request('/crm/industries/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /** Update industry (admin only) */
  update: (industryId: string, data: unknown) => request(`/crm/industries/${industryId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  /** Delete industry (admin only) */
  delete: (industryId: string) => request(`/crm/industries/${industryId}`, { method: 'DELETE' }),
};

export default industriesAPI;
