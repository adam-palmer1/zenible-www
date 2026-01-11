/**
 * Payment Integrations API Service
 * Handles payment gateway integrations (Stripe Connect, PayPal Connect)
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
    console.error('[PaymentIntegrationsAPI] Request error:', error);
    throw error;
  }
};

/**
 * Payment Integrations API Client
 */
class PaymentIntegrationsAPI {
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
   * @returns {Promise<Object>} Stripe connection status
   */
  async getStripeConnectStatus() {
    return request(`${this.stripeConnectEndpoint}/status`, {
      method: 'GET',
    });
  }

  /**
   * Initiate Stripe OAuth flow
   * @returns {Promise<Object>} { oauth_url, state, expires_at }
   */
  async initiateStripeOAuth() {
    return request(`${this.stripeConnectEndpoint}/accounts/connect`, {
      method: 'POST',
    });
  }

  /**
   * Handle Stripe OAuth callback
   * @param {string} code - Authorization code from Stripe
   * @param {string} state - State parameter for CSRF protection
   * @returns {Promise<Object>} Connection result
   */
  async handleStripeOAuthCallback(code, state) {
    const params = new URLSearchParams({ code, state }).toString();
    return request(`${this.stripeConnectEndpoint}/accounts/callback?${params}`, {
      method: 'GET',
    });
  }

  /**
   * Get Stripe dashboard link
   * @returns {Promise<Object>} Dashboard URL
   */
  async getStripeDashboardLink() {
    return request(`${this.stripeConnectEndpoint}/accounts/current/dashboard-link`, {
      method: 'POST',
    });
  }

  /**
   * Disconnect Stripe Connect account
   * @param {string} reason - Optional disconnect reason
   * @returns {Promise<void>}
   */
  async disconnectStripe(reason) {
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
   * @returns {Promise<Object>} PayPal connection status
   */
  async getPayPalStatus() {
    return request(`${this.paypalEndpoint}/status`, {
      method: 'GET',
    });
  }

  /**
   * Initiate PayPal Partner Referral connection
   * @param {Object} params - { return_url }
   * @returns {Promise<Object>} PayPal onboarding URL
   */
  async initiatePayPalConnect(params) {
    return request(`${this.paypalEndpoint}/connect`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Refresh PayPal account status
   * @returns {Promise<Object>} Updated PayPal status
   */
  async refreshPayPalStatus() {
    return request(`${this.paypalEndpoint}/refresh-status`, {
      method: 'POST',
    });
  }

  /**
   * Disconnect PayPal account
   * @param {Object} params - { reason?, confirm: true }
   * @returns {Promise<void>}
   */
  async disconnectPayPal(params = { confirm: true }) {
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
   * @returns {Promise<Array>} Payment integrations
   */
  async list() {
    return request(this.baseEndpoint, {
      method: 'GET',
    });
  }

  /**
   * Get a single payment integration
   * @param {string|number} integrationId - Integration ID
   * @returns {Promise<Object>} Payment integration
   */
  async get(integrationId) {
    return request(`${this.baseEndpoint}/${integrationId}`, {
      method: 'GET',
    });
  }

  /**
   * Get Stripe OAuth URL
   * @param {Object} params - OAuth parameters
   * @returns {Promise<Object>} OAuth URL and state
   */
  async getStripeOAuthURL(params = {}) {
    return request(`${this.baseEndpoint}/stripe/oauth-url`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Get PayPal OAuth URL
   * @param {Object} params - OAuth parameters
   * @returns {Promise<Object>} OAuth URL and state
   */
  async getPayPalOAuthURL(params = {}) {
    return request(`${this.baseEndpoint}/paypal/oauth-url`, {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  /**
   * Handle OAuth callback (both Stripe and PayPal)
   * @param {Object} callbackData - Callback data { code, state, provider }
   * @returns {Promise<Object>} Connected integration
   */
  async handleOAuthCallback(callbackData) {
    const { provider, code, state } = callbackData;

    return request(`${this.baseEndpoint}/${provider}/oauth-callback`, {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    });
  }

  /**
   * Disconnect a payment integration
   * @param {string|number} integrationId - Integration ID
   * @returns {Promise<void>}
   */
  async disconnect(integrationId) {
    return request(`${this.baseEndpoint}/${integrationId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Sync transactions from payment gateway
   * @param {string|number} integrationId - Integration ID
   * @param {Object} syncParams - Sync parameters { start_date, end_date, limit }
   * @returns {Promise<Object>} Sync result
   */
  async syncTransactions(integrationId, syncParams = {}) {
    return request(`${this.baseEndpoint}/${integrationId}/sync-transactions`, {
      method: 'POST',
      body: JSON.stringify(syncParams),
    });
  }

  /**
   * Sync customers from payment gateway (Stripe only)
   * @param {string|number} integrationId - Integration ID
   * @param {Object} syncParams - Sync parameters { limit }
   * @returns {Promise<Object>} Sync result
   */
  async syncCustomers(integrationId, syncParams = {}) {
    return request(`${this.baseEndpoint}/${integrationId}/sync-customers`, {
      method: 'POST',
      body: JSON.stringify(syncParams),
    });
  }

  /**
   * Test payment integration connection
   * @param {string|number} integrationId - Integration ID
   * @returns {Promise<Object>} Test result
   */
  async testConnection(integrationId) {
    return request(`${this.baseEndpoint}/${integrationId}/test-connection`, {
      method: 'POST',
    });
  }

  /**
   * Get payment integration transactions
   * @param {string|number} integrationId - Integration ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Transactions
   */
  async getTransactions(integrationId, params = {}) {
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
   * @param {string|number} integrationId - Integration ID
   * @param {Object} params - Query parameters
   * @returns {Promise<Array>} Customers
   */
  async getCustomers(integrationId, params = {}) {
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
   * @param {string|number} integrationId - Integration ID
   * @param {Object} settings - Settings to update
   * @returns {Promise<Object>} Updated integration
   */
  async updateSettings(integrationId, settings) {
    return request(`${this.baseEndpoint}/${integrationId}`, {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
  }

  /**
   * Get webhook endpoint URL
   * @param {string|number} integrationId - Integration ID
   * @returns {Promise<Object>} Webhook URL and secret
   */
  async getWebhookEndpoint(integrationId) {
    return request(`${this.baseEndpoint}/${integrationId}/webhook-endpoint`, {
      method: 'GET',
    });
  }

  /**
   * Refresh webhook secret
   * @param {string|number} integrationId - Integration ID
   * @returns {Promise<Object>} New webhook secret
   */
  async refreshWebhookSecret(integrationId) {
    return request(`${this.baseEndpoint}/${integrationId}/refresh-webhook-secret`, {
      method: 'POST',
    });
  }
}

// Export singleton instance
const paymentIntegrationsAPI = new PaymentIntegrationsAPI();
export default paymentIntegrationsAPI;
