/**
 * Admin Payments API Service
 * Handles payment management, stats, history, invoices, and refunds
 */

import { createRequest } from '../httpClient';

const request = createRequest('AdminPaymentsAPI');

const adminPaymentsAPI = {
  async getAllPayments(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/payments/admin/all?${queryString}` : '/payments/admin/all';
    return request(endpoint, { method: 'GET' });
  },

  async getPaymentStats(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/payments/admin/stats?${queryString}` : '/payments/admin/stats';
    return request(endpoint, { method: 'GET' });
  },

  async getPayments(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/payments/?${queryString}` : '/payments/';
    return request(endpoint, { method: 'GET' });
  },

  async getPayment(paymentId: string): Promise<unknown> {
    return request(`/payments/${paymentId}`, { method: 'GET' });
  },

  async getPaymentHistory(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/payments/history?${queryString}` : '/payments/history';
    return request(endpoint, { method: 'GET' });
  },

  async getInvoices(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/payments/invoices?${queryString}` : '/payments/invoices';
    return request(endpoint, { method: 'GET' });
  },

  async refundPayment(paymentId: string, data: unknown = {}): Promise<unknown> {
    return request(`/payments/refund/${paymentId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

export default adminPaymentsAPI;
