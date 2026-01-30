/**
 * Invoices API Service
 * Handles all invoice-related API operations
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

    // Handle 204 No Content
    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      // Handle Pydantic validation errors (detail is an array)
      let errorMessage;
      if (Array.isArray(data?.detail)) {
        // Format validation errors nicely
        errorMessage = data.detail.map(err => {
          const field = err.loc?.slice(-1)[0] || 'field';
          return `${field}: ${err.msg}`;
        }).join(', ');
      } else {
        errorMessage = data?.detail || data?.message || `Request failed with status ${response.status}`;
      }
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[InvoicesAPI] Request error:', error);
    throw error;
  }
};

/**
 * Invoices API Client
 */
class InvoicesAPI {
  constructor() {
    this.baseEndpoint = '/crm/invoices';
  }

  /**
   * List invoices with filtering and pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Invoices
   */
  async list(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `${this.baseEndpoint}/?${queryString}` : `${this.baseEndpoint}/`;

    return request(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get a single invoice
   * @param {string|number} invoiceId - Invoice ID
   * @returns {Promise<Object>} Invoice
   */
  async get(invoiceId) {
    return request(`${this.baseEndpoint}/${invoiceId}`, {
      method: 'GET',
    });
  }

  /**
   * Create a new invoice
   * @param {Object} invoiceData - Invoice data
   * @returns {Promise<Object>} Created invoice
   */
  async create(invoiceData) {
    return request(`${this.baseEndpoint}/`, {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  /**
   * Update an invoice
   * @param {string|number} invoiceId - Invoice ID
   * @param {Object} invoiceData - Updated invoice data
   * @param {string} [changeReason] - Optional reason for the change (for audit trail)
   * @returns {Promise<Object>} Updated invoice
   */
  async update(invoiceId, invoiceData, changeReason) {
    const queryParams = changeReason
      ? `?change_reason=${encodeURIComponent(changeReason)}`
      : '';

    return request(`${this.baseEndpoint}/${invoiceId}${queryParams}`, {
      method: 'PATCH',
      body: JSON.stringify(invoiceData),
    });
  }

  /**
   * Delete an invoice
   * @param {string|number} invoiceId - Invoice ID
   * @returns {Promise<void>}
   */
  async delete(invoiceId) {
    return request(`${this.baseEndpoint}/${invoiceId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get next available invoice number
   * @returns {Promise<Object>} { next_number: "INV-0042", prefix: "INV" }
   */
  async getNextNumber() {
    return request(`${this.baseEndpoint}/next-number`, {
      method: 'GET',
    });
  }

  /**
   * Send invoice via email
   * @param {string|number} invoiceId - Invoice ID
   * @param {Object} emailData - Email data { to_email, cc_emails, email_subject, email_body, attach_pdf, template_id }
   * @returns {Promise<Object>} Send result
   */
  async send(invoiceId, emailData) {
    return request(`${this.baseEndpoint}/${invoiceId}/send`, {
      method: 'POST',
      body: JSON.stringify(emailData),
    });
  }

  /**
   * Create and send invoice in one step
   * @param {Object} invoiceData - Invoice data (all invoice fields)
   * @param {Object} sendOptions - Send options { to_email, cc_emails, email_subject, email_body, attach_pdf, template_id }
   * @returns {Promise<Object>} Created and sent invoice
   */
  async createAndSend(invoiceData, sendOptions = {}) {
    return request(`${this.baseEndpoint}/create-and-send`, {
      method: 'POST',
      body: JSON.stringify({
        ...invoiceData,
        send_options: sendOptions,
      }),
    });
  }

  /**
   * Download invoice PDF
   * @param {string|number} invoiceId - Invoice ID
   * @returns {Promise<Blob>} PDF blob
   */
  async downloadPDF(invoiceId) {
    const url = `${API_BASE_URL}${this.baseEndpoint}/${invoiceId}/pdf`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to download PDF');
    }

    return response.blob();
  }

  /**
   * Clone an invoice
   * @param {string|number} invoiceId - Invoice ID
   * @returns {Promise<Object>} Cloned invoice
   */
  async clone(invoiceId) {
    return request(`${this.baseEndpoint}/${invoiceId}/clone`, {
      method: 'POST',
    });
  }

  /**
   * Mark invoice as paid
   * @param {string|number} invoiceId - Invoice ID
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Updated invoice
   */
  async markPaid(invoiceId, paymentData) {
    return request(`${this.baseEndpoint}/${invoiceId}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  /**
   * Record a payment on an invoice
   * @param {string|number} invoiceId - Invoice ID
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment record
   */
  async recordPayment(invoiceId, paymentData) {
    return request(`${this.baseEndpoint}/${invoiceId}/payments`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  /**
   * Get invoice by public token
   * @param {string} token - Public share token
   * @returns {Promise<Object>} Invoice
   */
  async getPublic(token) {
    return request(`${this.baseEndpoint}/public/${token}`, {
      method: 'GET',
    });
  }

  /**
   * Get invoice by share code (public endpoint without auth)
   * @param {string} shareCode - Public share code
   * @returns {Promise<Object>} Invoice
   */
  async getPublicByShareCode(shareCode) {
    return request(`/invoices/${shareCode}`, {
      method: 'GET',
    });
  }

  /**
   * Create a Stripe payment for a public invoice
   * @param {string} shareCode - Public share link code
   * @param {Object} paymentData - Payment data { amount?, customer_email? }
   * @returns {Promise<Object>} { payment_id, client_secret, publishable_key, amount, currency }
   */
  async createStripePayment(shareCode, paymentData) {
    return request(`/invoices/${shareCode}/stripe/create-payment`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  /**
   * Get Stripe payment status for a public invoice
   * @param {string} shareCode - Public share link code
   * @param {string} paymentId - Payment record UUID
   * @returns {Promise<Object>} Payment status
   */
  async getStripePaymentStatus(shareCode, paymentId) {
    return request(`/invoices/${shareCode}/stripe/payment/${paymentId}/status`, {
      method: 'GET',
    });
  }

  /**
   * Create a PayPal order for a public invoice
   * @param {string} shareCode - Public share code
   * @param {Object} orderData - Order data { amount, return_url, cancel_url }
   * @returns {Promise<Object>} { order_id, approve_url }
   */
  async createPayPalOrder(shareCode, orderData) {
    return request(`/invoices/${shareCode}/paypal/create-order`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  /**
   * Capture a PayPal order for a public invoice
   * @param {string} shareCode - Public share code
   * @param {Object} captureData - Capture data { order_id }
   * @returns {Promise<Object>} Capture result
   */
  async capturePayPalOrder(shareCode, captureData) {
    return request(`/invoices/${shareCode}/paypal/capture-order`, {
      method: 'POST',
      body: JSON.stringify(captureData),
    });
  }

  /**
   * Get PayPal order status for a public invoice
   * @param {string} shareCode - Public share code
   * @param {string} orderId - PayPal order ID
   * @returns {Promise<Object>} Order status
   */
  async getPayPalOrderStatus(shareCode, orderId) {
    return request(`/invoices/${shareCode}/paypal/order-status/${orderId}`, {
      method: 'GET',
    });
  }

  /**
   * Create a Stripe SetupIntent for saving card details (for recurring payments)
   * @param {string} shareCode - Public share link code
   * @returns {Promise<Object>} { client_secret, setup_intent_id, publishable_key, customer_id, stripe_account_id? }
   */
  async createStripeSetupIntent(shareCode) {
    return request(`/invoices/${shareCode}/stripe/setup-card`, {
      method: 'POST',
    });
  }

  /**
   * Confirm card setup was successful (verify with backend after Stripe confirmation)
   * @param {string} shareCode - Public share link code
   * @param {string} setupIntentId - Stripe SetupIntent ID
   * @returns {Promise<Object>} Confirmation result
   */
  async confirmCardSetup(shareCode, setupIntentId) {
    return request(`/invoices/${shareCode}/stripe/confirm-setup`, {
      method: 'POST',
      body: JSON.stringify({ setup_intent_id: setupIntentId }),
    });
  }

  /**
   * Pay with saved card (for recurring invoices with saved payment method)
   * @param {string} shareCode - Public share link code
   * @param {Object} options - Payment options
   * @param {string} [options.payment_method_id] - Specific payment method ID (optional, uses default if not provided)
   * @param {number} [options.amount] - Amount to pay (optional, pays full balance if not provided)
   * @returns {Promise<Object>} Payment result { payment_id, payment_intent_id, status, amount, currency }
   */
  async payWithSavedCard(shareCode, options = {}) {
    return request(`/invoices/${shareCode}/stripe/pay-with-saved-card`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  /**
   * Get saved cards for a public invoice
   * @param {string} shareCode - Public share link code
   * @returns {Promise<Object>} Saved cards { payment_methods: [{ id, brand, last4, exp_month, exp_year, ... }] }
   */
  async getSavedCards(shareCode) {
    return request(`/invoices/${shareCode}/stripe/saved-cards`, {
      method: 'GET',
    });
  }

  /**
   * Delete a saved card
   * @param {string} shareCode - Public share link code
   * @param {string} paymentMethodId - Stripe payment method ID to delete
   * @returns {Promise<Object>} Result { status: 'deleted', payment_method_id }
   */
  async deleteSavedCard(shareCode, paymentMethodId) {
    return request(`/invoices/${shareCode}/stripe/saved-cards/${paymentMethodId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get payment history for an invoice
   * @param {string|number} invoiceId - Invoice ID
   * @returns {Promise<Array>} Payment history
   */
  async getPaymentHistory(invoiceId) {
    return request(`${this.baseEndpoint}/${invoiceId}/payments`, {
      method: 'GET',
    });
  }

  /**
   * Get change history for an invoice (audit trail)
   * @param {string|number} invoiceId - Invoice ID
   * @param {number} [limit=100] - Maximum number of changes to return
   * @returns {Promise<Object>} Change history with changes array and total count
   */
  async getHistory(invoiceId, limit = 100) {
    return request(`${this.baseEndpoint}/${invoiceId}/history?limit=${limit}`, {
      method: 'GET',
    });
  }

  /**
   * Get view history for an invoice
   * @param {string|number} invoiceId - Invoice ID
   * @param {Object} params - Query parameters
   * @param {number} [params.skip=0] - Records to skip (pagination)
   * @param {number} [params.limit=100] - Max records to return (1-500)
   * @returns {Promise<Object>} View history with views array, total count, and unique IP count
   */
  async getViewHistory(invoiceId, params = {}) {
    const queryParams = new URLSearchParams({
      skip: params.skip || 0,
      limit: params.limit || 100,
    }).toString();
    return request(`${this.baseEndpoint}/${invoiceId}/views?${queryParams}`, {
      method: 'GET',
    });
  }

  /**
   * Preview email before sending
   * @param {string|number} invoiceId - Invoice ID
   * @param {Object} emailData - Email data
   * @returns {Promise<Object>} Email preview
   */
  async previewEmail(invoiceId, emailData) {
    return request(`${this.baseEndpoint}/${invoiceId}/preview-email`, {
      method: 'POST',
      body: JSON.stringify(emailData),
    });
  }

  /**
   * Export invoices
   * @param {Object} params - Export parameters
   * @param {string} format - Export format (csv, xlsx, etc.)
   * @returns {Promise<Blob>} Export file
   */
  async export(params = {}, format = 'csv') {
    const queryString = new URLSearchParams({ ...params, format }).toString();
    const url = `${API_BASE_URL}${this.baseEndpoint}/export?${queryString}`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export invoices');
    }

    return response.blob();
  }

  /**
   * Get invoice summary/statistics
   * @param {Object} params - Filter parameters
   * @returns {Promise<Object>} Invoice summary
   */
  async getSummary(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${this.baseEndpoint}/summary?${queryString}`
      : `${this.baseEndpoint}/summary`;

    return request(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Generate next invoice from a recurring template
   * @param {string|number} invoiceId - Template invoice ID
   * @returns {Promise<Object>} Newly generated invoice
   */
  async generateNext(invoiceId) {
    return request(`${this.baseEndpoint}/${invoiceId}/generate-next`, {
      method: 'POST',
    });
  }

  /**
   * Get all invoices generated from a recurring template
   * @param {string|number} invoiceId - Template invoice ID
   * @returns {Promise<Object>} List of generated invoices with pagination
   */
  async getRecurringChildren(invoiceId) {
    return request(`${this.baseEndpoint}/${invoiceId}/recurring-children`, {
      method: 'GET',
    });
  }

  // ========== Project Allocation Endpoints ==========

  /**
   * Get project allocations for an invoice
   * @param {string} invoiceId - Invoice UUID
   * @returns {Promise<Object>} { allocations: [...], total_percentage: number, total_allocated_amount: number }
   */
  async getAllocations(invoiceId) {
    return request(`${this.baseEndpoint}/${invoiceId}/allocations`, {
      method: 'GET',
    });
  }

  /**
   * Update project allocations for an invoice (replaces all existing allocations)
   * @param {string} invoiceId - Invoice UUID
   * @param {Array} allocations - Array of { project_id, percentage }
   * @returns {Promise<Object>} Updated allocations
   */
  async updateAllocations(invoiceId, allocations) {
    return request(`${this.baseEndpoint}/${invoiceId}/allocations`, {
      method: 'PUT',
      body: JSON.stringify({ allocations }),
    });
  }

  /**
   * Delete all project allocations for an invoice
   * @param {string} invoiceId - Invoice UUID
   * @returns {Promise<void>}
   */
  async deleteAllocations(invoiceId) {
    return request(`${this.baseEndpoint}/${invoiceId}/allocations`, {
      method: 'DELETE',
    });
  }

  // ========== Admin Card Charging Endpoints ==========

  /**
   * Charge the customer's saved card (admin-initiated)
   * @param {string} invoiceId - Invoice UUID
   * @param {Object} options - Charge options
   * @param {number} [options.amount] - Amount to charge (optional, charges full balance if not provided)
   * @returns {Promise<Object>} Payment result { payment_id, status, amount, currency }
   */
  async chargeSavedCard(invoiceId, options = {}) {
    return request(`${this.baseEndpoint}/${invoiceId}/charge-saved-card`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }
}

// Export singleton instance
const invoicesAPI = new InvoicesAPI();
export default invoicesAPI;
