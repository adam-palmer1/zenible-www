/**
 * Shared HTTP Client for API Services
 * Consolidates common request logic, error handling, and utilities
 */

import { API_BASE_URL } from '@/config/api';

/**
 * Clean parameters by removing null, undefined, empty strings, and 'null' strings
 * @param {Object} params - Parameters to clean
 * @returns {Object} Cleaned parameters
 */
export const cleanParams = (params) => {
  return Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== null && value !== undefined && value !== '' && value !== 'null') {
      acc[key] = value;
    }
    return acc;
  }, {});
};

/**
 * Build query string from parameters
 * Handles arrays by repeating the key for each value
 * @param {Object} params - Parameters to convert
 * @returns {string} Query string (without leading ?)
 */
export const buildQueryString = (params) => {
  const cleaned = cleanParams(params);
  const parts = [];

  for (const [key, value] of Object.entries(cleaned)) {
    if (Array.isArray(value)) {
      value.forEach(v => parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`));
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }

  return parts.join('&');
};

/**
 * Format Pydantic validation errors into a readable message
 * @param {Array} errors - Array of validation error objects
 * @returns {string} Formatted error message
 */
const formatValidationErrors = (errors) => {
  return errors.map(err => {
    const field = err.loc ? err.loc[err.loc.length - 1] : 'Field';
    return `${field}: ${err.msg}`;
  }).join('; ');
};

/**
 * Create an API request function with optional context for logging
 * @param {string} context - Context name for error logging (e.g., 'InvoicesAPI')
 * @returns {Function} Request function
 */
export const createRequest = (context = 'API') => {
  return async (endpoint, options = {}) => {
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

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        let errorMessage;

        // Handle Pydantic validation errors (detail is an array)
        if (Array.isArray(data?.detail)) {
          errorMessage = formatValidationErrors(data.detail);
        } else {
          errorMessage = data?.detail || data?.message || `Request failed with status ${response.status}`;
        }

        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`[${context}] Request failed:`, error);
      throw error;
    }
  };
};

/**
 * Default request function for simple use cases
 */
export const request = createRequest();

/**
 * Base class for API services with common CRUD operations
 * Extend this class to create specific API services
 */
export class BaseAPI {
  constructor(baseEndpoint, context = 'API') {
    this.baseEndpoint = baseEndpoint;
    this.request = createRequest(context);
  }

  /**
   * List all items with optional query parameters
   * @param {Object} params - Query parameters
   * @returns {Promise<Array|Object>} List of items or paginated response
   */
  async list(params = {}) {
    const queryString = buildQueryString(params);
    const endpoint = queryString
      ? `${this.baseEndpoint}?${queryString}`
      : this.baseEndpoint;
    return this.request(endpoint, { method: 'GET' });
  }

  /**
   * Get a single item by ID
   * @param {string} id - Item ID
   * @returns {Promise<Object>} Item data
   */
  async get(id) {
    return this.request(`${this.baseEndpoint}/${id}`, { method: 'GET' });
  }

  /**
   * Create a new item
   * @param {Object} data - Item data
   * @returns {Promise<Object>} Created item
   */
  async create(data) {
    return this.request(this.baseEndpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Update an item by ID
   * @param {string} id - Item ID
   * @param {Object} data - Updated data
   * @returns {Promise<Object>} Updated item
   */
  async update(id, data) {
    return this.request(`${this.baseEndpoint}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Partially update an item by ID
   * @param {string} id - Item ID
   * @param {Object} data - Partial data
   * @returns {Promise<Object>} Updated item
   */
  async patch(id, data) {
    return this.request(`${this.baseEndpoint}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /**
   * Delete an item by ID
   * @param {string} id - Item ID
   * @returns {Promise<null>} Null on success
   */
  async delete(id) {
    return this.request(`${this.baseEndpoint}/${id}`, {
      method: 'DELETE',
    });
  }
}

export default {
  request,
  createRequest,
  cleanParams,
  buildQueryString,
  BaseAPI,
};
