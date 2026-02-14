// API service for Project endpoints

import { createCRUDService } from '../createCRUDService';

const baseCRUD = createCRUDService('/crm/projects/', 'ProjectsAPI');

/**
 * Projects API Client
 */
const projectsAPI = {
  ...baseCRUD,

  // List projects with filters
  // (Overrides factory list to support array parameters like statuses)
  async list(params: Record<string, string | string[]> = {}): Promise<unknown> {
    // Build query string manually to handle array parameters
    const queryParts: string[] = [];

    Object.entries(params).forEach(([key, value]) => {
      // Skip null, undefined, empty string, and 'null' string
      if (value === null || value === undefined || value === '' || value === 'null') {
        return;
      }

      // Handle array values (e.g., statuses) - repeat parameter for each value
      if (Array.isArray(value)) {
        value.forEach(item => {
          if (item !== null && item !== undefined && item !== '') {
            queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(item)}`);
          }
        });
      } else {
        queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
      }
    });

    const queryString = queryParts.join('&');
    const endpoint = queryString ? `/crm/projects/?${queryString}` : '/crm/projects/';

    return baseCRUD.request(endpoint, {
      method: 'GET',
    });
  },

  // Get project statistics
  async getStats(): Promise<unknown> {
    return baseCRUD.request('/crm/projects/stats', {
      method: 'GET',
    });
  },

  // Service assignment methods
  async listServices(projectId: string): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${projectId}/services`, {
      method: 'GET',
    });
  },

  async assignService(projectId: string, data: unknown): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${projectId}/services`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async unassignService(projectId: string, assignmentId: string): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${projectId}/services/${assignmentId}`, {
      method: 'DELETE',
    });
  },

  async updateServiceAssignment(projectId: string, assignmentId: string, data: unknown): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${projectId}/services/${assignmentId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Delete a project allocation (invoice, quote, payment, credit_note)
  async deleteAllocation(projectId: string, allocationId: string): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${projectId}/allocations/${allocationId}`, {
      method: 'DELETE',
    });
  },

  // Delete an expense allocation from a project
  async deleteExpenseAllocation(projectId: string, allocationId: string): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${projectId}/expense-allocations/${allocationId}`, {
      method: 'DELETE',
    });
  },

  // Link an invoice to a project service
  async createServiceInvoiceLink(projectId: string, assignmentId: string, data: { invoice_id: string; amount: number; notes?: string }): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${projectId}/services/${assignmentId}/invoice-link`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export { projectsAPI };
export default projectsAPI;
