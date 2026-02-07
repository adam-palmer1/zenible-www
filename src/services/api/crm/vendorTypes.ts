/**
 * Vendor Types API Service
 */

import { createRequest } from '../httpClient';

const request = createRequest('VendorTypesAPI');

const vendorTypesAPI = {
  /** Get list of all vendor types */
  list: () => request('/crm/vendor-types/', { method: 'GET' }),

  /** Get specific vendor type by ID */
  get: (typeId: string) => request(`/crm/vendor-types/${typeId}`, { method: 'GET' }),
};

export default vendorTypesAPI;
