// API service for Contact endpoints

import { API_BASE_URL } from '@/config/api';
import logger from '../../../utils/logger';

class ContactsAPI {
  private async request<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
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
          const messages = error.detail.map((err: { loc?: (string | number)[]; msg: string }) => {
            const field = err.loc ? err.loc[err.loc.length - 1] : 'Field';
            return `${field}: ${err.msg}`;
          }).join('; ');
          throw new Error(messages);
        }

        throw new Error(error.detail || `Request failed with status ${response.status}`);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null as T;
      }

      return await response.json() as T;
    } catch (error) {
      logger.error('Contacts API request failed:', error);
      throw error;
    }
  }

  // Get available fields metadata for contacts list
  async getFields<T = unknown>(): Promise<T> {
    return this.request<T>('/crm/contacts/fields', { method: 'GET' });
  }

  // List contacts with pagination and filters
  async list<T = unknown>(params: Record<string, string> = {}): Promise<T> {
    // Filter out null, undefined, and empty string values
    const cleanParams = Object.entries(params).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value !== null && value !== undefined && value !== '' && value !== 'null') {
        acc[key] = value;
      }
      return acc;
    }, {});

    const queryString = new URLSearchParams(cleanParams).toString();
    // Note: FastAPI expects trailing slash for list endpoints
    const endpoint = queryString ? `/crm/contacts/?${queryString}` : '/crm/contacts/';
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // Get single contact by ID
  // Supports optional query params like include_financial_details=true
  async get<T = unknown>(contactId: string, params: Record<string, string> = {}): Promise<T> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/crm/contacts/${contactId}?${queryString}`
      : `/crm/contacts/${contactId}`;
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // Create new contact
  async create<T = unknown>(data: unknown): Promise<T> {
    return this.request<T>('/crm/contacts/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update contact
  async update<T = unknown>(contactId: string, data: unknown): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Delete contact (soft delete)
  async delete<T = unknown>(contactId: string): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}`, { method: 'DELETE' });
  }

  // Restore deleted contact
  async restore<T = unknown>(contactId: string): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/restore`, { method: 'POST' });
  }

  // Change contact status
  async changeStatus<T = unknown>(contactId: string, statusData: unknown): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/status`, {
      method: 'POST',
      body: JSON.stringify(statusData),
    });
  }

  // Create contact-specific service (not added to global catalog)
  async createContactService<T = unknown>(contactId: string, serviceData: unknown): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/services`, {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  }

  // Assign service to contact
  async assignService<T = unknown>(contactId: string, serviceId: string): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/services/${serviceId}`, {
      method: 'POST',
    });
  }

  // Unassign service from contact
  async unassignService<T = unknown>(contactId: string, serviceId: string): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/services/${serviceId}`, {
      method: 'DELETE',
    });
  }

  // Update contact service
  async updateContactService<T = unknown>(contactId: string, serviceId: string, serviceData: unknown): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/services/${serviceId}`, {
      method: 'PATCH',
      body: JSON.stringify(serviceData),
    });
  }

  // Get contact notes
  async getNotes<T = unknown>(contactId: string): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/notes`, { method: 'GET' });
  }

  // Create contact note
  async createNote<T = unknown>(contactId: string, noteData: unknown): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/notes`, {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  }

  // Update contact note
  async updateNote<T = unknown>(contactId: string, noteId: string, noteData: unknown): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/notes/${noteId}`, {
      method: 'PATCH',
      body: JSON.stringify(noteData),
    });
  }

  // Delete contact note
  async deleteNote<T = unknown>(contactId: string, noteId: string): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/notes/${noteId}`, {
      method: 'DELETE',
    });
  }

  // Get contact timeline/activities
  async getTimeline<T = unknown>(contactId: string, params: Record<string, string> = {}): Promise<T> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/crm/contacts/${contactId}/timeline?${queryString}`
      : `/crm/contacts/${contactId}/timeline`;
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // Import contacts from CSV/Excel
  async importContacts<T = unknown>(file: File): Promise<T> {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('access_token');
    const headers: Record<string, string> = {
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

    return await response.json() as T;
  }

  // Contact Tax Management

  // Add tax rate to contact
  async addContactTax<T = unknown>(contactId: string, taxData: unknown): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/taxes`, {
      method: 'POST',
      body: JSON.stringify(taxData),
    });
  }

  // Update contact tax rate
  async updateContactTax<T = unknown>(contactId: string, taxId: string, taxData: unknown): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/taxes/${taxId}`, {
      method: 'PATCH',
      body: JSON.stringify(taxData),
    });
  }

  // Delete contact tax rate
  async deleteContactTax<T = unknown>(contactId: string, taxId: string): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/taxes/${taxId}`, {
      method: 'DELETE',
    });
  }

  // Get projects assigned to a contact
  async getProjects<T = unknown>(contactId: string): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/projects`, { method: 'GET' });
  }

  // =====================
  // Service Attributions
  // =====================

  // List attributions for a contact service
  async listAttributions<T = unknown>(contactId: string, serviceId: string): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/services/${serviceId}/attributions`, {
      method: 'GET',
    });
  }

  // Create attribution for a contact service
  async createAttribution<T = unknown>(contactId: string, serviceId: string, data: unknown): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/services/${serviceId}/attributions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Delete attribution
  async deleteAttribution<T = unknown>(contactId: string, serviceId: string, attributionId: string): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/services/${serviceId}/attributions/${attributionId}`, {
      method: 'DELETE',
    });
  }

  // =====================
  // Service Invoice Links
  // =====================

  // List invoice links for a contact service
  async listInvoiceLinks<T = unknown>(contactId: string, serviceId: string): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/services/${serviceId}/invoices`, {
      method: 'GET',
    });
  }

  // Create invoice link for a contact service
  async createInvoiceLink<T = unknown>(contactId: string, serviceId: string, data: unknown): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/services/${serviceId}/invoices`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Delete invoice link
  async deleteInvoiceLink<T = unknown>(contactId: string, serviceId: string, invoiceLinkId: string): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/services/${serviceId}/invoices/${invoiceLinkId}`, {
      method: 'DELETE',
    });
  }

  // =====================
  // Service Invoice Actions
  // =====================

  // Create one-off invoice from service
  async createInvoiceFromService<T = unknown>(contactId: string, serviceId: string, data: unknown): Promise<T> {
    // data: { amount: number, amount_type: 'fixed' | 'percentage' }
    return this.request<T>(`/crm/contacts/${contactId}/services/${serviceId}/create-invoice`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Link recurring service to invoice template
  async linkServiceToTemplate<T = unknown>(contactId: string, serviceId: string, templateId: string): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/services/${serviceId}/link-invoice`, {
      method: 'POST',
      body: JSON.stringify({ invoice_id: templateId }),
    });
  }

  // Unlink service from invoice template
  async unlinkServiceFromTemplate<T = unknown>(contactId: string, serviceId: string): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/services/${serviceId}/link-invoice`, {
      method: 'DELETE',
    });
  }

  // Create recurring invoice template from service
  async createRecurringTemplateFromService<T = unknown>(contactId: string, serviceId: string, data: unknown = {}): Promise<T> {
    return this.request<T>(`/crm/contacts/${contactId}/services/${serviceId}/create-recurring-invoice`, {
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
   * @param targetContactId - The contact to merge INTO (will be kept)
   * @param sourceContactId - The contact to merge FROM (will be deleted)
   * @returns Merge result with records_transferred and attributes_filled
   */
  async merge<T = unknown>(targetContactId: string, sourceContactId: string): Promise<T> {
    return this.request<T>(`/crm/contacts/${targetContactId}/merge`, {
      method: 'POST',
      body: JSON.stringify({ source_contact_id: sourceContactId }),
    });
  }

  /**
   * Search contacts for merge target selection
   * Excludes the source contact from results
   *
   * @param query - Search query
   * @param excludeContactId - Contact ID to exclude from results
   * @returns List of contacts matching the search
   */
  async searchForMerge(query: string, excludeContactId: string) {
    const params: Record<string, string> = {
      search: query,
      per_page: '20',
      include_hidden: 'false',
    };
    const result = await this.list<{ items?: { id: string }[] }>(params);
    // Filter out the source contact
    if (result.items) {
      result.items = result.items.filter(c => c.id !== excludeContactId);
    }
    return result;
  }
}

export default new ContactsAPI();
