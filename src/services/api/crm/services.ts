/**
 * Services Catalog API Service
 */

import { createRequest, buildQueryString } from '../httpClient';

const request = createRequest('ServicesAPI');

const servicesAPI = {
  /** List services */
  list: (params: Record<string, unknown> = {}) => {
    const queryString = buildQueryString(params as Record<string, string>);
    const endpoint = queryString ? `/crm/services/?${queryString}` : '/crm/services/';
    return request(endpoint, { method: 'GET' });
  },

  /** Get single service */
  get: (serviceId: string) => request(`/crm/services/${serviceId}`, { method: 'GET' }),

  /** Create new service */
  create: (data: unknown) => request('/crm/services/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /** Update service */
  update: (serviceId: string, data: unknown) => request(`/crm/services/${serviceId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  /** Delete service */
  delete: (serviceId: string) => request(`/crm/services/${serviceId}`, { method: 'DELETE' }),

  /** Get service enums (statuses, etc.) */
  getEnums: () => request('/crm/services/enums', { method: 'GET' }),
};

export default servicesAPI;
