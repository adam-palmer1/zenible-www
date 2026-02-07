/**
 * Financial Reports API Service
 * Unified financial reporting endpoints
 */

import { API_BASE_URL } from '@/config/api';
import { createRequest, type RequestOptions, type ApiError } from '../httpClient';

const request = createRequest('ReportsAPI');

/**
 * Build query string from params object
 * Handles arrays by repeating the key
 */
const buildQueryString = (params: Record<string, unknown>): string => {
  const urlParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach((v) => urlParams.append(key, String(v)));
    } else {
      urlParams.set(key, String(value));
    }
  });

  return urlParams.toString();
};

/**
 * Financial Reports API Client
 */
class ReportsAPI {
  private baseEndpoint: string;

  constructor() {
    this.baseEndpoint = '/crm/reports';
  }

  /**
   * List transactions with filtering and pagination
   */
  async listTransactions(params: Record<string, unknown> = {}): Promise<unknown> {
    const queryString = buildQueryString(params);
    const endpoint = queryString
      ? `${this.baseEndpoint}/transactions?${queryString}`
      : `${this.baseEndpoint}/transactions`;

    return request(endpoint, { method: 'GET' });
  }

  /**
   * Get transaction summary (aggregated statistics)
   */
  async getSummary(params: Record<string, unknown> = {}): Promise<unknown> {
    const queryString = buildQueryString(params);
    const endpoint = queryString
      ? `${this.baseEndpoint}/transactions/summary?${queryString}`
      : `${this.baseEndpoint}/transactions/summary`;

    return request(endpoint, { method: 'GET' });
  }

  /**
   * Get full report (transactions + summary)
   */
  async getReport(params: Record<string, unknown> = {}): Promise<unknown> {
    const queryString = buildQueryString(params);
    const endpoint = queryString
      ? `${this.baseEndpoint}/transactions/report?${queryString}`
      : `${this.baseEndpoint}/transactions/report`;

    return request(endpoint, { method: 'GET' });
  }

  /**
   * Get quick counts by transaction type
   */
  async getCounts(): Promise<unknown> {
    return request(`${this.baseEndpoint}/transactions/counts`, { method: 'GET' });
  }

  /**
   * Export transactions as CSV or PDF
   */
  async export(params: Record<string, unknown> = {}): Promise<Blob> {
    const queryString = buildQueryString(params);
    const url = `${API_BASE_URL}${this.baseEndpoint}/transactions/export?${queryString}`;
    const token = localStorage.getItem('access_token');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to export transactions');
    }

    return response.blob();
  }
}

const reportsAPI = new ReportsAPI();
export default reportsAPI;
