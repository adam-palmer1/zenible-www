/**
 * Company Taxes API Service
 * Handles CRUD operations for company default taxes
 */

import { API_BASE_URL } from '@/config/api';

class TaxesAPI {
  constructor() {
    this.baseEndpoint = '/crm/companies/current/taxes/';
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

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

        if (Array.isArray(error.detail)) {
          const messages = error.detail.map(err => {
            const field = err.loc ? err.loc[err.loc.length - 1] : 'Field';
            return `${field}: ${err.msg}`;
          }).join('; ');
          throw new Error(messages);
        }

        throw new Error(error.detail || `Request failed with status ${response.status}`);
      }

      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('[TaxesAPI] Request failed:', error);
      throw error;
    }
  }

  /**
   * List all company taxes
   * @returns {Promise<Array>} List of tax objects
   */
  async list() {
    return this.request(this.baseEndpoint, { method: 'GET' });
  }

  /**
   * Create a new tax
   * @param {Object} taxData - { tax_name, tax_rate, sort_order? }
   * @returns {Promise<Object>} Created tax
   */
  async create(taxData) {
    return this.request(this.baseEndpoint, {
      method: 'POST',
      body: JSON.stringify(taxData),
    });
  }

  /**
   * Update a tax
   * @param {string} taxId - Tax UUID
   * @param {Object} taxData - { tax_name?, tax_rate?, sort_order? }
   * @returns {Promise<Object>} Updated tax
   */
  async update(taxId, taxData) {
    return this.request(`${this.baseEndpoint}${taxId}/`, {
      method: 'PUT',
      body: JSON.stringify(taxData),
    });
  }

  /**
   * Delete a tax
   * @param {string} taxId - Tax UUID
   * @returns {Promise<void>}
   */
  async delete(taxId) {
    return this.request(`${this.baseEndpoint}${taxId}/`, {
      method: 'DELETE',
    });
  }

  /**
   * Reorder taxes
   * @param {Array} taxes - Array of { id, sort_order } objects
   * @returns {Promise<Array>} Updated list of taxes
   */
  async reorder(taxes) {
    return this.request(`${this.baseEndpoint}reorder/`, {
      method: 'PUT',
      body: JSON.stringify({ taxes }),
    });
  }
}

const taxesAPI = new TaxesAPI();
export default taxesAPI;
