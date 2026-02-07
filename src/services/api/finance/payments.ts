/**
 * Payments API Service
 * Handles all payment-related API operations using CRM endpoints
 */

import { createRequest, type RequestOptions, type ApiError } from '../httpClient';

const request = createRequest('PaymentsAPI');

/**
 * Payments API Client
 */
class PaymentsAPI {
  private baseEndpoint: string;

  constructor() {
    this.baseEndpoint = '/crm/payments';
  }

  /**
   * List payments with filtering and pagination
   */
  async list(params: Record<string, string> = {}): Promise<unknown> {
    // Add cache-busting timestamp to prevent stale cached responses
    const paramsWithCacheBust = { ...params, _t: String(Date.now()) };
    const queryString = new URLSearchParams(paramsWithCacheBust).toString();
    const endpoint = `${this.baseEndpoint}/?${queryString}`;
    return request(endpoint, { method: 'GET' });
  }

  /**
   * Get a single payment by ID
   */
  async get(paymentId: string): Promise<unknown> {
    return request(`${this.baseEndpoint}/${paymentId}`, { method: 'GET' });
  }

  /**
   * Get next available payment number
   */
  async getNextNumber(): Promise<unknown> {
    return request(`${this.baseEndpoint}/next-number`, { method: 'GET' });
  }

  /**
   * Create a new payment
   */
  async create(paymentData: unknown): Promise<unknown> {
    return request(`${this.baseEndpoint}/`, {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  /**
   * Update payment details
   */
  async update(paymentId: string, paymentData: unknown): Promise<unknown> {
    return request(`${this.baseEndpoint}/${paymentId}`, {
      method: 'PATCH',
      body: JSON.stringify(paymentData),
    });
  }

  /**
   * Soft delete a payment
   */
  async delete(paymentId: string): Promise<unknown> {
    return request(`${this.baseEndpoint}/${paymentId}`, { method: 'DELETE' });
  }

  /**
   * Get change history/audit trail for a payment
   */
  async getHistory(paymentId: string): Promise<unknown> {
    return request(`${this.baseEndpoint}/${paymentId}/history`, { method: 'GET' });
  }

  // ============ Invoice Allocation Endpoints ============

  /**
   * Allocate payment to invoices
   */
  async allocate(paymentId: string, allocationData: unknown): Promise<unknown> {
    return request(`${this.baseEndpoint}/${paymentId}/allocate`, {
      method: 'POST',
      body: JSON.stringify(allocationData),
    });
  }

  /**
   * Auto-allocate payment to oldest unpaid invoices (FIFO)
   */
  async autoAllocate(paymentId: string): Promise<unknown> {
    return request(`${this.baseEndpoint}/${paymentId}/auto-allocate`, {
      method: 'POST',
    });
  }

  /**
   * Get unallocated amount for a payment
   */
  async getUnallocated(paymentId: string): Promise<unknown> {
    return request(`${this.baseEndpoint}/${paymentId}/unallocated`, { method: 'GET' });
  }

  // ============ Refund Endpoints ============

  /**
   * Process refund for a payment
   */
  async refund(paymentId: string, refundData: unknown = {}): Promise<unknown> {
    return request(`${this.baseEndpoint}/${paymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify(refundData),
    });
  }

  // ============ Statistics Endpoints ============

  /**
   * Get payment statistics for the company
   */
  async getStats(params: Record<string, string> = {}): Promise<unknown> {
    // Add cache-busting timestamp to prevent stale cached responses
    const paramsWithCacheBust = { ...params, _t: String(Date.now()) };
    const queryString = new URLSearchParams(paramsWithCacheBust).toString();
    const endpoint = `${this.baseEndpoint}/stats/overview?${queryString}`;
    return request(endpoint, { method: 'GET' });
  }

  // ============ Webhook Endpoints ============

  /**
   * Process payment gateway webhooks
   */
  async processWebhook(webhookData: unknown): Promise<unknown> {
    return request(`${this.baseEndpoint}/webhooks/gateway`, {
      method: 'POST',
      body: JSON.stringify(webhookData),
    });
  }

  // ============ Legacy/Stripe Endpoints (kept for backwards compatibility) ============

  /**
   * Get user's saved payment methods
   */
  async getPaymentMethods(): Promise<unknown> {
    return request('/payments/methods', { method: 'GET' });
  }

  /**
   * Add a new payment method
   */
  async addPaymentMethod(methodData: unknown): Promise<unknown> {
    return request('/payments/methods', {
      method: 'POST',
      body: JSON.stringify(methodData),
    });
  }

  /**
   * Remove a payment method
   */
  async removePaymentMethod(methodId: string): Promise<unknown> {
    return request(`/payments/methods/${methodId}`, { method: 'DELETE' });
  }

  /**
   * Create a Stripe payment intent
   */
  async createPaymentIntent(intentData: unknown): Promise<unknown> {
    return request('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify(intentData),
    });
  }

  /**
   * Get user's Stripe invoices
   */
  async getStripeInvoices(): Promise<unknown> {
    return request('/payments/invoices', { method: 'GET' });
  }

  // ========== Project Allocation Endpoints ==========

  /**
   * Get project allocations for a payment
   */
  async getProjectAllocations(paymentId: string): Promise<unknown> {
    return request(`${this.baseEndpoint}/${paymentId}/allocations`, {
      method: 'GET',
    });
  }

  /**
   * Update project allocations for a payment (replaces all existing allocations)
   */
  async updateProjectAllocations(paymentId: string, allocations: unknown[]): Promise<unknown> {
    return request(`${this.baseEndpoint}/${paymentId}/allocations`, {
      method: 'PUT',
      body: JSON.stringify({ allocations }),
    });
  }

  /**
   * Delete all project allocations for a payment
   */
  async deleteProjectAllocations(paymentId: string): Promise<unknown> {
    return request(`${this.baseEndpoint}/${paymentId}/allocations`, {
      method: 'DELETE',
    });
  }
}

const paymentsAPI = new PaymentsAPI();
export default paymentsAPI;
