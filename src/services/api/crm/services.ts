/**
 * Services Catalog API Service
 */

import { createRequest, buildQueryString } from '../httpClient';
import type { PaginatedResponse } from '@/types';

const request = createRequest('ServicesAPI');

/** Shape of a single service entry (kept loose here; full typing via hooks). */
type ServiceEntry = unknown;

const servicesAPI = {
  /** List services (paginated). */
  list: (params: Record<string, unknown> = {}): Promise<PaginatedResponse<ServiceEntry>> => {
    const queryString = buildQueryString(params as Record<string, string>);
    const endpoint = queryString ? `/crm/services/?${queryString}` : '/crm/services/';
    return request(endpoint, { method: 'GET' }) as Promise<PaginatedResponse<ServiceEntry>>;
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
