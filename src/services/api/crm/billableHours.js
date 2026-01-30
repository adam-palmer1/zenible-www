// API service for Billable Hours endpoints

import { API_BASE_URL } from '@/config/api';

class BillableHoursAPI {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `Request failed with status ${response.status}`);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('BillableHours API request failed:', error);
      throw error;
    }
  }

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
  async list(projectId, params = {}) {
    const queryParts = [];

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '' || value === 'null') {
        return;
      }
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    });

    const queryString = queryParts.join('&');
    const endpoint = queryString
      ? `/crm/projects/${projectId}/billable-hours?${queryString}`
      : `/crm/projects/${projectId}/billable-hours`;

    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Get a single billable hour entry
   * @param {string} projectId - Project UUID
   * @param {string} entryId - Entry UUID
   * @returns {Promise<Object>} BillableHourResponse
   */
  async get(projectId, entryId) {
    return this.request(`/crm/projects/${projectId}/billable-hours/${entryId}`, {
      method: 'GET',
    });
  }

  /**
   * Create a billable hour entry
   * @param {string} projectId - Project UUID
   * @param {Object} data - Entry data
   * @param {number} data.hours - Hours worked (required, > 0)
   * @param {string} data.description - Brief description (max 500 chars)
   * @param {string} data.notes - Detailed notes
   * @param {string} data.start_time - ISO datetime when work started
   * @param {string} data.end_time - ISO datetime when work ended
   * @param {boolean} data.is_billable - Whether time is billable (default: true)
   * @param {number} data.hourly_rate - Override rate (uses defaulting chain if omitted)
   * @param {string} data.currency_id - Override currency (uses defaulting chain if omitted)
   * @returns {Promise<Object>} Created BillableHourResponse
   */
  async create(projectId, data) {
    return this.request(`/crm/projects/${projectId}/billable-hours`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update a billable hour entry
   * @param {string} projectId - Project UUID
   * @param {string} entryId - Entry UUID
   * @param {Object} data - Fields to update (all optional)
   * @returns {Promise<Object>} Updated BillableHourResponse
   * @note If entry has invoice_id, hours/hourly_rate/description/is_billable are protected
   */
  async update(projectId, entryId, data) {
    return this.request(`/crm/projects/${projectId}/billable-hours/${entryId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete a billable hour entry
   * @param {string} projectId - Project UUID
   * @param {string} entryId - Entry UUID
   * @returns {Promise<null>}
   * @note Cannot delete entries with invoice_id set
   */
  async delete(projectId, entryId) {
    return this.request(`/crm/projects/${projectId}/billable-hours/${entryId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Bulk create billable hour entries
   * @param {string} projectId - Project UUID
   * @param {Array} entries - Array of entry data (1-100 entries)
   * @returns {Promise<Array>} Array of created BillableHourResponse
   */
  async bulkCreate(projectId, entries) {
    return this.request(`/crm/projects/${projectId}/billable-hours/bulk`, {
      method: 'POST',
      body: JSON.stringify({ entries }),
    });
  }

  /**
   * Link entry to an invoice
   * @param {string} projectId - Project UUID
   * @param {string} entryId - Entry UUID
   * @param {string} invoiceId - Invoice UUID to link
   * @returns {Promise<Object>} Updated BillableHourResponse
   */
  async linkToInvoice(projectId, entryId, invoiceId) {
    return this.update(projectId, entryId, { invoice_id: invoiceId });
  }

  /**
   * Unlink entry from invoice
   * @param {string} projectId - Project UUID
   * @param {string} entryId - Entry UUID
   * @returns {Promise<Object>} Updated BillableHourResponse
   */
  async unlinkFromInvoice(projectId, entryId) {
    return this.update(projectId, entryId, { invoice_id: null });
  }

  /**
   * Get billable hours for a contact (across all their projects)
   * @param {string} contactId - Contact UUID
   * @param {Object} params - Query parameters
   * @param {boolean} params.uninvoiced_only - Show only unbilled entries (default: false)
   * @param {boolean} params.is_billable - Filter by billable status
   * @param {string} params.invoice_id - Filter by linked invoice
   * @param {string} params.project_id - Filter by specific project
   * @returns {Promise<Object>} { items, total, total_hours, total_amount, uninvoiced_hours, uninvoiced_amount }
   */
  async getByContact(contactId, params = {}) {
    const queryParts = [];

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '' || value === 'null') {
        return;
      }
      queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    });

    const queryString = queryParts.join('&');
    const endpoint = queryString
      ? `/crm/contacts/${contactId}/billable-hours?${queryString}`
      : `/crm/contacts/${contactId}/billable-hours`;

    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Bulk update billable hours for a contact (link/unlink from invoice)
   * @param {string} contactId - Contact UUID
   * @param {Array<string>} entryIds - Array of billable hour entry UUIDs (max 100)
   * @param {string|null} invoiceId - Invoice UUID to link, or null to unlink
   * @returns {Promise<Object>} { updated_count, entry_ids, invoice_id }
   */
  async bulkUpdateByContact(contactId, entryIds, invoiceId) {
    return this.request(`/crm/contacts/${contactId}/billable-hours/bulk`, {
      method: 'PATCH',
      body: JSON.stringify({
        entry_ids: entryIds,
        invoice_id: invoiceId,
      }),
    });
  }
}

export const billableHoursAPI = new BillableHoursAPI();
export default billableHoursAPI;
