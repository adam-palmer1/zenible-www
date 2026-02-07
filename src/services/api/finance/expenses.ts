/**
 * Expenses API Service
 * Handles all expense-related API operations
 */

import { API_BASE_URL } from '@/config/api';
import { createCRUDService } from '../createCRUDService';
import type {
  ExpenseResponse,
  ExpenseListResponse,
  ExpenseCreate,
  ExpenseUpdate,
  ExpenseStatsResponse,
  ExpenseHistoryResponse,
  ExpenseCategoryResponse,
  ExpenseCategoryListResponse,
  ExpenseBulkDeleteResponse,
  ExpenseReceiptUploadResponse,
  ExpenseAllocationsResponse,
} from '@/types';

const baseCRUD = createCRUDService<ExpenseResponse, ExpenseListResponse, ExpenseCreate, ExpenseUpdate>(
  '/crm/expenses/',
  'ExpensesAPI',
);

const categoriesEndpoint = '/crm/expenses/categories';

/**
 * Expenses API Client
 */
const expensesAPI = {
  ...baseCRUD,

  // ========== EXPENSE OPERATIONS ==========

  /**
   * Get next available expense number
   */
  async getNextNumber(): Promise<{ next_number: string }> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}next-number`, {
      method: 'GET',
    });
  },

  /**
   * Bulk delete expenses
   */
  async bulkDelete(expenseIds: string[]): Promise<ExpenseBulkDeleteResponse> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}bulk-delete`, {
      method: 'POST',
      body: JSON.stringify({ expense_ids: expenseIds }),
    });
  },

  /**
   * Bulk update expenses
   */
  async bulkUpdate(expenseIds: string[], updateData: unknown): Promise<{ updated_count: number }> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}bulk-update`, {
      method: 'POST',
      body: JSON.stringify({
        expense_ids: expenseIds,
        update_data: updateData,
      }),
    });
  },

  // ========== CATEGORY OPERATIONS ==========

  /**
   * List expense categories
   */
  async getCategories(params: Record<string, string> = {}): Promise<ExpenseCategoryListResponse> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `${categoriesEndpoint}?${queryString}` : categoriesEndpoint;
    return baseCRUD.request(endpoint, { method: 'GET' });
  },

  /**
   * Create expense category
   */
  async createCategory(categoryData: unknown): Promise<ExpenseCategoryResponse> {
    return baseCRUD.request(categoriesEndpoint, {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  /**
   * Update expense category
   */
  async updateCategory(categoryId: string, categoryData: unknown): Promise<ExpenseCategoryResponse> {
    return baseCRUD.request(`${categoriesEndpoint}/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },

  /**
   * Delete expense category
   */
  async deleteCategory(categoryId: string): Promise<void> {
    return baseCRUD.request(`${categoriesEndpoint}/${categoryId}`, { method: 'DELETE' });
  },

  // ========== ANALYTICS OPERATIONS ==========

  /**
   * Get expense analytics
   */
  async getAnalytics(params: Record<string, string> = {}): Promise<ExpenseStatsResponse> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${baseCRUD.baseEndpoint}analytics?${queryString}`
      : `${baseCRUD.baseEndpoint}analytics`;
    return baseCRUD.request(endpoint, { method: 'GET' });
  },

  /**
   * Get category breakdown
   */
  async getCategoryBreakdown(params: Record<string, string> = {}): Promise<Record<string, unknown>> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${baseCRUD.baseEndpoint}category-breakdown?${queryString}`
      : `${baseCRUD.baseEndpoint}category-breakdown`;
    return baseCRUD.request(endpoint, { method: 'GET' });
  },

  /**
   * Get vendor analysis
   */
  async getVendorAnalysis(params: Record<string, string> = {}): Promise<Record<string, unknown>> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${baseCRUD.baseEndpoint}vendor-analysis?${queryString}`
      : `${baseCRUD.baseEndpoint}vendor-analysis`;
    return baseCRUD.request(endpoint, { method: 'GET' });
  },

  /**
   * Get monthly trends
   */
  async getMonthlyTrends(params: Record<string, string> = {}): Promise<Record<string, unknown>> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${baseCRUD.baseEndpoint}monthly-trends?${queryString}`
      : `${baseCRUD.baseEndpoint}monthly-trends`;
    return baseCRUD.request(endpoint, { method: 'GET' });
  },

  // ========== IMPORT/EXPORT OPERATIONS ==========

  /**
   * Import expenses from CSV
   */
  async importCSV(file: File, options: Record<string, string> = {}): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    Object.keys(options).forEach(key => {
      formData.append(key, options[key]);
    });

    const url = `${API_BASE_URL}${baseCRUD.baseEndpoint}import`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to import expenses');
    return response.json();
  },

  /**
   * Export expenses to CSV
   */
  async exportCSV(params: Record<string, string> = {}): Promise<Blob> {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}${baseCRUD.baseEndpoint}export?${queryString}`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to export expenses');
    return response.blob();
  },

  // ========== ATTACHMENT OPERATIONS ==========

  /**
   * Upload expense attachment
   */
  async uploadAttachment(expenseId: string, file: File): Promise<ExpenseReceiptUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_BASE_URL}${baseCRUD.baseEndpoint}${expenseId}/attachment`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to upload attachment');
    return response.json();
  },

  /**
   * Download expense attachment
   */
  async downloadAttachment(expenseId: string): Promise<Blob> {
    const url = `${API_BASE_URL}${baseCRUD.baseEndpoint}${expenseId}/attachment`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to download attachment');
    return response.blob();
  },

  /**
   * Delete expense attachment
   */
  async deleteAttachment(expenseId: string): Promise<void> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${expenseId}/attachment`, { method: 'DELETE' });
  },

  /**
   * Upload receipt (base64 encoded)
   */
  async uploadReceipt(expenseId: string, receiptData: unknown): Promise<ExpenseReceiptUploadResponse> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${expenseId}/upload-receipt`, {
      method: 'POST',
      body: JSON.stringify(receiptData),
    });
  },

  /**
   * Delete receipt
   */
  async deleteReceipt(expenseId: string): Promise<void> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${expenseId}/receipt`, { method: 'DELETE' });
  },

  // ========== RECURRING & HISTORY OPERATIONS ==========

  /**
   * Get expense change history
   */
  async getHistory(expenseId: string, limit: number = 100): Promise<ExpenseHistoryResponse> {
    const endpoint = `${baseCRUD.baseEndpoint}${expenseId}/history?limit=${limit}`;
    return baseCRUD.request(endpoint, { method: 'GET' });
  },

  /**
   * Generate next expense from recurring template
   */
  async generateNext(expenseId: string): Promise<ExpenseResponse> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${expenseId}/generate-next`, {
      method: 'POST',
    });
  },

  /**
   * Get all expenses generated from a recurring template
   */
  async getRecurringChildren(expenseId: string, params: Record<string, string> = {}): Promise<ExpenseListResponse> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${baseCRUD.baseEndpoint}${expenseId}/recurring-children?${queryString}`
      : `${baseCRUD.baseEndpoint}${expenseId}/recurring-children`;
    return baseCRUD.request(endpoint, { method: 'GET' });
  },

  // ========== ALLOCATION OPERATIONS ==========

  /**
   * Get expense allocations
   */
  async getAllocations(expenseId: string): Promise<ExpenseAllocationsResponse> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${expenseId}/allocations`, { method: 'GET' });
  },

  /**
   * Update expense allocations (replaces all existing allocations)
   */
  async updateAllocations(expenseId: string, allocations: unknown[]): Promise<ExpenseAllocationsResponse> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${expenseId}/allocations`, {
      method: 'PUT',
      body: JSON.stringify({ allocations }),
    });
  },

  /**
   * Delete all expense allocations
   */
  async deleteAllocations(expenseId: string): Promise<void> {
    return baseCRUD.request(`${baseCRUD.baseEndpoint}${expenseId}/allocations`, { method: 'DELETE' });
  },

  /**
   * Get expenses allocated to a specific entity (includes allocation details in response)
   */
  async getExpensesByEntity(entityType: string, entityId: string, params: Record<string, string> = {}): Promise<ExpenseListResponse> {
    const queryString = new URLSearchParams({
      ...params,
      allocated_entity_type: entityType,
      allocated_entity_id: entityId,
    }).toString();
    return baseCRUD.request(`${baseCRUD.baseEndpoint}?${queryString}`, { method: 'GET' });
  },

  /**
   * Get expense statistics overview
   */
  async getStats(params: Record<string, string> = {}): Promise<ExpenseStatsResponse> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${baseCRUD.baseEndpoint}stats/overview?${queryString}`
      : `${baseCRUD.baseEndpoint}stats/overview`;
    return baseCRUD.request(endpoint, { method: 'GET' });
  },
};

export default expensesAPI;
