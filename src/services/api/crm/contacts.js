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

  // Get available fields metadata for contacts list
  async getFields() {
    return this.request('/crm/contacts/fields', { method: 'GET' });
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
  // Supports optional query params like include_financial_details=true
  async get(contactId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/crm/contacts/${contactId}?${queryString}`
      : `/crm/contacts/${contactId}`;
    return this.request(endpoint, { method: 'GET' });
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

  // Get projects assigned to a contact
  async getProjects(contactId) {
    return this.request(`/crm/contacts/${contactId}/projects`, { method: 'GET' });
  }

  // =====================
  // Service Attributions
  // =====================

  // List attributions for a contact service
  async listAttributions(contactId, serviceId) {
    return this.request(`/crm/contacts/${contactId}/services/${serviceId}/attributions`, {
      method: 'GET',
    });
  }

  // Create attribution for a contact service
  async createAttribution(contactId, serviceId, data) {
    return this.request(`/crm/contacts/${contactId}/services/${serviceId}/attributions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Delete attribution
  async deleteAttribution(contactId, serviceId, attributionId) {
    return this.request(`/crm/contacts/${contactId}/services/${serviceId}/attributions/${attributionId}`, {
      method: 'DELETE',
    });
  }

  // =====================
  // Service Invoice Links
  // =====================

  // List invoice links for a contact service
  async listInvoiceLinks(contactId, serviceId) {
    return this.request(`/crm/contacts/${contactId}/services/${serviceId}/invoices`, {
      method: 'GET',
    });
  }

  // Create invoice link for a contact service
  async createInvoiceLink(contactId, serviceId, data) {
    return this.request(`/crm/contacts/${contactId}/services/${serviceId}/invoices`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Delete invoice link
  async deleteInvoiceLink(contactId, serviceId, invoiceLinkId) {
    return this.request(`/crm/contacts/${contactId}/services/${serviceId}/invoices/${invoiceLinkId}`, {
      method: 'DELETE',
    });
  }

  // =====================
  // Service Invoice Actions
  // =====================

  // Create one-off invoice from service
  async createInvoiceFromService(contactId, serviceId, data) {
    // data: { amount: number, amount_type: 'fixed' | 'percentage' }
    return this.request(`/crm/contacts/${contactId}/services/${serviceId}/create-invoice`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Link recurring service to invoice template
  async linkServiceToTemplate(contactId, serviceId, templateId) {
    return this.request(`/crm/contacts/${contactId}/services/${serviceId}/link-invoice`, {
      method: 'POST',
      body: JSON.stringify({ invoice_id: templateId }),
    });
  }

  // Unlink service from invoice template
  async unlinkServiceFromTemplate(contactId, serviceId) {
    return this.request(`/crm/contacts/${contactId}/services/${serviceId}/link-invoice`, {
      method: 'DELETE',
    });
  }

  // Create recurring invoice template from service
  async createRecurringTemplateFromService(contactId, serviceId, data = {}) {
    return this.request(`/crm/contacts/${contactId}/services/${serviceId}/create-recurring-invoice`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // =====================
  // Contact Merge
  // =====================

  /**
   * Merge two contacts - source contact data is merged into target contact
   * Target contact wins for conflicts, source contact is soft-deleted after merge
   *
   * @param {string} targetContactId - The contact to merge INTO (will be kept)
   * @param {string} sourceContactId - The contact to merge FROM (will be deleted)
   * @returns {Object} Merge result with records_transferred and attributes_filled
   */
  async merge(targetContactId, sourceContactId) {
    return this.request(`/crm/contacts/${targetContactId}/merge`, {
      method: 'POST',
      body: JSON.stringify({ source_contact_id: sourceContactId }),
    });
  }

  /**
   * Search contacts for merge target selection
   * Excludes the source contact from results
   *
   * @param {string} query - Search query
   * @param {string} excludeContactId - Contact ID to exclude from results
   * @returns {Array} List of contacts matching the search
   */
  async searchForMerge(query, excludeContactId) {
    const params = {
      search: query,
      per_page: 20,
      include_hidden: false,
    };
    const result = await this.list(params);
    // Filter out the source contact
    if (result.items) {
      result.items = result.items.filter(c => c.id !== excludeContactId);
    }
    return result;
  }
}

export default new ContactsAPI();
