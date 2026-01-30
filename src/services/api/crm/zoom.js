// API service for Zoom Integration endpoints

import { API_BASE_URL } from '@/config/api';

class ZoomAPI {
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

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Zoom API request failed:', error);
      throw error;
    }
  }

  // Initiate Zoom OAuth connection
  async getConnectUrl() {
    return this.request('/crm/zoom/connect', { method: 'GET' });
  }

  // Handle OAuth callback
  async handleCallback(code, state) {
    return this.request('/crm/zoom/callback', {
      method: 'POST',
      body: JSON.stringify({ code, state }),
    });
  }

  // Get connection status
  async getStatus() {
    return this.request('/crm/zoom/status', { method: 'GET' });
  }

  // Disconnect Zoom
  async disconnect() {
    return this.request('/crm/zoom/disconnect', { method: 'DELETE' });
  }
}

export default new ZoomAPI();
