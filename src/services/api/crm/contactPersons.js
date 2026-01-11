// API service for Contact Persons endpoints

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://demo-api.zenible.com/api/v1';

class ContactPersonsAPI {
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

        // Handle validation errors (422) with detail array
        if (Array.isArray(error.detail)) {
          const messages = error.detail.map(err => {
            const field = err.loc ? err.loc[err.loc.length - 1] : 'Field';
            return `${field}: ${err.msg}`;
          }).join('; ');
          throw new Error(messages);
        }

        throw new Error(error.detail || `Request failed with status ${response.status}`);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Contact Persons API request failed:', error);
      throw error;
    }
  }

  // List all contact persons for a contact
  async list(contactId) {
    return this.request(`/crm/contacts/${contactId}/persons`, { method: 'GET' });
  }

  // Create new contact person
  async create(contactId, data) {
    return this.request(`/crm/contacts/${contactId}/persons`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update contact person
  async update(contactId, personId, data) {
    return this.request(`/crm/contacts/${contactId}/persons/${personId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Delete contact person
  async delete(contactId, personId) {
    return this.request(`/crm/contacts/${contactId}/persons/${personId}`, {
      method: 'DELETE',
    });
  }
}

const contactPersonsAPI = new ContactPersonsAPI();
export default contactPersonsAPI;
