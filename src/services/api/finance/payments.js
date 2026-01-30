/**
 * Payments API Service
 * Handles all payment-related API operations using CRM endpoints
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
    console.error('[PaymentsAPI] Request error:', error);
    throw error;
  }
};

/**
 * Payments API Client
 */
class PaymentsAPI {
  constructor() {
    this.baseEndpoint = '/crm/payments';
  }

  /**
   * List payments with filtering and pagination
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.per_page - Items per page (default: 20)
   * @param {string} params.contact_id - Filter by contact
   * @param {string} params.status - Filter by payment status
   * @param {boolean} params.unallocated_only - Show only unallocated payments
   * @returns {Promise<Object>} Paginated payments list
   */
  async list(params = {}) {
    // Add cache-busting timestamp to prevent stale cached responses
    const paramsWithCacheBust = { ...params, _t: Date.now() };
    const queryString = new URLSearchParams(paramsWithCacheBust).toString();
    const endpoint = `${this.baseEndpoint}/?${queryString}`;
    return request(endpoint, { method: 'GET' });
  }

  /**
   * Get a single payment by ID
   * @param {string|number} paymentId - Payment ID
   * @returns {Promise<Object>} Payment details
   */
  async get(paymentId) {
    return request(`${this.baseEndpoint}/${paymentId}`, { method: 'GET' });
  }

  /**
   * Get next available payment number
   * @returns {Promise<Object>} { next_number: "PAY-0001", prefix: "PAY" }
   */
  async getNextNumber() {
    return request(`${this.baseEndpoint}/next-number`, { method: 'GET' });
  }

  /**
   * Create a new payment
   * @param {Object} paymentData - Payment data
   * @param {number} paymentData.contact_id - Contact ID
   * @param {number} paymentData.amount - Payment amount
   * @param {string} paymentData.currency - Currency code (default: USD)
   * @param {string} paymentData.payment_method - Payment method
   * @param {string} paymentData.payment_date - Payment date (ISO format)
   * @param {string} paymentData.reference_number - External reference number
   * @param {string} paymentData.description - Payment description/notes
   * @returns {Promise<Object>} Created payment
   */
  async create(paymentData) {
    return request(`${this.baseEndpoint}/`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  /**
   * Update payment details
   * @param {string|number} paymentId - Payment ID
   * @param {Object} paymentData - Updated payment data
   * @returns {Promise<Object>} Updated payment
   */
  async update(paymentId, paymentData) {
    return request(`${this.baseEndpoint}/${paymentId}`, {
      method: 'PATCH',
      body: JSON.stringify(paymentData),
    });
  }

  /**
   * Soft delete a payment
   * @param {string|number} paymentId - Payment ID
   * @returns {Promise<void>}
   */
  async delete(paymentId) {
    return request(`${this.baseEndpoint}/${paymentId}`, { method: 'DELETE' });
  }

  /**
   * Get change history/audit trail for a payment
   * @param {string|number} paymentId - Payment ID
   * @returns {Promise<Object>} Payment history
   */
  async getHistory(paymentId) {
    return request(`${this.baseEndpoint}/${paymentId}/history`, { method: 'GET' });
  }

  // ============ Invoice Allocation Endpoints ============

  /**
   * Allocate payment to invoices
   * @param {string|number} paymentId - Payment ID
   * @param {Object} allocationData - Allocation data
   * @param {Array} allocationData.allocations - Array of { invoice_id, amount }
   * @returns {Promise<Object>} Allocation result
   */
  async allocate(paymentId, allocationData) {
    return request(`${this.baseEndpoint}/${paymentId}/allocate`, {
      method: 'POST',
      body: JSON.stringify(allocationData),
    });
  }

  /**
   * Auto-allocate payment to oldest unpaid invoices (FIFO)
   * @param {string|number} paymentId - Payment ID
   * @returns {Promise<Object>} Auto-allocation result
   */
  async autoAllocate(paymentId) {
    return request(`${this.baseEndpoint}/${paymentId}/auto-allocate`, {
      method: 'POST',
    });
  }

  /**
   * Get unallocated amount for a payment
   * @param {string|number} paymentId - Payment ID
   * @returns {Promise<Object>} { unallocated_amount: number }
   */
  async getUnallocated(paymentId) {
    return request(`${this.baseEndpoint}/${paymentId}/unallocated`, { method: 'GET' });
  }

  // ============ Refund Endpoints ============

  /**
   * Process refund for a payment
   * @param {string|number} paymentId - Payment ID
   * @param {Object} refundData - Refund data
   * @param {number} refundData.amount - Refund amount (optional, full refund if not specified)
   * @param {string} refundData.reason - Reason for refund
   * @returns {Promise<Object>} Refund result
   */
  async refund(paymentId, refundData = {}) {
    return request(`${this.baseEndpoint}/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify(refundData),
    });
  }

  // ============ Statistics Endpoints ============

  /**
   * Get payment statistics for the company
   * @param {Object} params - Query parameters for filtering
   * @returns {Promise<Object>} Payment statistics
   */
  async getStats(params = {}) {
    // Add cache-busting timestamp to prevent stale cached responses
    const paramsWithCacheBust = { ...params, _t: Date.now() };
    const queryString = new URLSearchParams(paramsWithCacheBust).toString();
    const endpoint = `${this.baseEndpoint}/stats/overview?${queryString}`;
    return request(endpoint, { method: 'GET' });
  }

  // ============ Webhook Endpoints ============

  /**
   * Process payment gateway webhooks
   * @param {Object} webhookData - Webhook payload
   * @returns {Promise<Object>} Webhook processing result
   */
  async processWebhook(webhookData) {
    return request(`${this.baseEndpoint}/webhooks/gateway`, {
      method: 'POST',
      body: JSON.stringify(webhookData),
    });
  }

  // ============ Legacy/Stripe Endpoints (kept for backwards compatibility) ============

  /**
   * Get user's saved payment methods
   * @returns {Promise<Array>} Payment methods list
   */
  async getPaymentMethods() {
    return request('/payments/methods', { method: 'GET' });
  }

  /**
   * Add a new payment method
   * @param {Object} methodData - Payment method data
   * @param {string} methodData.payment_method_id - Stripe payment method ID
   * @param {boolean} methodData.set_default - Set as default payment method
   * @returns {Promise<Object>} Created payment method
   */
  async addPaymentMethod(methodData) {
    return request('/payments/methods', {
      method: 'POST',
      body: JSON.stringify(methodData),
    });
  }

  /**
   * Remove a payment method
   * @param {string} methodId - Payment method ID
   * @returns {Promise<void>}
   */
  async removePaymentMethod(methodId) {
    return request(`/payments/methods/${methodId}`, { method: 'DELETE' });
  }

  /**
   * Create a Stripe payment intent
   * @param {Object} intentData - Payment intent data
   * @param {number} intentData.amount - Amount in cents
   * @param {string} intentData.currency - Currency code (e.g., 'usd')
   * @param {Object} intentData.metadata - Additional metadata
   * @returns {Promise<Object>} Payment intent with client_secret
   */
  async createPaymentIntent(intentData) {
    return request('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify(intentData),
    });
  }

  /**
   * Get user's Stripe invoices
   * @returns {Promise<Array>} Stripe invoices
   */
  async getStripeInvoices() {
    return request('/payments/invoices', { method: 'GET' });
  }

  // ========== Project Allocation Endpoints ==========

  /**
   * Get project allocations for a payment
   * @param {string} paymentId - Payment UUID
   * @returns {Promise<Object>} { allocations: [...], total_percentage: number, total_allocated_amount: number }
   */
  async getProjectAllocations(paymentId) {
    return request(`${this.baseEndpoint}/${paymentId}/allocations`, {
      method: 'GET',
    });
  }

  /**
   * Update project allocations for a payment (replaces all existing allocations)
   * @param {string} paymentId - Payment UUID
   * @param {Array} allocations - Array of { project_id, percentage }
   * @returns {Promise<Object>} Updated allocations
   */
  async updateProjectAllocations(paymentId, allocations) {
    return request(`${this.baseEndpoint}/${paymentId}/allocations`, {
      method: 'PUT',
      body: JSON.stringify({ allocations }),
    });
  }

  /**
   * Delete all project allocations for a payment
   * @param {string} paymentId - Payment UUID
   * @returns {Promise<void>}
   */
  async deleteProjectAllocations(paymentId) {
    return request(`${this.baseEndpoint}/${paymentId}/allocations`, {
      method: 'DELETE',
    });
  }
}

const paymentsAPI = new PaymentsAPI();
export default paymentsAPI;
