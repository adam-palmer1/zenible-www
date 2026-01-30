/**
 * Credit Notes API Service
 * Handles all credit note-related API operations
 */

import { API_BASE_URL } from '@/config/api';

/**
 * Base API request handler
 */
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('access_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(data?.detail || data?.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[CreditNotesAPI] Request error:', error);
    throw error;
  }
};

/**
 * Credit Notes API Client
 */
class CreditNotesAPI {
  constructor() {
    this.baseEndpoint = '/crm/credit-notes/';
  }

  /**
   * List credit notes with filtering and pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Credit notes list response
   */
  async list(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `${this.baseEndpoint}?${queryString}` : this.baseEndpoint;

    return request(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get a single credit note
   * @param {string} creditNoteId - Credit note ID
   * @returns {Promise<Object>} Credit note
   */
  async get(creditNoteId) {
    return request(`${this.baseEndpoint}${creditNoteId}`, {
      method: 'GET',
    });
  }

  /**
   * Create a new credit note
   * @param {Object} creditNoteData - Credit note data
   * @returns {Promise<Object>} Created credit note
   */
  async create(creditNoteData) {
    return request(this.baseEndpoint, {
      method: 'POST',
      body: JSON.stringify(creditNoteData),
    });
  }

  /**
   * Update a credit note
   * @param {string} creditNoteId - Credit note ID
   * @param {Object} creditNoteData - Updated credit note data
   * @returns {Promise<Object>} Updated credit note
   */
  async update(creditNoteId, creditNoteData) {
    return request(`${this.baseEndpoint}${creditNoteId}`, {
      method: 'PUT',
      body: JSON.stringify(creditNoteData),
    });
  }

  /**
   * Delete a credit note
   * @param {string} creditNoteId - Credit note ID
   * @returns {Promise<void>}
   */
  async delete(creditNoteId) {
    return request(`${this.baseEndpoint}${creditNoteId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get next available credit note number
   * @returns {Promise<Object>} { next_number: "CN-0042", prefix: "CN" }
   */
  async getNextNumber() {
    return request(`${this.baseEndpoint}next-number`, {
      method: 'GET',
    });
  }

  /**
   * Get credit note statistics summary
   * @returns {Promise<Object>} Stats response
   */
  async getStats() {
    return request(`${this.baseEndpoint}stats/summary`, {
      method: 'GET',
    });
  }

  /**
   * Issue a credit note (change status from draft to issued)
   * @param {string} creditNoteId - Credit note ID
   * @returns {Promise<Object>} Updated credit note
   */
  async issue(creditNoteId) {
    return request(`${this.baseEndpoint}${creditNoteId}/issue`, {
      method: 'POST',
    });
  }

  /**
   * Void a credit note (mark as void/cancelled)
   * @param {string} creditNoteId - Credit note ID
   * @returns {Promise<Object>} Updated credit note
   */
  async void(creditNoteId) {
    return request(`${this.baseEndpoint}${creditNoteId}/void`, {
      method: 'POST',
    });
  }

  /**
   * Send a credit note via email
   * @param {string} creditNoteId - Credit note ID
   * @param {Object} sendData - Send options { email?: string, message?: string }
   * @returns {Promise<Object>} Updated credit note
   */
  async send(creditNoteId, sendData = {}) {
    return request(`${this.baseEndpoint}${creditNoteId}/send`, {
      method: 'POST',
      body: JSON.stringify(sendData),
    });
  }

  /**
   * Download credit note PDF
   * @param {string} creditNoteId - Credit note ID
   * @param {string} creditNoteNumber - Credit note number for filename
   * @returns {Promise<void>}
   */
  async downloadPdf(creditNoteId, creditNoteNumber = '') {
    const url = `${API_BASE_URL}${this.baseEndpoint}${creditNoteId}/pdf`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.detail || 'Failed to download PDF');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `CreditNote-${creditNoteNumber || creditNoteId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // ========== Project Allocation Endpoints ==========

  /**
   * Get project allocations for a credit note
   * @param {string} creditNoteId - Credit note UUID
   * @returns {Promise<Object>} { allocations: [...], total_percentage: number, total_allocated_amount: number }
   */
  async getAllocations(creditNoteId) {
    return request(`${this.baseEndpoint}${creditNoteId}/allocations`, {
      method: 'GET',
    });
  }

  /**
   * Update project allocations for a credit note (replaces all existing allocations)
   * @param {string} creditNoteId - Credit note UUID
   * @param {Array} allocations - Array of { project_id, percentage }
   * @returns {Promise<Object>} Updated allocations
   */
  async updateAllocations(creditNoteId, allocations) {
    return request(`${this.baseEndpoint}${creditNoteId}/allocations`, {
      method: 'PUT',
      body: JSON.stringify({ allocations }),
    });
  }

  /**
   * Delete all project allocations for a credit note
   * @param {string} creditNoteId - Credit note UUID
   * @returns {Promise<void>}
   */
  async deleteAllocations(creditNoteId) {
    return request(`${this.baseEndpoint}${creditNoteId}/allocations`, {
      method: 'DELETE',
    });
  }
}

// Export singleton instance
const creditNotesAPI = new CreditNotesAPI();
export default creditNotesAPI;
