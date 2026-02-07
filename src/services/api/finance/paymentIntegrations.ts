/**
 * Payment Integrations API Service
 * Handles payment gateway integrations (Stripe Connect, PayPal Connect)
 */

import { createRequest, type RequestOptions, type ApiError } from '../httpClient';

const request = createRequest('PaymentIntegrationsAPI');

/**
 * Payment Integrations API Client
 */
class PaymentIntegrationsAPI {
  private baseEndpoint: string;
  private stripeConnectEndpoint: string;
  private paypalEndpoint: string;

  constructor() {
    this.baseEndpoint = '/crm/payment-integrations/';
    this.stripeConnectEndpoint = '/stripe-connect';
    this.paypalEndpoint = '/crm/paypal';
  }

  // ==========================================
  // Stripe Connect API Methods (Standard Account OAuth)
  // ==========================================

  /**
   * Get Stripe Connect connection status
   */
  async getStripeConnectStatus(): Promise<unknown> {
    return request(`${this.stripeConnectEndpoint}/status`, {
      method: 'GET',
    });
  }

  /**
   * Initiate Stripe OAuth flow
   */
  async initiateStripeOAuth(): Promise<unknown> {
    return request(`${this.stripeConnectEndpoint}/accounts/connect`, {
      method: 'POST',
    });
  }

  /**
   * Handle Stripe OAuth callback
   */
  async handleStripeOAuthCallback(code: string, state: string): Promise<unknown> {
    const params = new URLSearchParams({ code, state }).toString();
    return request(`${this.stripeConnectEndpoint}/accounts/callback?${params}`, {
      method: 'GET',
    });
  }

  /**
   * Get Stripe dashboard link
   */
  async getStripeDashboardLink(): Promise<unknown> {
    return request(`${this.stripeConnectEndpoint}/accounts/current/dashboard-link`, {
      method: 'POST',
    });
  }

  /**
   * Disconnect Stripe Connect account
   */
  async disconnectStripe(reason?: string): Promise<unknown> {
    const queryString = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    return request(`${this.stripeConnectEndpoint}/accounts/current${queryString}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // PayPal Connect API Methods
  // ==========================================

  /**
   * Get PayPal connection status
   */
  async getPayPalStatus(): Promise<unknown> {
    return request(`${this.paypalEndpoint}/status`, {
      method: 'GET',
    });
  }

  /**
   * Initiate PayPal Partner Referral connection
   */
  async initiatePayPalConnect(params: unknown): Promise<unknown> {
    return request(`${this.paypalEndpoint}/connect`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Refresh PayPal account status
   */
  async refreshPayPalStatus(): Promise<unknown> {
    return request(`${this.paypalEndpoint}/refresh-status`, {
      method: 'POST',
    });
  }

  /**
   * Disconnect PayPal account
   */
  async disconnectPayPal(params: unknown = { confirm: true }): Promise<unknown> {
    return request(`${this.paypalEndpoint}/disconnect`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  // ==========================================
  // Legacy Payment Integrations API Methods
  // ==========================================

  /**
   * List all payment integrations
   */
  async list(): Promise<unknown> {
    return request(this.baseEndpoint, {
      method: 'GET',
    });
  }

  /**
   * Get a single payment integration
   */
  async get(integrationId: string): Promise<unknown> {
    return request(`${this.baseEndpoint}/${integrationId}`, {
      method: 'GET',
    });
  }

  /**
   * Get Stripe OAuth URL
   */
  async getStripeOAuthURL(params: unknown = {}): Promise<unknown> {
    return request(`${this.baseEndpoint}/stripe/oauth-url`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get PayPal OAuth URL
   */
  async getPayPalOAuthURL(params: unknown = {}): Promise<unknown> {
    return request(`${this.baseEndpoint}/paypal/oauth-url`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Handle OAuth callback (both Stripe and PayPal)
   */
  async handleOAuthCallback(callbackData: { provider: string; code: string; state: string }): Promise<unknown> {
    const { provider, code, state } = callbackData;

    return request(`${this.baseEndpoint}/${provider}/oauth-callback`, {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    });
  }

  /**
   * Disconnect a payment integration
   */
  async disconnect(integrationId: string): Promise<unknown> {
    return request(`${this.baseEndpoint}/${integrationId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Sync transactions from payment gateway
   */
  async syncTransactions(integrationId: string, syncParams: unknown = {}): Promise<unknown> {
    return request(`${this.baseEndpoint}/${integrationId}/sync-transactions`, {
      method: 'POST',
      body: JSON.stringify(syncParams),
    });
  }

  /**
   * Sync customers from payment gateway (Stripe only)
   */
  async syncCustomers(integrationId: string, syncParams: unknown = {}): Promise<unknown> {
    return request(`${this.baseEndpoint}/${integrationId}/sync-customers`, {
      method: 'POST',
      body: JSON.stringify(syncParams),
    });
  }

  /**
   * Test payment integration connection
   */
  async testConnection(integrationId: string): Promise<unknown> {
    return request(`${this.baseEndpoint}/${integrationId}/test-connection`, {
      method: 'POST',
    });
  }

  /**
   * Get payment integration transactions
   */
  async getTransactions(integrationId: string, params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${this.baseEndpoint}/${integrationId}/transactions?${queryString}`
      : `${this.baseEndpoint}/${integrationId}/transactions`;

    return request(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Get payment integration customers
   */
  async getCustomers(integrationId: string, params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `${this.baseEndpoint}/${integrationId}/customers?${queryString}`
      : `${this.baseEndpoint}/${integrationId}/customers`;

    return request(endpoint, {
      method: 'GET',
    });
  }

  /**
   * Update payment integration settings
   */
  async updateSettings(integrationId: string, settings: unknown): Promise<unknown> {
    return request(`${this.baseEndpoint}/${integrationId}`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }

  /**
   * Get webhook endpoint URL
   */
  async getWebhookEndpoint(integrationId: string): Promise<unknown> {
    return request(`${this.baseEndpoint}/${integrationId}/webhook-endpoint`, {
      method: 'GET',
    });
  }

  /**
   * Refresh webhook secret
   */
  async refreshWebhookSecret(integrationId: string): Promise<unknown> {
    return request(`${this.baseEndpoint}/${integrationId}/refresh-webhook-secret`, {
      method: 'POST',
    });
  }
}

// Export singleton instance
const paymentIntegrationsAPI = new PaymentIntegrationsAPI();
export default paymentIntegrationsAPI;
