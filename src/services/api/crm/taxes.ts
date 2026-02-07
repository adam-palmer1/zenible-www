/**
 * Company Taxes API Service
 * Handles CRUD operations for company default taxes
 */

import { createRequest } from '../httpClient';

const request = createRequest('TaxesAPI');
const baseEndpoint = '/crm/companies/current/taxes';

const taxesAPI = {
  /**
   * List all company taxes
   * @returns {Promise<Array>} List of tax objects
   */
  list: () => request(`${baseEndpoint}/`, { method: 'GET' }),

  /**
   * Create a new tax
   * @param {Object} taxData - { tax_name, tax_rate, sort_order? }
   * @returns {Promise<Object>} Created tax
   */
  create: (taxData: unknown) => request(`${baseEndpoint}/`, {
    method: 'POST',
    body: JSON.stringify(taxData),
  }),

  /**
   * Update a tax
   * @param {string} taxId - Tax UUID
   * @param {Object} taxData - { tax_name?, tax_rate?, sort_order? }
   * @returns {Promise<Object>} Updated tax
   */
  update: (taxId: string, taxData: unknown) => request(`${baseEndpoint}/${taxId}`, {
    method: 'PUT',
    body: JSON.stringify(taxData),
  }),

  /**
   * Delete a tax
   * @param {string} taxId - Tax UUID
   * @returns {Promise<void>}
   */
  delete: (taxId: string) => request(`${baseEndpoint}/${taxId}`, {
    method: 'DELETE',
  }),

  /**
   * Reorder taxes
   * @param {Array} taxes - Array of { id, sort_order } objects
   * @returns {Promise<Array>} Updated list of taxes
   */
  reorder: (taxes: unknown[]) => request(`${baseEndpoint}/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ taxes }),
  }),
};

export default taxesAPI;
