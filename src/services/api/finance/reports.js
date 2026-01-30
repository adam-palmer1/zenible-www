/**
 * Financial Reports API Service
 * Unified financial reporting endpoints
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
    console.error('[ReportsAPI] Request error:', error);
    throw error;
  }
};

/**
 * Build query string from params object
 * Handles arrays by repeating the key
 */
const buildQueryString = (params) => {
  const urlParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach((v) => urlParams.append(key, v));
    } else {
      urlParams.set(key, String(value));
    }
  });

  return urlParams.toString();
};

/**
 * Financial Reports API Client
 */
class ReportsAPI {
  constructor() {
    this.baseEndpoint = '/crm/reports';
  }

  /**
   * List transactions with filtering and pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} { items, total, page, per_page, total_pages }
   */
  async listTransactions(params = {}) {
    const queryString = buildQueryString(params);
    const endpoint = queryString
      ? `${this.baseEndpoint}/transactions?${queryString}`
      : `${this.baseEndpoint}/transactions`;

    return request(endpoint, { method: 'GET' });
  }

  /**
   * Get transaction summary (aggregated statistics)
   * @param {Object} params - Filter parameters
   * @returns {Promise<Object>} TransactionSummary
   */
  async getSummary(params = {}) {
    const queryString = buildQueryString(params);
    const endpoint = queryString
      ? `${this.baseEndpoint}/transactions/summary?${queryString}`
      : `${this.baseEndpoint}/transactions/summary`;

    return request(endpoint, { method: 'GET' });
  }

  /**
   * Get full report (transactions + summary)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} { transactions, summary }
   */
  async getReport(params = {}) {
    const queryString = buildQueryString(params);
    const endpoint = queryString
      ? `${this.baseEndpoint}/transactions/report?${queryString}`
      : `${this.baseEndpoint}/transactions/report`;

    return request(endpoint, { method: 'GET' });
  }

  /**
   * Get quick counts by transaction type
   * @returns {Promise<Object>} { invoice, quote, expense, credit_note, payment, total }
   */
  async getCounts() {
    return request(`${this.baseEndpoint}/transactions/counts`, { method: 'GET' });
  }

  /**
   * Export transactions as CSV or PDF
   * @param {Object} params - Filter parameters + format
   * @returns {Promise<Blob>} File blob
   */
  async export(params = {}) {
    const queryString = buildQueryString(params);
    const url = `${API_BASE_URL}${this.baseEndpoint}/transactions/export?${queryString}`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export transactions');
    }

    return response.blob();
  }
}

const reportsAPI = new ReportsAPI();
export default reportsAPI;
