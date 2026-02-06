// API service for Company endpoints

import { API_BASE_URL } from '@/config/api';

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

  // Logo upload (uses FormData, not JSON)
  async uploadLogo(file) {
    const url = `${API_BASE_URL}/crm/companies/current/logo`;
    const formData = new FormData();
    formData.append('logo', file);

    const token = localStorage.getItem('access_token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
        throw new Error(error.detail || 'Failed to upload logo');
      }

      return await response.json();
    } catch (error) {
      console.error('Logo upload failed:', error);
      throw error;
    }
  }

  // Delete logo
  async deleteLogo() {
    return this.request('/crm/companies/current/logo', {
      method: 'DELETE',
    });
  }
}

export default new CompaniesAPI();
