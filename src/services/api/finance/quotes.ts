/**
 * Quotes API Service
 * Handles all quote-related API operations
 */

import { API_BASE_URL } from '@/config/api';
import { createCRUDService } from '../createCRUDService';

const baseCRUD = createCRUDService('/crm/quotes', 'QuotesAPI');

/**
 * Quotes API Client
 */
const quotesAPI = {
  ...baseCRUD,

  /**
   * Get next available quote number for preview
   */
  async getNextNumber(): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}/next-number`, {
      method: 'GET',
    });
  },

  /**
   * Send quote via email (DRAFT -> SENT)
   */
  async send(quoteId: string, emailData: unknown): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}/${quoteId}/send`, {
      method: 'POST',
      body: JSON.stringify(emailData),
    });
  },

  /**
   * Accept a quote
   */
  async accept(quoteId: string, acceptanceData: unknown = {}): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}/${quoteId}/accept`, {
      method: 'POST',
      body: JSON.stringify(acceptanceData),
    });
  },

  /**
   * Reject a quote
   */
  async reject(quoteId: string, rejectionData: unknown = {}): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}/${quoteId}/reject`, {
      method: 'POST',
      body: JSON.stringify(rejectionData),
    });
  },

  /**
   * Convert accepted quote to invoice
   */
  async convertToInvoice(quoteId: string, conversionData: unknown = {}): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}/${quoteId}/convert-to-invoice`, {
      method: 'POST',
      body: JSON.stringify(conversionData),
    });
  },

  /**
   * Create a new revision of a quote
   */
  async createRevision(quoteId: string, revisionData: unknown = {}): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}/${quoteId}/create-revision`, {
      method: 'POST',
      body: JSON.stringify(revisionData),
    });
  },

  /**
   * Get quote statistics overview
   */
  async getStats(): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}/stats/overview`, {
      method: 'GET',
    });
  },

  /**
   * Get view history for a quote
   */
  async getViews(quoteId: string, params: Record<string, string | number> = {}): Promise<unknown> {
    const queryParams = new URLSearchParams({
      skip: String(params.skip || 0),
      limit: String(params.limit || 100),
    }).toString();
    return baseCRUD.request(`${baseCRUD.baseEndpoint}/${quoteId}/views?${queryParams}`, {
      method: 'GET',
    });
  },

  /**
   * Get quote revisions history
   */
  async getRevisions(quoteId: string): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}/${quoteId}/history`, {
      method: 'GET',
    });
  },

  /**
   * Download quote PDF
   */
  async downloadPDF(quoteId: string): Promise<Blob> {
    const url = `${API_BASE_URL}${baseCRUD.baseEndpoint}/${quoteId}/pdf`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to download PDF');
    return response.blob();
  },

  /**
   * Clone a quote
   */
  async clone(quoteId: string): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}/${quoteId}/clone`, { method: 'POST' });
  },

  /**
   * Get quote by public token
   */
  async getPublic(token: string): Promise<unknown> {
    return baseCRUD.request(`/quotes/${token}`, { method: 'GET' });
  },

  /**
   * Accept quote by public token
   */
  async acceptByToken(token: string, acceptanceData: unknown = {}): Promise<unknown> {
    return baseCRUD.request(`/quotes/${token}/accept`, {
      method: 'POST',
      body: JSON.stringify(acceptanceData),
    });
  },

  /**
   * Reject quote by public token
   */
  async rejectByToken(token: string, rejectionData: unknown = {}): Promise<unknown> {
    return baseCRUD.request(`/quotes/${token}/reject`, {
      method: 'POST',
      body: JSON.stringify(rejectionData),
    });
  },

  // ==========================================
  // Quote Templates API
  // ==========================================

  /**
   * List quote templates
   */
  async listTemplates(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${baseCRUD.baseEndpoint}/templates?${queryString}`
      : `${baseCRUD.baseEndpoint}/templates`;
    return baseCRUD.request(endpoint, { method: 'GET' });
  },

  /**
   * Create a new quote template
   */
  async createTemplate(templateData: unknown): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}/templates`, {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  },

  /**
   * Update a quote template
   */
  async updateTemplate(templateId: string, templateData: unknown): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}/templates/${templateId}`, {
      method: 'PATCH',
      body: JSON.stringify(templateData),
    });
  },

  /**
   * Soft delete a quote template
   */
  async deleteTemplate(templateId: string): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}/templates/${templateId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Create quote from template
   */
  async createFromTemplate(templateId: string, quoteData: unknown = {}): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}/templates/${templateId}/create-quote`, {
      method: 'POST',
      body: JSON.stringify(quoteData),
    });
  },

  // ========== Project Allocation Endpoints ==========

  /**
   * Get project allocations for a quote
   */
  async getAllocations(quoteId: string): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}/${quoteId}/allocations`, {
      method: 'GET',
    });
  },

  /**
   * Update project allocations for a quote (replaces all existing allocations)
   */
  async updateAllocations(quoteId: string, allocations: unknown[]): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}/${quoteId}/allocations`, {
      method: 'PUT',
      body: JSON.stringify({ allocations }),
    });
  },

  /**
   * Delete all project allocations for a quote
   */
  async deleteAllocations(quoteId: string): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}/${quoteId}/allocations`, {
      method: 'DELETE',
    });
  },
};

export default quotesAPI;
