/**
 * Employee Ranges API Service
 */

import { createRequest } from '../httpClient';

const request = createRequest('EmployeeRangesAPI');

const employeeRangesAPI = {
  /** Get list of all employee ranges */
  list: () => request('/crm/employee-ranges/', { method: 'GET' }),

  /** Get specific employee range by ID */
  get: (rangeId) => request(`/crm/employee-ranges/${rangeId}`, { method: 'GET' }),
};

export default employeeRangesAPI;
