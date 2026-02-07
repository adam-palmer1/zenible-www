/**
 * Invoices API Service
 * Handles all invoice-related API operations
 */

import { API_BASE_URL } from '@/config/api';
import { createRequest, type RequestOptions, type ApiError } from '../httpClient';

const request = createRequest('InvoicesAPI');

interface StripePaymentIntentParams {
  invoiceId: string;
  amount: number;
  currency: string;
  publicToken?: string | null;
}

interface PayPalOrderParams {
  invoiceId: string;
  amount: number;
  currency: string;
  publicToken?: string | null;
}

interface ConfirmPaymentParams {
  invoiceId: string;
  paymentMethod: string;
  paymentIntentId?: string;
  paypalOrderId?: string;
  publicToken?: string | null;
}

interface PaymentConsentParams {
  publicToken: string;
  automaticPaymentEnabled: boolean;
  consentAccepted: boolean;
}

/**
 * Invoices API Client
 */
class InvoicesAPI {
  private baseEndpoint: string;

  constructor() {
    this.baseEndpoint = '/crm/invoices';
  }

  /**
   * List invoices with filtering and pagination
   */
  async list(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `${this.baseEndpoint}/?${queryString}` : `${this.baseEndpoint}/`;

    return request(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get a single invoice
   */
  async get(invoiceId: string): Promise<unknown> {
    return request(`${this.baseEndpoint}/${invoiceId}`, {
      method: 'GET',
    });
  }

  /**
   * Create a new invoice
   */
  async create(invoiceData: unknown): Promise<unknown> {
    return request(`${this.baseEndpoint}/`, {
      method: 'POST',
      body: JSON.stringify(invoiceData),
    });
  }

  /**
   * Update an invoice
   */
  async update(invoiceId: string, invoiceData: unknown, changeReason?: string): Promise<unknown> {
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
   */
  async delete(invoiceId: string): Promise<unknown> {
    return request(`${this.baseEndpoint}/${invoiceId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get next available invoice number
   */
  async getNextNumber(): Promise<unknown> {
    return request(`${this.baseEndpoint}/next-number`, {
      method: 'GET',
    });
  }

  /**
   * Send invoice via email
   */
  async send(invoiceId: string, emailData: unknown): Promise<unknown> {
    return request(`${this.baseEndpoint}/${invoiceId}/send`, {
      method: 'POST',
      body: JSON.stringify(emailData),
    });
  }

  /**
   * Send invoice reminder via email
   */
  async sendReminder(invoiceId: string, emailData: unknown): Promise<unknown> {
    return request(`${this.baseEndpoint}/${invoiceId}/send-reminder`, {
      method: 'POST',
      body: JSON.stringify(emailData),
    });
  }

  /**
   * Create and send invoice in one step
   */
  async createAndSend(invoiceData: unknown, sendOptions: unknown = {}): Promise<unknown> {
    return request(`${this.baseEndpoint}/create-and-send`, {
      method: 'POST',
      body: JSON.stringify({
        ...(invoiceData as Record<string, unknown>),
        send_options: sendOptions,
      }),
    });
  }

  /**
   * Download invoice PDF
   */
  async downloadPDF(invoiceId: string): Promise<Blob> {
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
   */
  async clone(invoiceId: string): Promise<unknown> {
    return request(`${this.baseEndpoint}/${invoiceId}/clone`, {
      method: 'POST',
    });
  }

  /**
   * Mark invoice as paid
   */
  async markPaid(invoiceId: string, paymentData: unknown): Promise<unknown> {
    return request(`${this.baseEndpoint}/${invoiceId}/mark-paid`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  /**
   * Record a payment on an invoice
   */
  async recordPayment(invoiceId: string, paymentData: unknown): Promise<unknown> {
    return request(`${this.baseEndpoint}/${invoiceId}/payments`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  /**
   * Get invoice by public token
   */
  async getPublic(token: string): Promise<unknown> {
    return request(`${this.baseEndpoint}/public/${token}`, {
      method: 'GET',
    });
  }

  /**
   * Get invoice by share code (public endpoint without auth)
   */
  async getPublicByShareCode(shareCode: string): Promise<unknown> {
    return request(`/invoices/${shareCode}`, {
      method: 'GET',
    });
  }

  /**
   * Create a Stripe payment for a public invoice
   */
  async createStripePayment(shareCode: string, paymentData: unknown): Promise<unknown> {
    return request(`/invoices/${shareCode}/stripe/create-payment`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  /**
   * Get Stripe payment status for a public invoice
   */
  async getStripePaymentStatus(shareCode: string, paymentId: string): Promise<unknown> {
    return request(`/invoices/${shareCode}/stripe/payment/${paymentId}/status`, {
      method: 'GET',
    });
  }

  /**
   * Create a PayPal order for a public invoice
   */
  async createPayPalOrder(shareCode: string, orderData: unknown): Promise<unknown> {
    return request(`/invoices/${shareCode}/paypal/create-order`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  }

  /**
   * Capture a PayPal order for a public invoice
   */
  async capturePayPalOrder(shareCode: string, captureData: unknown): Promise<unknown> {
    return request(`/invoices/${shareCode}/paypal/capture-order`, {
      method: 'POST',
      body: JSON.stringify(captureData),
    });
  }

  /**
   * Get PayPal order status for a public invoice
   */
  async getPayPalOrderStatus(shareCode: string, orderId: string): Promise<unknown> {
    return request(`/invoices/${shareCode}/paypal/order-status/${orderId}`, {
      method: 'GET',
    });
  }

  /**
   * Create a Stripe SetupIntent for saving card details (for recurring payments)
   */
  async createStripeSetupIntent(shareCode: string): Promise<unknown> {
    return request(`/invoices/${shareCode}/stripe/setup-card`, {
      method: 'POST',
    });
  }

  /**
   * Confirm card setup was successful (verify with backend after Stripe confirmation)
   */
  async confirmCardSetup(shareCode: string, setupIntentId: string): Promise<unknown> {
    return request(`/invoices/${shareCode}/stripe/confirm-setup`, {
      method: 'POST',
      body: JSON.stringify({ setup_intent_id: setupIntentId }),
    });
  }

  /**
   * Pay with saved card (for recurring invoices with saved payment method)
   */
  async payWithSavedCard(shareCode: string, options: unknown = {}): Promise<unknown> {
    return request(`/invoices/${shareCode}/stripe/pay-with-saved-card`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  /**
   * Get saved cards for a public invoice
   */
  async getSavedCards(shareCode: string): Promise<unknown> {
    return request(`/invoices/${shareCode}/stripe/saved-cards`, {
      method: 'GET',
    });
  }

  /**
   * Delete a saved card
   */
  async deleteSavedCard(shareCode: string, paymentMethodId: string): Promise<unknown> {
    return request(`/invoices/${shareCode}/stripe/saved-cards/${paymentMethodId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get payment history for an invoice
   */
  async getPaymentHistory(invoiceId: string): Promise<unknown> {
    return request(`${this.baseEndpoint}/${invoiceId}/payments`, {
      method: 'GET',
    });
  }

  /**
   * Get change history for an invoice (audit trail)
   */
  async getHistory(invoiceId: string, limit: number = 100): Promise<unknown> {
    return request(`${this.baseEndpoint}/${invoiceId}/history?limit=${limit}`, {
      method: 'GET',
    });
  }

  /**
   * Get view history for an invoice
   */
  async getViewHistory(invoiceId: string, params: Record<string, string | number> = {}): Promise<unknown> {
    const queryParams = new URLSearchParams({
      skip: String(params.skip || 0),
      limit: String(params.limit || 100),
    }).toString();
    return request(`${this.baseEndpoint}/${invoiceId}/views?${queryParams}`, {
      method: 'GET',
    });
  }

  /**
   * Preview email before sending
   */
  async previewEmail(invoiceId: string, emailData: unknown): Promise<unknown> {
    return request(`${this.baseEndpoint}/${invoiceId}/preview-email`, {
      method: 'POST',
      body: JSON.stringify(emailData),
    });
  }

  /**
   * Export invoices
   */
  async export(params: Record<string, string> = {}, format: string = 'csv'): Promise<Blob> {
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
   */
  async getSummary(params: Record<string, string> = {}): Promise<unknown> {
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
   */
  async generateNext(invoiceId: string): Promise<unknown> {
    return request(`${this.baseEndpoint}/${invoiceId}/generate-next`, {
      method: 'POST',
    });
  }

  /**
   * Get all invoices generated from a recurring template
   */
  async getRecurringChildren(invoiceId: string): Promise<unknown> {
    return request(`${this.baseEndpoint}/${invoiceId}/recurring-children`, {
      method: 'GET',
    });
  }

  // ========== Project Allocation Endpoints ==========

  /**
   * Get project allocations for an invoice
   */
  async getAllocations(invoiceId: string): Promise<unknown> {
    return request(`${this.baseEndpoint}/${invoiceId}/allocations`, {
      method: 'GET',
    });
  }

  /**
   * Update project allocations for an invoice (replaces all existing allocations)
   */
  async updateAllocations(invoiceId: string, allocations: unknown[]): Promise<unknown> {
    return request(`${this.baseEndpoint}/${invoiceId}/allocations`, {
      method: 'PUT',
      body: JSON.stringify({ allocations }),
    });
  }

  /**
   * Delete all project allocations for an invoice
   */
  async deleteAllocations(invoiceId: string): Promise<unknown> {
    return request(`${this.baseEndpoint}/${invoiceId}/allocations`, {
      method: 'DELETE',
    });
  }

  // ========== Admin Card Charging Endpoints ==========

  /**
   * Charge the customer's saved card (admin-initiated)
   */
  async chargeSavedCard(invoiceId: string, options: unknown = {}): Promise<unknown> {
    return request(`${this.baseEndpoint}/${invoiceId}/charge-saved-card`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  /**
   * Get invoice statistics overview
   */
  async getStats(): Promise<unknown> {
    return request(`${this.baseEndpoint}/stats/overview`, {
      method: 'GET',
    });
  }

  // ========== Payment Intent Endpoints (Admin & Public) ==========

  /**
   * Create Stripe payment intent for an invoice
   * Supports both authenticated and public (token-based) access
   */
  async createStripePaymentIntent({ invoiceId, amount, currency, publicToken = null }: StripePaymentIntentParams): Promise<unknown> {
    const url = `${API_BASE_URL}/invoices/payment-intent/stripe`;
    const token = localStorage.getItem('access_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Only add auth header if not using public token
    if (!publicToken && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        invoice_id: invoiceId,
        amount,
        currency: currency.toLowerCase(),
        ...(publicToken ? { token: publicToken } : {}),
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.detail || 'Failed to create payment intent');
    }

    return response.json();
  }

  /**
   * Create PayPal order for an invoice
   * Supports both authenticated and public (token-based) access
   */
  async createPayPalOrderIntent({ invoiceId, amount, currency, publicToken = null }: PayPalOrderParams): Promise<unknown> {
    const url = `${API_BASE_URL}/invoices/payment-order/paypal`;
    const token = localStorage.getItem('access_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!publicToken && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        invoice_id: invoiceId,
        amount,
        currency,
        ...(publicToken ? { token: publicToken } : {}),
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.detail || 'Failed to create PayPal order');
    }

    return response.json();
  }

  /**
   * Confirm payment for an invoice (works with Stripe and PayPal)
   * Supports both authenticated and public (token-based) access
   */
  async confirmPayment({ invoiceId, paymentMethod, paymentIntentId, paypalOrderId, publicToken = null }: ConfirmPaymentParams): Promise<unknown> {
    const url = `${API_BASE_URL}/invoices/confirm-payment`;
    const token = localStorage.getItem('access_token');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (!publicToken && token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const body: Record<string, unknown> = {
      invoice_id: invoiceId,
      payment_method: paymentMethod,
      ...(publicToken ? { token: publicToken } : {}),
    };

    if (paymentIntentId) {
      body.payment_intent_id = paymentIntentId;
    }
    if (paypalOrderId) {
      body.paypal_order_id = paypalOrderId;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.detail || 'Failed to confirm payment');
    }

    return response.json();
  }

  /**
   * Update automatic payment consent for a shared invoice
   */
  async updatePaymentConsent({ publicToken, automaticPaymentEnabled, consentAccepted }: PaymentConsentParams): Promise<unknown> {
    const url = `${API_BASE_URL}/invoices/share/consent`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: publicToken,
        automatic_payment_enabled: automaticPaymentEnabled,
        consent_accepted: consentAccepted,
      }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw new Error(data?.detail || 'Failed to update payment consent');
    }

    return response.json();
  }
}

// Export singleton instance
const invoicesAPI = new InvoicesAPI();
export default invoicesAPI;
