// API service for Email Template endpoints

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://demo-api.zenible.com/api/v1';

class EmailTemplatesAPI {
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
      console.error('Email Templates API request failed:', error);
      throw error;
    }
  }

  // List all templates for company
  async list(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.per_page) queryParams.append('per_page', params.per_page);
    if (params.template_type) queryParams.append('template_type', params.template_type);

    const queryString = queryParams.toString();
    const endpoint = `/crm/email-templates/${queryString ? `?${queryString}` : ''}`;

    return this.request(endpoint, { method: 'GET' });
  }

  // Get template by ID
  async get(id) {
    return this.request(`/crm/email-templates/${id}`, { method: 'GET' });
  }

  // Create new template
  async create(data) {
    return this.request('/crm/email-templates/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update template
  async update(id, data) {
    return this.request(`/crm/email-templates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Delete template (soft delete)
  async delete(id) {
    return this.request(`/crm/email-templates/${id}`, { method: 'DELETE' });
  }

  // Preview template with variables
  async preview(id, variables) {
    return this.request(`/crm/email-templates/${id}/preview`, {
      method: 'POST',
      body: JSON.stringify({ variables }),
    });
  }

  // Get available variables for template type
  async getVariables(templateType) {
    return this.request(`/crm/email-templates/variables/${templateType}`, {
      method: 'GET',
    });
  }

  // Get effective template (company or system default)
  async getEffective(templateType) {
    return this.request(`/crm/email-templates/effective/${templateType}`, {
      method: 'GET',
    });
  }
}

export default new EmailTemplatesAPI();
