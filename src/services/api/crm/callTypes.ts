/**
 * Call Types API Service
 */

import { createRequest, buildQueryString } from '../httpClient';

const request = createRequest('CallTypesAPI');

const callTypesAPI = {
  /** List call types */
  list: (params: Record<string, unknown> = {}) => {
    const queryString = buildQueryString(params as Record<string, string>);
    const endpoint = queryString ? `/crm/call-types?${queryString}` : '/crm/call-types';
    return request(endpoint, { method: 'GET' });
  },

  /** Get single call type */
  get: (callTypeId: string) => request(`/crm/call-types/${callTypeId}`, { method: 'GET' }),

  /** Create new call type */
  create: (data: unknown) => request('/crm/call-types', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /** Update call type */
  update: (callTypeId: string, data: unknown) => request(`/crm/call-types/${callTypeId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  /** Delete call type */
  delete: (callTypeId: string) => request(`/crm/call-types/${callTypeId}`, { method: 'DELETE' }),

  /** Get call type overrides */
  getOverrides: (callTypeId: string) => request(`/crm/call-types/${callTypeId}/overrides`, { method: 'GET' }),

  /** Set call type overrides */
  setOverrides: (callTypeId: string, data: unknown) => request(`/crm/call-types/${callTypeId}/overrides`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  /** Delete call type overrides */
  deleteOverrides: (callTypeId: string) => request(`/crm/call-types/${callTypeId}/overrides`, { method: 'DELETE' }),

  /** Get call type specific availability windows */
  getAvailability: (callTypeId: string) => request(`/crm/call-types/${callTypeId}/availability`, { method: 'GET' }),
};

export default callTypesAPI;
