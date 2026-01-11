/**
 * Credit Notes API Service
 * Handles all credit note-related API operations
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
}

// Export singleton instance
const creditNotesAPI = new CreditNotesAPI();
export default creditNotesAPI;
