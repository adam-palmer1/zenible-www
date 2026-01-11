// API service for Company Attribute endpoints

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://demo-api.zenible.com/api/v1';

class CompanyAttributesAPI {
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
      console.error('Company Attributes API request failed:', error);
      throw error;
    }
  }

  // Get all attributes for current company
  async getAll() {
    return this.request('/crm/companies/current/attributes/', { method: 'GET' });
  }

  // Get specific attribute by name
  async get(attributeName) {
    return this.request(`/crm/companies/current/attributes/${attributeName}`, {
      method: 'GET',
    });
  }

  // Create or update attribute
  async set(attributeName, attributeValue, description = null) {
    return this.request('/crm/companies/current/attributes/', {
      method: 'POST',
      body: JSON.stringify({
        attribute_name: attributeName,
        attribute_value: attributeValue,
        description,
      }),
    });
  }

  // Batch update multiple attributes
  async batchUpdate(attributes) {
    return this.request('/crm/companies/current/attributes/batch', {
      method: 'PUT',
      body: JSON.stringify({ attributes }),
    });
  }

  // Delete attribute
  async delete(attributeName) {
    return this.request(`/crm/companies/current/attributes/${attributeName}`, {
      method: 'DELETE',
    });
  }

  // Convenience methods for specific attributes
  async getIndustry() {
    return this.request('/crm/companies/current/attributes/industry/current', {
      method: 'GET',
    });
  }

  async setIndustry(industryId) {
    return this.request('/crm/companies/current/attributes/industry/current', {
      method: 'PUT',
      body: JSON.stringify(industryId),
    });
  }

  async getEmployeeCount() {
    return this.request('/crm/companies/current/attributes/employee-count/current', {
      method: 'GET',
    });
  }

  async setEmployeeCount(employeeRangeId) {
    return this.request('/crm/companies/current/attributes/employee-count/current', {
      method: 'PUT',
      body: JSON.stringify(employeeRangeId),
    });
  }
}

export default new CompanyAttributesAPI();
