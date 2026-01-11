// API service for Contact endpoints

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://demo-api.zenible.com/api/v1';

class ContactsAPI {
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
      console.error('Contacts API request failed:', error);
      throw error;
    }
  }

  // List contacts with pagination and filters
  async list(params = {}) {
    // Filter out null, undefined, and empty string values
    const cleanParams = Object.entries(params).reduce((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '' && value !== 'null') {
        acc[key] = value;
      }
      return acc;
    }, {});

    const queryString = new URLSearchParams(cleanParams).toString();
    // Note: FastAPI expects trailing slash for list endpoints
    const endpoint = queryString ? `/crm/contacts/?${queryString}` : '/crm/contacts/';
    return this.request(endpoint, { method: 'GET' });
  }

  // Get single contact by ID
  async get(contactId) {
    return this.request(`/crm/contacts/${contactId}`, { method: 'GET' });
  }

  // Create new contact
  async create(data) {
    return this.request('/crm/contacts/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update contact
  async update(contactId, data) {
    return this.request(`/crm/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Delete contact (soft delete)
  async delete(contactId) {
    return this.request(`/crm/contacts/${contactId}`, { method: 'DELETE' });
  }

  // Restore deleted contact
  async restore(contactId) {
    return this.request(`/crm/contacts/${contactId}/restore`, { method: 'POST' });
  }

  // Change contact status
  async changeStatus(contactId, statusData) {
    return this.request(`/crm/contacts/${contactId}/status`, {
      method: 'POST',
      body: JSON.stringify(statusData),
    });
  }

  // Create contact-specific service (not added to global catalog)
  async createContactService(contactId, serviceData) {
    return this.request(`/crm/contacts/${contactId}/services`, {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  }

  // Assign service to contact
  async assignService(contactId, serviceId) {
    return this.request(`/crm/contacts/${contactId}/services/${serviceId}`, {
      method: 'POST',
    });
  }

  // Unassign service from contact
  async unassignService(contactId, serviceId) {
    return this.request(`/crm/contacts/${contactId}/services/${serviceId}`, {
      method: 'DELETE',
    });
  }

  // Update contact service
  async updateContactService(contactId, serviceId, serviceData) {
    return this.request(`/crm/contacts/${contactId}/services/${serviceId}`, {
      method: 'PATCH',
      body: JSON.stringify(serviceData),
    });
  }

  // Get contact notes
  async getNotes(contactId) {
    return this.request(`/crm/contacts/${contactId}/notes`, { method: 'GET' });
  }

  // Create contact note
  async createNote(contactId, noteData) {
    return this.request(`/crm/contacts/${contactId}/notes`, {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  }

  // Update contact note
  async updateNote(noteId, noteData) {
    return this.request(`/crm/contacts/notes/${noteId}`, {
      method: 'PATCH',
      body: JSON.stringify(noteData),
    });
  }

  // Delete contact note
  async deleteNote(contactId, noteId) {
    return this.request(`/crm/contacts/${contactId}/notes/${noteId}`, {
      method: 'DELETE',
    });
  }

  // Get contact timeline/activities
  async getTimeline(contactId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/crm/contacts/${contactId}/timeline?${queryString}`
      : `/crm/contacts/${contactId}/timeline`;
    return this.request(endpoint, { method: 'GET' });
  }

  // Import contacts from CSV/Excel
  async importContacts(file) {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('access_token');
    const headers = {
      'Authorization': `Bearer ${token}`,
    };

    const response = await fetch(`${API_BASE_URL}/crm/contacts/import`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Import failed' }));
      throw new Error(error.detail || `Import failed with status ${response.status}`);
    }

    return await response.json();
  }

  // Contact Tax Management

  // Add tax rate to contact
  async addContactTax(contactId, taxData) {
    return this.request(`/crm/contacts/${contactId}/taxes`, {
      method: 'POST',
      body: JSON.stringify(taxData),
    });
  }

  // Update contact tax rate
  async updateContactTax(contactId, taxId, taxData) {
    return this.request(`/crm/contacts/${contactId}/taxes/${taxId}`, {
      method: 'PATCH',
      body: JSON.stringify(taxData),
    });
  }

  // Delete contact tax rate
  async deleteContactTax(contactId, taxId) {
    return this.request(`/crm/contacts/${contactId}/taxes/${taxId}`, {
      method: 'DELETE',
    });
  }
}

export default new ContactsAPI();
