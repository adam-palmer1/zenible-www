/**
 * Email Templates API Service
 */

import { createRequest, buildQueryString } from '../httpClient';

const request = createRequest('EmailTemplatesAPI');

const emailTemplatesAPI = {
  /** List all templates for company */
  list: (params = {}) => {
    const queryString = buildQueryString(params);
    const endpoint = `/crm/email-templates/${queryString ? `?${queryString}` : ''}`;
    return request(endpoint, { method: 'GET' });
  },

  /** Get template by ID */
  get: (id) => request(`/crm/email-templates/${id}`, { method: 'GET' }),

  /** Create new template */
  create: (data) => request('/crm/email-templates/', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /** Update template */
  update: (id, data) => request(`/crm/email-templates/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  /** Delete template (soft delete) */
  delete: (id) => request(`/crm/email-templates/${id}`, { method: 'DELETE' }),

  /** Preview template with variables */
  preview: (id, variables) => request(`/crm/email-templates/${id}/preview`, {
    method: 'POST',
    body: JSON.stringify({ variables }),
  }),

  /** Get available variables for template type */
  getVariables: (templateType) => request(`/crm/email-templates/variables/${templateType}`, {
    method: 'GET',
  }),

  /** Get effective template (company or system default) */
  getEffective: (templateType) => request(`/crm/email-templates/effective/${templateType}`, {
    method: 'GET',
  }),
};

export default emailTemplatesAPI;
