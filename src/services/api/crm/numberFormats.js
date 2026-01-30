// API service for Number Format endpoints

import { API_BASE_URL } from '@/config/api';

class NumberFormatsAPI {
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

      return await response.json();
    } catch (error) {
      console.error('Number Formats API request failed:', error);
      throw error;
    }
  }

  // Get list of all number formats
  async list() {
    return this.request('/crm/number-formats/', { method: 'GET' });
  }

  // Get specific number format by ID
  async get(formatId) {
    return this.request(`/crm/number-formats/${formatId}`, { method: 'GET' });
  }
}

export default new NumberFormatsAPI();
