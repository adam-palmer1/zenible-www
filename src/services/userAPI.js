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

  // Get user's conversations with pagination and filtering
  async getUserConversations(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/ai/conversations/?${queryString}` : '/ai/conversations/';
    return this.request(endpoint, { method: 'GET' });
  }

  // Get detailed conversation with messages
  async getUserConversation(conversationId) {
    return this.request(`/ai/conversations/${conversationId}`, { method: 'GET' });
  }

  // Export user conversation in specified format
  async exportUserConversation(conversationId, format = 'json') {
    const response = await this.request(`/ai/conversations/${conversationId}/export`, {
      method: 'GET',
      headers: {
        'Accept': format === 'csv' ? 'text/csv' : format === 'txt' ? 'text/plain' : 'application/json'
      }
    });

    // Handle file download
    if (response) {
      const blob = new Blob([JSON.stringify(response, null, 2)], {
        type: format === 'csv' ? 'text/csv' : format === 'txt' ? 'text/plain' : 'application/json'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation_${conversationId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }

    return response;
  }
}

export default new UserAPI();