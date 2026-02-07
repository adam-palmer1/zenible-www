/**
 * Company Attributes API Service
 */

import { createRequest } from '../httpClient';

const request = createRequest('CompanyAttributesAPI');

const companyAttributesAPI = {
  /** Get all attributes for current company */
  getAll: () => request('/crm/companies/current/attributes/', { method: 'GET' }),

  /** Get specific attribute by name */
  get: (attributeName: string) => request(`/crm/companies/current/attributes/${attributeName}`, {
    method: 'GET',
  }),

  /** Create or update attribute */
  set: (attributeName: string, attributeValue: unknown, description: string | null = null) => request('/crm/companies/current/attributes/', {
    method: 'POST',
    body: JSON.stringify({
      attribute_name: attributeName,
      attribute_value: attributeValue,
      description,
    }),
  }),

  /** Batch update multiple attributes */
  batchUpdate: (attributes: unknown[]) => request('/crm/companies/current/attributes/batch', {
    method: 'PUT',
    body: JSON.stringify({ attributes }),
  }),

  /** Delete attribute */
  delete: (attributeName: string) => request(`/crm/companies/current/attributes/${attributeName}`, {
    method: 'DELETE',
  }),

  /** Get industry attribute */
  getIndustry: () => request('/crm/companies/current/attributes/industry/current', {
    method: 'GET',
  }),

  /** Set industry attribute */
  setIndustry: (industryId: string) => request('/crm/companies/current/attributes/industry/current', {
    method: 'PUT',
    body: JSON.stringify(industryId),
  }),

  /** Get employee count attribute */
  getEmployeeCount: () => request('/crm/companies/current/attributes/employee-count/current', {
    method: 'GET',
  }),

  /** Set employee count attribute */
  setEmployeeCount: (employeeRangeId: string) => request('/crm/companies/current/attributes/employee-count/current', {
    method: 'PUT',
    body: JSON.stringify(employeeRangeId),
  }),
};

export default companyAttributesAPI;
