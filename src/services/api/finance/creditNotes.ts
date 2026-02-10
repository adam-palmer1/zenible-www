/**
 * Credit Notes API Service
 * Handles all credit note-related API operations
 */

import { API_BASE_URL } from '@/config/api';
import { createCRUDService } from '../createCRUDService';

const baseCRUD = createCRUDService('/crm/credit-notes/', 'CreditNotesAPI', {
  updateMethod: 'PUT',
});

/**
 * Credit Notes API Client
 */
const creditNotesAPI = {
  ...baseCRUD,

  /**
   * Get next available credit note number
   */
  async getNextNumber(): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}next-number`, {
      method: 'GET',
    });
  },

  /**
   * Get credit note statistics summary
   */
  async getStats(): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}stats/summary`, {
      method: 'GET',
    });
  },

  /**
   * Issue a credit note (change status from draft to issued)
   */
  async issue(creditNoteId: string): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${creditNoteId}/issue`, {
      method: 'POST',
    });
  },

  /**
   * Void a credit note (mark as void/cancelled)
   */
  async void(creditNoteId: string): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${creditNoteId}/void`, {
      method: 'POST',
    });
  },

  /**
   * Preview rendered credit note email with variables resolved
   */
  async previewEmail(creditNoteId: string): Promise<{ subject: string; body: string }> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${creditNoteId}/preview-email`, {
      method: 'POST',
      body: JSON.stringify({}),
    });
  },

  /**
   * Send a credit note via email
   */
  async send(creditNoteId: string, sendData: unknown = {}): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${creditNoteId}/send`, {
      method: 'POST',
      body: JSON.stringify(sendData),
    });
  },

  /**
   * Download credit note PDF
   */
  async downloadPdf(creditNoteId: string, creditNoteNumber: string = ''): Promise<void> {
    const url = `${API_BASE_URL}${baseCRUD.baseEndpoint}${creditNoteId}/pdf`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.detail || 'Failed to download PDF');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `CreditNote-${creditNoteNumber || creditNoteId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  },

  // ========== Project Allocation Endpoints ==========

  /**
   * Get project allocations for a credit note
   */
  async getAllocations(creditNoteId: string): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${creditNoteId}/allocations`, {
      method: 'GET',
    });
  },

  /**
   * Update project allocations for a credit note (replaces all existing allocations)
   */
  async updateAllocations(creditNoteId: string, allocations: unknown[]): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${creditNoteId}/allocations`, {
      method: 'PUT',
      body: JSON.stringify({ allocations }),
    });
  },

  /**
   * Delete all project allocations for a credit note
   */
  async deleteAllocations(creditNoteId: string): Promise<unknown> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${creditNoteId}/allocations`, {
      method: 'DELETE',
    });
  },
};

// Export singleton instance
export default creditNotesAPI;
