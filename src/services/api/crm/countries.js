// API service for Country endpoints

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://demo-api.zenible.com/api/v1';

class CountriesAPI {
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
      console.error('Countries API request failed:', error);
      throw error;
    }
  }

  // Get list of all countries
  async list() {
    return this.request('/crm/countries/', { method: 'GET' });
  }

  // Get specific country by ID
  async get(countryId) {
    return this.request(`/crm/countries/${countryId}`, { method: 'GET' });
  }

  // Get company-enabled countries
  async getCompanyCountries() {
    return this.request('/crm/countries/company/enabled', { method: 'GET' });
  }

  // Add country to company
  async addCountryToCompany(countryId) {
    return this.request('/crm/countries/company/enabled', {
      method: 'POST',
      body: JSON.stringify({ country_id: countryId }),
    });
  }

  // Remove country from company
  async removeCountryFromCompany(associationId) {
    return this.request(`/crm/countries/company/enabled/${associationId}`, {
      method: 'DELETE',
    });
  }

  // Set country as default for company
  async setDefaultCountry(associationId) {
    return this.request(`/crm/countries/company/enabled/${associationId}/default`, {
      method: 'PATCH',
    });
  }
}

export default new CountriesAPI();
