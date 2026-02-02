/**
 * Expenses API Service
 * Handles all expense-related API operations
 */

import { API_BASE_URL } from '@/config/api';

/**
 * Base API request handler
 */
const request = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = localStorage.getItem('access_token');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const error = new Error(data?.detail || data?.message || `Request failed with status ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[ExpensesAPI] Request error:', error);
    throw error;
  }
};

/**
 * Expenses API Client
 */
class ExpensesAPI {
  constructor() {
    this.baseEndpoint = '/crm/expenses/';
    this.categoriesEndpoint = '/crm/expenses/categories';
  }

  // ========== EXPENSE OPERATIONS ==========

  /**
   * List expenses
   */
  async list(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `${this.baseEndpoint}?${queryString}` : this.baseEndpoint;
    return request(endpoint, { method: 'GET' });
  }

  /**
   * Get a single expense
   */
  async get(expenseId) {
    return request(`${this.baseEndpoint}${expenseId}`, { method: 'GET' });
  }

  /**
   * Create an expense
   */
  async create(expenseData) {
    return request(this.baseEndpoint, {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
  }

  /**
   * Update an expense (partial update)
   */
  async update(expenseId, expenseData) {
    return request(`${this.baseEndpoint}${expenseId}`, {
      method: 'PATCH',
      body: JSON.stringify(expenseData),
    });
  }

  /**
   * Delete an expense
   */
  async delete(expenseId) {
    return request(`${this.baseEndpoint}${expenseId}`, { method: 'DELETE' });
  }

  /**
   * Get next available expense number
   * @returns {Promise<Object>} { next_number: "EXP-0042", prefix: "EXP" }
   */
  async getNextNumber() {
    return request(`${this.baseEndpoint}next-number`, {
      method: 'GET',
    });
  }

  /**
   * Bulk delete expenses
   */
  async bulkDelete(expenseIds) {
    return request(`${this.baseEndpoint}bulk-delete`, {
      method: 'POST',
      body: JSON.stringify({ expense_ids: expenseIds }),
    });
  }

  /**
   * Bulk update expenses
   */
  async bulkUpdate(expenseIds, updateData) {
    return request(`${this.baseEndpoint}bulk-update`, {
      method: 'POST',
      body: JSON.stringify({
        expense_ids: expenseIds,
        update_data: updateData,
      }),
    });
  }

  // ========== CATEGORY OPERATIONS ==========

  /**
   * List expense categories
   */
  async getCategories(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `${this.categoriesEndpoint}?${queryString}` : this.categoriesEndpoint;
    return request(endpoint, { method: 'GET' });
  }

  /**
   * Create expense category
   */
  async createCategory(categoryData) {
    return request(this.categoriesEndpoint, {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  }

  /**
   * Update expense category
   */
  async updateCategory(categoryId, categoryData) {
    return request(`${this.categoriesEndpoint}/${categoryId}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  }

  /**
   * Delete expense category
   */
  async deleteCategory(categoryId) {
    return request(`${this.categoriesEndpoint}/${categoryId}`, { method: 'DELETE' });
  }

  // ========== ANALYTICS OPERATIONS ==========

  /**
   * Get expense analytics
   */
  async getAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${this.baseEndpoint}analytics?${queryString}`
      : `${this.baseEndpoint}analytics`;
    return request(endpoint, { method: 'GET' });
  }

  /**
   * Get category breakdown
   */
  async getCategoryBreakdown(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${this.baseEndpoint}category-breakdown?${queryString}`
      : `${this.baseEndpoint}category-breakdown`;
    return request(endpoint, { method: 'GET' });
  }

  /**
   * Get vendor analysis
   */
  async getVendorAnalysis(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${this.baseEndpoint}vendor-analysis?${queryString}`
      : `${this.baseEndpoint}vendor-analysis`;
    return request(endpoint, { method: 'GET' });
  }

  /**
   * Get monthly trends
   */
  async getMonthlyTrends(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${this.baseEndpoint}monthly-trends?${queryString}`
      : `${this.baseEndpoint}monthly-trends`;
    return request(endpoint, { method: 'GET' });
  }

  // ========== IMPORT/EXPORT OPERATIONS ==========

  /**
   * Import expenses from CSV
   */
  async importCSV(file, options = {}) {
    const formData = new FormData();
    formData.append('file', file);
    Object.keys(options).forEach(key => {
      formData.append(key, options[key]);
    });

    const url = `${API_BASE_URL}${this.baseEndpoint}import`;
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
  }

  /**
   * Export expenses to CSV
   */
  async exportCSV(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_BASE_URL}${this.baseEndpoint}export?${queryString}`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to export expenses');
    return response.blob();
  }

  // ========== ATTACHMENT OPERATIONS ==========

  /**
   * Upload expense attachment
   */
  async uploadAttachment(expenseId, file) {
    const formData = new FormData();
    formData.append('file', file);

    const url = `${API_BASE_URL}${this.baseEndpoint}${expenseId}/attachment`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) throw new Error('Failed to upload attachment');
    return response.json();
  }

  /**
   * Download expense attachment
   */
  async downloadAttachment(expenseId) {
    const url = `${API_BASE_URL}${this.baseEndpoint}${expenseId}/attachment`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error('Failed to download attachment');
    return response.blob();
  }

  /**
   * Delete expense attachment
   */
  async deleteAttachment(expenseId) {
    return request(`${this.baseEndpoint}${expenseId}/attachment`, { method: 'DELETE' });
  }

  /**
   * Upload receipt (base64 encoded)
   * @param {string} expenseId - The expense ID
   * @param {Object} receiptData - { file_name, file_size, file_type, file_data (base64) }
   * @returns {Promise<Object>} { receipt_url, attachment_filename, attachment_size, attachment_type }
   */
  async uploadReceipt(expenseId, receiptData) {
    return request(`${this.baseEndpoint}${expenseId}/upload-receipt`, {
      method: 'POST',
      body: JSON.stringify(receiptData),
    });
  }

  /**
   * Delete receipt
   * @param {string} expenseId - The expense ID
   */
  async deleteReceipt(expenseId) {
    return request(`${this.baseEndpoint}${expenseId}/receipt`, { method: 'DELETE' });
  }

  // ========== RECURRING & HISTORY OPERATIONS ==========

  /**
   * Get expense change history
   * @param {string} expenseId - The expense ID
   * @param {number} limit - Maximum number of history records (default: 100, max: 500)
   * @returns {Promise<Object>} { changes: [], total: number }
   */
  async getHistory(expenseId, limit = 100) {
    const endpoint = `${this.baseEndpoint}${expenseId}/history?limit=${limit}`;
    return request(endpoint, { method: 'GET' });
  }

  /**
   * Generate next expense from recurring template
   * @param {string} expenseId - The recurring template expense ID
   * @returns {Promise<Object>} The newly generated expense
   */
  async generateNext(expenseId) {
    return request(`${this.baseEndpoint}${expenseId}/generate-next`, {
      method: 'POST',
    });
  }

  /**
   * Get all expenses generated from a recurring template
   * @param {string} expenseId - The recurring template expense ID
   * @param {Object} params - Query parameters (page, per_page)
   * @returns {Promise<Object>} Paginated list of generated expenses
   */
  async getRecurringChildren(expenseId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${this.baseEndpoint}${expenseId}/recurring-children?${queryString}`
      : `${this.baseEndpoint}${expenseId}/recurring-children`;
    return request(endpoint, { method: 'GET' });
  }

  // ========== ALLOCATION OPERATIONS ==========

  /**
   * Get expense allocations
   * @param {string} expenseId - The expense ID
   * @returns {Promise<Object>} { allocations: [], total_allocated_percentage: number, total_allocated_amount: number }
   */
  async getAllocations(expenseId) {
    return request(`${this.baseEndpoint}${expenseId}/allocations`, { method: 'GET' });
  }

  /**
   * Update expense allocations (replaces all existing allocations)
   * @param {string} expenseId - The expense ID
   * @param {Array} allocations - Array of { entity_type, entity_id, percentage }
   * @returns {Promise<Object>} Updated allocations
   */
  async updateAllocations(expenseId, allocations) {
    return request(`${this.baseEndpoint}${expenseId}/allocations`, {
      method: 'PUT',
      body: JSON.stringify({ allocations }),
    });
  }

  /**
   * Delete all expense allocations
   * @param {string} expenseId - The expense ID
   */
  async deleteAllocations(expenseId) {
    return request(`${this.baseEndpoint}${expenseId}/allocations`, { method: 'DELETE' });
  }

  /**
   * Get expenses allocated to a specific entity (includes allocation details in response)
   * @param {string} entityType - Entity type (invoice, project, payment, contact)
   * @param {string} entityId - Entity ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} List of expenses with allocations included
   */
  async getExpensesByEntity(entityType, entityId, params = {}) {
    const queryString = new URLSearchParams({
      ...params,
      allocated_entity_type: entityType,
      allocated_entity_id: entityId,
    }).toString();
    return request(`${this.baseEndpoint}?${queryString}`, { method: 'GET' });
  }

  /**
   * Get expense statistics overview
   * @param {Object} params - Query parameters (start_date, end_date)
   * @returns {Promise<Object>} Expense stats
   */
  async getStats(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${this.baseEndpoint}stats/overview?${queryString}`
      : `${this.baseEndpoint}stats/overview`;
    return request(endpoint, { method: 'GET' });
  }
}

const expensesAPI = new ExpensesAPI();
export default expensesAPI;
