// API service for Service catalog endpoints

import { API_BASE_URL } from '@/config/api';

class ServicesAPI {
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
      console.error('Services API request failed:', error);
      throw error;
    }
  }

  // List services
  async list(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/crm/services/?${queryString}` : '/crm/services/';
    return this.request(endpoint, { method: 'GET' });
  }

  // Get single service
  async get(serviceId) {
    return this.request(`/crm/services/${serviceId}`, { method: 'GET' });
  }

  // Create new service
  async create(data) {
    return this.request('/crm/services/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update service
  async update(serviceId, data) {
    return this.request(`/crm/services/${serviceId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Delete service
  async delete(serviceId) {
    return this.request(`/crm/services/${serviceId}`, { method: 'DELETE' });
  }

  // Get service enums (statuses, etc.)
  async getEnums() {
    return this.request('/crm/services/enums', { method: 'GET' });
  }
}

export default new ServicesAPI();
