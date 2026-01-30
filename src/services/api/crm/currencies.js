// API service for Currency endpoints

import { API_BASE_URL } from '@/config/api';

class CurrenciesAPI {
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
      console.error('Currencies API request failed:', error);
      throw error;
    }
  }

  // List all active currencies
  async list() {
    return this.request('/crm/currencies/', { method: 'GET' });
  }

  // Get company-enabled currencies
  async getCompanyCurrencies() {
    return this.request('/crm/currencies/company/enabled', { method: 'GET' });
  }

  // Add currency to company
  async addCurrencyToCompany(currencyId) {
    return this.request('/crm/currencies/company/enabled', {
      method: 'POST',
      body: JSON.stringify({ currency_id: currencyId }),
    });
  }

  // Remove currency from company
  async removeCurrencyFromCompany(associationId) {
    return this.request(`/crm/currencies/company/enabled/${associationId}`, {
      method: 'DELETE',
    });
  }

  // Set currency as default for company
  async setDefaultCurrency(associationId) {
    return this.request(`/crm/currencies/company/enabled/${associationId}/default`, {
      method: 'PATCH',
    });
  }

  // Get company attribute by name
  async getCompanyAttribute(attributeName) {
    return this.request(`/crm/companies/current/attributes/${attributeName}`, {
      method: 'GET',
    });
  }

  // Get number format attribute
  async getNumberFormat() {
    return this.getCompanyAttribute('number_format');
  }
}

export default new CurrenciesAPI();
