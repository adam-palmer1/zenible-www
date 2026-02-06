/**
 * Services Catalog API Service
 */

import { createRequest, buildQueryString } from '../httpClient';

const request = createRequest('ServicesAPI');

const servicesAPI = {
  /** List services */
  list: (params = {}) => {
    const queryString = buildQueryString(params);
    const endpoint = queryString ? `/crm/services/?${queryString}` : '/crm/services/';
    return request(endpoint, { method: 'GET' });
  },

  /** Get single service */
  get: (serviceId) => request(`/crm/services/${serviceId}`, { method: 'GET' }),

  /** Create new service */
  create: (data) => request('/crm/services/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /** Update service */
  update: (serviceId, data) => request(`/crm/services/${serviceId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  /** Delete service */
  delete: (serviceId) => request(`/crm/services/${serviceId}`, { method: 'DELETE' }),

  /** Get service enums (statuses, etc.) */
  getEnums: () => request('/crm/services/enums', { method: 'GET' }),
};

export default servicesAPI;
