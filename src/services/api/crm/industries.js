// API service for Industry endpoints

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://demo-api.zenible.com/api/v1';

class IndustriesAPI {
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
      console.error('Industries API request failed:', error);
      throw error;
    }
  }

  // Get list of all industries
  async list() {
    return this.request('/crm/industries/', { method: 'GET' });
  }

  // Get specific industry by ID
  async get(industryId) {
    return this.request(`/crm/industries/${industryId}`, { method: 'GET' });
  }

  // Create new industry (admin only)
  async create(data) {
    return this.request('/crm/industries/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update industry (admin only)
  async update(industryId, data) {
    return this.request(`/crm/industries/${industryId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Delete industry (admin only)
  async delete(industryId) {
    return this.request(`/crm/industries/${industryId}`, { method: 'DELETE' });
  }
}

export default new IndustriesAPI();
