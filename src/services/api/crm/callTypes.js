// API service for Call Types endpoints

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://demo-api.zenible.com/api/v1';

class CallTypesAPI {
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
      console.error('CallTypes API request failed:', error);
      throw error;
    }
  }

  // List call types
  async list(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/crm/call-types?${queryString}` : '/crm/call-types';
    return this.request(endpoint, { method: 'GET' });
  }

  // Get single call type
  async get(callTypeId) {
    return this.request(`/crm/call-types/${callTypeId}`, { method: 'GET' });
  }

  // Create new call type
  async create(data) {
    return this.request('/crm/call-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update call type
  async update(callTypeId, data) {
    return this.request(`/crm/call-types/${callTypeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete call type
  async delete(callTypeId) {
    return this.request(`/crm/call-types/${callTypeId}`, { method: 'DELETE' });
  }

  // Get call type overrides
  async getOverrides(callTypeId) {
    return this.request(`/crm/call-types/${callTypeId}/overrides`, { method: 'GET' });
  }

  // Set call type overrides
  async setOverrides(callTypeId, data) {
    return this.request(`/crm/call-types/${callTypeId}/overrides`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete call type overrides
  async deleteOverrides(callTypeId) {
    return this.request(`/crm/call-types/${callTypeId}/overrides`, { method: 'DELETE' });
  }

  // Get call type specific availability windows
  async getAvailability(callTypeId) {
    return this.request(`/crm/call-types/${callTypeId}/availability`, { method: 'GET' });
  }
}

export default new CallTypesAPI();
