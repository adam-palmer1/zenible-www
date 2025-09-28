// API service for User endpoints

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://demo-api.zenible.com/api/v1';

class UserAPI {
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
      console.error('User API request failed:', error);
      throw error;
    }
  }

  // Get current user profile
  async getCurrentUser() {
    return this.request('/users/me', { method: 'GET' });
  }

  // Get user's available features and settings
  async getUserFeatures() {
    return this.request('/users/me/features', { method: 'GET' });
  }

  // Update user profile
  async updateProfile(data) {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Get user's subscription details
  async getSubscription() {
    return this.request('/users/me/subscription', { method: 'GET' });
  }
}

export default new UserAPI();