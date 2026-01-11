// API service for Vendor Type endpoints

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://demo-api.zenible.com/api/v1';

class VendorTypesAPI {
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
      console.error('Vendor Types API request failed:', error);
      throw error;
    }
  }

  // Get list of all vendor types
  async list() {
    return this.request('/crm/vendor-types/', { method: 'GET' });
  }

  // Get specific vendor type by ID
  async get(typeId) {
    return this.request(`/crm/vendor-types/${typeId}`, { method: 'GET' });
  }
}

export default new VendorTypesAPI();
