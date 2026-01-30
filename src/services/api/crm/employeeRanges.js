// API service for Employee Range endpoints

import { API_BASE_URL } from '@/config/api';

class EmployeeRangesAPI {
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
      console.error('Employee Ranges API request failed:', error);
      throw error;
    }
  }

  // Get list of all employee ranges
  async list() {
    return this.request('/crm/employee-ranges/', { method: 'GET' });
  }

  // Get specific employee range by ID
  async get(rangeId) {
    return this.request(`/crm/employee-ranges/${rangeId}`, { method: 'GET' });
  }
}

export default new EmployeeRangesAPI();
