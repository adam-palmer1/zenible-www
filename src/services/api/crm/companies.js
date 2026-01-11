// API service for Company endpoints

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://demo-api.zenible.com/api/v1';

class CompaniesAPI {
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
      console.error('Companies API request failed:', error);
      throw error;
    }
  }

  // Get current company (now returns enhanced settings with attributes, currencies, countries)
  async getCurrent() {
    return this.request('/crm/companies/current', { method: 'GET' });
  }

  // Update current company
  async updateCurrent(data) {
    return this.request('/crm/companies/current', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Update company profile
  async updateProfile(data) {
    return this.request('/crm/companies/current/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Update invoice defaults
  async updateInvoiceDefaults(data) {
    return this.request('/crm/companies/current/invoice-defaults', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export default new CompaniesAPI();
