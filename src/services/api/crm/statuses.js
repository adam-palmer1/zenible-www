// API service for Contact Status endpoints

import { API_BASE_URL } from '@/config/api';

class StatusesAPI {
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
      console.error('Statuses API request failed:', error);
      throw error;
    }
  }

  // Get all available statuses (global + custom)
  async getAvailable() {
    return this.request('/crm/statuses/available', { method: 'GET' });
  }

  // Update global status (friendly_name, color, tooltip)
  async updateGlobal(statusId, data) {
    return this.request(`/crm/statuses/global/${statusId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Create custom status
  async createCustom(data) {
    return this.request('/crm/statuses/custom', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update custom status
  async updateCustom(statusId, data) {
    return this.request(`/crm/statuses/custom/${statusId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Delete custom status
  async deleteCustom(statusId) {
    return this.request(`/crm/statuses/custom/${statusId}`, { method: 'DELETE' });
  }
}

export default new StatusesAPI();
