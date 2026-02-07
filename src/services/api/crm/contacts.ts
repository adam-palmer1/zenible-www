// API service for Contact endpoints

import { API_BASE_URL } from '@/config/api';
import { createCRUDService } from '../createCRUDService';
import type {
  ContactResponse,
  ContactCreate,
  ContactUpdate,
  ContactFieldsResponse,
  ContactStatusChange,
  ContactMergeResponse,
  ContactNoteResponse,
  ContactNoteCreate,
  ContactNoteUpdate,
  ContactTimelineResponse,
  ContactServiceResponse,
  ContactServiceCreate,
  ContactServiceUpdate,
  ContactTaxResponse,
  ContactTaxCreate,
  ContactTaxUpdate,
  ContactServiceAttributionResponse,
  ContactServiceAttributionCreate,
  ContactServiceInvoiceResponse,
  ContactServiceInvoiceCreate,
  PaginatedResponse,
  ProjectResponse,
  InvoiceResponse,
} from '@/types';

/** Paginated contact list response. */
type ContactListResponse = PaginatedResponse<ContactResponse>;

const baseCRUD = createCRUDService<ContactResponse, ContactListResponse, ContactCreate, ContactUpdate>(
  '/crm/contacts/',
  'ContactsAPI',
);

/**
 * Contacts API Client
 */
const contactsAPI = {
  ...baseCRUD,

  // Get available fields metadata for contacts list
  async getFields(): Promise<ContactFieldsResponse> {
    return baseCRUD.request('/crm/contacts/fields', { method: 'GET' });
  },

  // List contacts with pagination and filters
  // (Overrides factory list to filter out null/undefined/empty values)
  async list(params: Record<string, string> = {}): Promise<ContactListResponse> {
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
    return baseCRUD.request(endpoint, { method: 'GET' });
  },

  // Get single contact by ID
  // (Overrides factory get to support optional query params like include_financial_details=true)
  async get(contactId: string, params: Record<string, string> = {}): Promise<ContactResponse> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/crm/contacts/${contactId}?${queryString}`
      : `/crm/contacts/${contactId}`;
    return baseCRUD.request(endpoint, { method: 'GET' });
  },

  // Restore deleted contact
  async restore(contactId: string): Promise<ContactResponse> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/restore`, { method: 'POST' });
  },

  // Change contact status
  async changeStatus(contactId: string, statusData: ContactStatusChange): Promise<ContactResponse> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/status`, {
      method: 'POST',
      body: JSON.stringify(statusData),
    });
  },

  // Create contact-specific service (not added to global catalog)
  async createContactService(contactId: string, serviceData: ContactServiceCreate): Promise<ContactServiceResponse> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/services`, {
      method: 'POST',
      body: JSON.stringify(serviceData),
    });
  },

  // Assign service to contact
  async assignService(contactId: string, serviceId: string): Promise<ContactServiceResponse> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/services/${serviceId}`, {
      method: 'POST',
    });
  },

  // Unassign service from contact
  async unassignService(contactId: string, serviceId: string): Promise<void> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/services/${serviceId}`, {
      method: 'DELETE',
    });
  },

  // Update contact service
  async updateContactService(contactId: string, serviceId: string, serviceData: ContactServiceUpdate): Promise<ContactServiceResponse> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/services/${serviceId}`, {
      method: 'PATCH',
      body: JSON.stringify(serviceData),
    });
  },

  // Get contact notes
  async getNotes(contactId: string): Promise<ContactNoteResponse[]> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/notes`, { method: 'GET' });
  },

  // Create contact note
  async createNote(contactId: string, noteData: ContactNoteCreate): Promise<ContactNoteResponse> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/notes`, {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  },

  // Update contact note
  async updateNote(contactId: string, noteId: string, noteData: ContactNoteUpdate): Promise<ContactNoteResponse> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/notes/${noteId}`, {
      method: 'PATCH',
      body: JSON.stringify(noteData),
    });
  },

  // Delete contact note
  async deleteNote(contactId: string, noteId: string): Promise<void> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/notes/${noteId}`, {
      method: 'DELETE',
    });
  },

  // Get contact timeline/activities
  async getTimeline(contactId: string, params: Record<string, string> = {}): Promise<ContactTimelineResponse> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${baseCRUD.baseEndpoint}${contactId}/timeline?${queryString}`
      : `${baseCRUD.baseEndpoint}${contactId}/timeline`;
    return baseCRUD.request(endpoint, { method: 'GET' });
  },

  // Import contacts from CSV/Excel
  async importContacts(file: File): Promise<{ imported: number; skipped: number; errors: string[] }> {
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

    return await response.json();
  },

  // Contact Tax Management

  // Add tax rate to contact
  async addContactTax(contactId: string, taxData: ContactTaxCreate): Promise<ContactTaxResponse> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/taxes`, {
      method: 'POST',
      body: JSON.stringify(taxData),
    });
  },

  // Update contact tax rate
  async updateContactTax(contactId: string, taxId: string, taxData: ContactTaxUpdate): Promise<ContactTaxResponse> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/taxes/${taxId}`, {
      method: 'PATCH',
      body: JSON.stringify(taxData),
    });
  },

  // Delete contact tax rate
  async deleteContactTax(contactId: string, taxId: string): Promise<void> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/taxes/${taxId}`, {
      method: 'DELETE',
    });
  },

  // Get projects assigned to a contact
  async getProjects(contactId: string): Promise<ProjectResponse[]> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/projects`, { method: 'GET' });
  },

  // =====================
  // Service Attributions
  // =====================

  // List attributions for a contact service
  async listAttributions(contactId: string, serviceId: string): Promise<ContactServiceAttributionResponse[]> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/services/${serviceId}/attributions`, {
      method: 'GET',
    });
  },

  // Create attribution for a contact service
  async createAttribution(contactId: string, serviceId: string, data: ContactServiceAttributionCreate): Promise<ContactServiceAttributionResponse> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/services/${serviceId}/attributions`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Delete attribution
  async deleteAttribution(contactId: string, serviceId: string, attributionId: string): Promise<void> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/services/${serviceId}/attributions/${attributionId}`, {
      method: 'DELETE',
    });
  },

  // =====================
  // Service Invoice Links
  // =====================

  // List invoice links for a contact service
  async listInvoiceLinks(contactId: string, serviceId: string): Promise<ContactServiceInvoiceResponse[]> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/services/${serviceId}/invoices`, {
      method: 'GET',
    });
  },

  // Create invoice link for a contact service
  async createInvoiceLink(contactId: string, serviceId: string, data: ContactServiceInvoiceCreate): Promise<ContactServiceInvoiceResponse> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/services/${serviceId}/invoices`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Delete invoice link
  async deleteInvoiceLink(contactId: string, serviceId: string, invoiceLinkId: string): Promise<void> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/services/${serviceId}/invoices/${invoiceLinkId}`, {
      method: 'DELETE',
    });
  },

  // =====================
  // Service Invoice Actions
  // =====================

  // Create one-off invoice from service
  async createInvoiceFromService(contactId: string, serviceId: string, data: unknown): Promise<InvoiceResponse> {
    // data: { amount: number, amount_type: 'fixed' | 'percentage' }
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/services/${serviceId}/create-invoice`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Link recurring service to invoice template
  async linkServiceToTemplate(contactId: string, serviceId: string, templateId: string): Promise<ContactServiceResponse> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/services/${serviceId}/link-invoice`, {
      method: 'POST',
      body: JSON.stringify({ invoice_id: templateId }),
    });
  },

  // Unlink service from invoice template
  async unlinkServiceFromTemplate(contactId: string, serviceId: string): Promise<void> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/services/${serviceId}/link-invoice`, {
      method: 'DELETE',
    });
  },

  // Create recurring invoice template from service
  async createRecurringTemplateFromService(contactId: string, serviceId: string, data: unknown = {}): Promise<InvoiceResponse> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${contactId}/services/${serviceId}/create-recurring-invoice`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

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
  async merge(targetContactId: string, sourceContactId: string): Promise<ContactMergeResponse> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${targetContactId}/merge`, {
      method: 'POST',
      body: JSON.stringify({ source_contact_id: sourceContactId }),
    });
  },

  /**
   * Search contacts for merge target selection
   * Excludes the source contact from results
   *
   * @param query - Search query
   * @param excludeContactId - Contact ID to exclude from results
   * @returns List of contacts matching the search
   */
  async searchForMerge(query: string, excludeContactId: string): Promise<ContactListResponse> {
    const params: Record<string, string> = {
      search: query,
      per_page: '20',
      include_hidden: 'false',
    };
    const result = await contactsAPI.list(params);
    // Filter out the source contact
    if (result.items) {
      result.items = result.items.filter(c => c.id !== excludeContactId);
    }
    return result;
  },
};

export default contactsAPI;
