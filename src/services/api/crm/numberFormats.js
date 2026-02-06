/**
 * Number Formats API Service
 */

import { createRequest } from '../httpClient';

const request = createRequest('NumberFormatsAPI');

const numberFormatsAPI = {
  /** Get list of all number formats */
  list: () => request('/crm/number-formats/', { method: 'GET' }),

  /** Get specific number format by ID */
  get: (formatId) => request(`/crm/number-formats/${formatId}`, { method: 'GET' }),
};

export default numberFormatsAPI;
