/**
 * Invoices API Service
 * Handles all invoice-related API operations
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

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
      const error = new Error(data?.detail || data?.message || `Request failed with status ${response.status}`);
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

  // ==========================================
  // Public Invoice Payment API Methods
  // These endpoints don't require authentication
  // ==========================================

  /**
   * Get public invoice by share code
   * @param {string} shareCode - Invoice share code
   * @returns {Promise<Object>} Public invoice data
   */
  async getPublicByShareCode(shareCode) {
    return publicRequest(`/invoices/${shareCode}`, {
      method: 'GET',
    });
  }

  /**
   * Get payment status for public invoice
   * @param {string} shareCode - Invoice share code
   * @returns {Promise<Object>} Payment status
   */
  async getPublicPaymentStatus(shareCode) {
    return publicRequest(`/invoices/${shareCode}/payment-status`, {
      method: 'GET',
    });
  }

  /**
   * Create Stripe payment for public invoice
   * @param {string} shareCode - Invoice share code
   * @param {Object} params - { amount?: number, customer_email?: string }
   * @returns {Promise<Object>} { payment_id, client_secret, publishable_key, amount, currency }
   */
  async createStripePayment(shareCode, params = {}) {
    return publicRequest(`/invoices/${shareCode}/stripe/create-payment`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get Stripe payment status
   * @param {string} shareCode - Invoice share code
   * @param {string} paymentId - Payment ID
   * @returns {Promise<Object>} Payment status
   */
  async getStripePaymentStatus(shareCode, paymentId) {
    return publicRequest(`/invoices/${shareCode}/stripe/payment/${paymentId}/status`, {
      method: 'GET',
    });
  }

  /**
   * Create PayPal order for public invoice
   * @param {string} shareCode - Invoice share code
   * @param {Object} params - { amount?: number, return_url, cancel_url }
   * @returns {Promise<Object>} { order_id, approve_url, amount, currency }
   */
  async createPayPalOrder(shareCode, params) {
    return publicRequest(`/invoices/${shareCode}/paypal/create-order`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Capture PayPal order for public invoice
   * @param {string} shareCode - Invoice share code
   * @param {Object} params - { order_id }
   * @returns {Promise<Object>} Capture result
   */
  async capturePayPalOrder(shareCode, params) {
    return publicRequest(`/invoices/${shareCode}/paypal/capture-order`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get PayPal order status
   * @param {string} shareCode - Invoice share code
   * @param {string} orderId - PayPal order ID
   * @returns {Promise<Object>} Order status
   */
  async getPayPalOrderStatus(shareCode, orderId) {
    return publicRequest(`/invoices/${shareCode}/paypal/order/${orderId}/status`, {
      method: 'GET',
    });
  }
}

/**
 * Public request handler (no authentication required)
 */
const publicRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

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
    console.error('[InvoicesAPI] Public request error:', error);
    throw error;
  }
};

// Export singleton instance
const invoicesAPI = new InvoicesAPI();
export default invoicesAPI;
