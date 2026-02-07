/**
 * Billable Hours API Service
 */

import { createRequest, buildQueryString } from '../httpClient';

const request = createRequest('BillableHoursAPI');

const billableHoursAPI = {
  /**
   * List billable hour entries for a project
   * @param {string} projectId - Project UUID
   * @param {Object} params - Query parameters
   * @param {boolean} params.is_billable - Filter by billable status
   * @param {string} params.invoice_id - Filter by linked invoice
   * @param {boolean} params.uninvoiced_only - Show only uninvoiced entries
   * @param {string} params.start_date - Filter entries with start_time >= date
   * @param {string} params.end_date - Filter entries with start_time <= date
   * @returns {Promise<Object>} { items, total, total_hours, total_amount, uninvoiced_hours, uninvoiced_amount }
   */
  list: (projectId: string, params: Record<string, unknown> = {}) => {
    const queryString = buildQueryString(params as Record<string, string>);
    const endpoint = queryString
      ? `/crm/projects/${projectId}/billable-hours?${queryString}`
      : `/crm/projects/${projectId}/billable-hours`;
    return request(endpoint, { method: 'GET' });
  },

  /**
   * Get a single billable hour entry
   * @param {string} projectId - Project UUID
   * @param {string} entryId - Entry UUID
   * @returns {Promise<Object>} BillableHourResponse
   */
  get: (projectId: string, entryId: string) => request(`/crm/projects/${projectId}/billable-hours/${entryId}`, {
    method: 'GET',
  }),

  /**
   * Create a billable hour entry
   * @param {string} projectId - Project UUID
   * @param {Object} data - Entry data
   * @returns {Promise<Object>} Created BillableHourResponse
   */
  create: (projectId: string, data: unknown) => request(`/crm/projects/${projectId}/billable-hours`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  /**
   * Update a billable hour entry
   * @param {string} projectId - Project UUID
   * @param {string} entryId - Entry UUID
   * @param {Object} data - Fields to update (all optional)
   * @returns {Promise<Object>} Updated BillableHourResponse
   */
  update: (projectId: string, entryId: string, data: unknown) => request(`/crm/projects/${projectId}/billable-hours/${entryId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),

  /**
   * Delete a billable hour entry
   * @param {string} projectId - Project UUID
   * @param {string} entryId - Entry UUID
   * @returns {Promise<null>}
   */
  delete: (projectId: string, entryId: string) => request(`/crm/projects/${projectId}/billable-hours/${entryId}`, {
    method: 'DELETE',
  }),

  /**
   * Bulk create billable hour entries
   * @param {string} projectId - Project UUID
   * @param {Array} entries - Array of entry data (1-100 entries)
   * @returns {Promise<Array>} Array of created BillableHourResponse
   */
  bulkCreate: (projectId: string, entries: unknown[]) => request(`/crm/projects/${projectId}/billable-hours/bulk`, {
    method: 'POST',
    body: JSON.stringify({ entries }),
  }),

  /**
   * Link entry to an invoice
   * @param {string} projectId - Project UUID
   * @param {string} entryId - Entry UUID
   * @param {string} invoiceId - Invoice UUID to link
   * @returns {Promise<Object>} Updated BillableHourResponse
   */
  linkToInvoice: function(projectId: string, entryId: string, invoiceId: string) {
    return this.update(projectId, entryId, { invoice_id: invoiceId });
  },

  /**
   * Unlink entry from invoice
   * @param {string} projectId - Project UUID
   * @param {string} entryId - Entry UUID
   * @returns {Promise<Object>} Updated BillableHourResponse
   */
  unlinkFromInvoice: function(projectId: string, entryId: string) {
    return this.update(projectId, entryId, { invoice_id: null });
  },

  /**
   * Get billable hours for a contact (across all their projects)
   * @param {string} contactId - Contact UUID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} { items, total, total_hours, total_amount, uninvoiced_hours, uninvoiced_amount }
   */
  getByContact: (contactId: string, params: Record<string, unknown> = {}) => {
    const queryString = buildQueryString(params as Record<string, string>);
    const endpoint = queryString
      ? `/crm/contacts/${contactId}/billable-hours?${queryString}`
      : `/crm/contacts/${contactId}/billable-hours`;
    return request(endpoint, { method: 'GET' });
  },

  /**
   * Bulk update billable hours for a contact (link/unlink from invoice)
   * @param {string} contactId - Contact UUID
   * @param {Array<string>} entryIds - Array of billable hour entry UUIDs (max 100)
   * @param {string|null} invoiceId - Invoice UUID to link, or null to unlink
   * @returns {Promise<Object>} { updated_count, entry_ids, invoice_id }
   */
  bulkUpdateByContact: (contactId: string, entryIds: string[], invoiceId: string | null) => request(`/crm/contacts/${contactId}/billable-hours/bulk`, {
    method: 'PATCH',
    body: JSON.stringify({
      entry_ids: entryIds,
      invoice_id: invoiceId,
    }),
  }),
};

export { billableHoursAPI };
export default billableHoursAPI;
