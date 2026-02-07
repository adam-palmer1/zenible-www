// API service for User endpoints
import { API_BASE_URL } from '@/config/api';
import logger from '../utils/logger';

class UserAPI {
  private async request<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
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

      return await response.json() as T;
    } catch (error) {
      logger.error('User API request failed:', error);
      throw error;
    }
  }

  // Get current user profile
  async getCurrentUser(): Promise<unknown> {
    return this.request('/users/me', { method: 'GET' });
  }

  // Get user's available features and settings
  async getUserFeatures(): Promise<unknown> {
    return this.request('/users/me/features', { method: 'GET' });
  }

  // Alias for getUserFeatures to match ProposalWizard's expected method name
  async getCurrentUserFeatures(): Promise<unknown> {
    return this.getUserFeatures();
  }

  // Update user profile
  async updateProfile(data: unknown): Promise<unknown> {
    return this.request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Get user's subscription details
  async getSubscription(): Promise<unknown> {
    return this.request('/users/me/subscription', { method: 'GET' });
  }

  // Get user's conversations with pagination and filtering
  async getUserConversations(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/ai/conversations/?${queryString}` : '/ai/conversations/';
    return this.request(endpoint, { method: 'GET' });
  }

  // Get messages for a specific conversation with pagination and filtering
  async getConversationMessages(conversationId: string, params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/ai/conversations/${conversationId}/messages?${queryString}`
      : `/ai/conversations/${conversationId}/messages`;
    return this.request(endpoint, { method: 'GET' });
  }

  // Get detailed conversation with messages
  async getUserConversation(conversationId: string): Promise<unknown> {
    return this.request(`/ai/conversations/${conversationId}`, { method: 'GET' });
  }

  // Export user conversation in specified format
  async exportUserConversation(conversationId: string, format: string = 'json'): Promise<unknown> {
    const response = await this.request<unknown>(`/ai/conversations/${conversationId}/export`, {
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
