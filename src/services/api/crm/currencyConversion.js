// API service for Currency Conversion endpoints

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://demo-api.zenible.com/api/v1';

class CurrencyConversionAPI {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Request failed' }));
        throw new Error(error.detail || `Request failed with status ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Currency Conversion API request failed:', error);
      throw error;
    }
  }

  // Convert single amount
  async convert(amount, fromCurrency, toCurrency) {
    return this.request('/crm/currency/convert', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        from_currency: fromCurrency,
        to_currency: toCurrency,
      }),
    });
  }

  // Batch convert multiple amounts
  async batchConvert(conversions) {
    return this.request('/crm/currency/batch-convert', {
      method: 'POST',
      body: JSON.stringify({ conversions }),
    });
  }

  // Get exchange rates for multiple currencies
  async getRates(baseCurrency, currencies) {
    return this.request('/crm/currency/rates', {
      method: 'POST',
      body: JSON.stringify({
        base_currency: baseCurrency,
        currencies,
      }),
    });
  }

  // Get cache information (for monitoring)
  async getCacheInfo() {
    return this.request('/crm/currency/cache/info', { method: 'GET' });
  }

  // Clear cache (admin only)
  async clearCache() {
    return this.request('/crm/currency/cache/clear', { method: 'POST' });
  }
}

export default new CurrencyConversionAPI();
