// API service for User endpoints
import { createRequest, createZbiRequest } from './api/httpClient';

const request = createRequest('UserAPI');
const zbiRequest = createZbiRequest('UserAPI');

class UserAPI {
  // Get current user profile
  async getCurrentUser(): Promise<unknown> {
    return request('/users/me', { method: 'GET' });
  }

  // Get user's available features and settings
  async getUserFeatures(): Promise<unknown> {
    return request('/users/me/features', { method: 'GET' });
  }

  // Alias for getUserFeatures to match ProposalWizard's expected method name
  async getCurrentUserFeatures(): Promise<unknown> {
    return this.getUserFeatures();
  }

  // Update user profile
  async updateProfile(data: unknown): Promise<unknown> {
    return request('/users/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Get user's subscription details
  async getSubscription(): Promise<unknown> {
    return request('/users/me/subscription', { method: 'GET' });
  }

  // Get user's conversations with pagination and filtering
  async getUserConversations(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/ai/conversations/?${queryString}` : '/ai/conversations/';
    return zbiRequest(endpoint, { method: 'GET' });
  }

  // Toggle starred status of a conversation
  async toggleStarConversation(conversationId: string): Promise<unknown> {
    return zbiRequest(`/ai/conversations/${conversationId}/star`, { method: 'PATCH' });
  }

  // Delete a conversation
  async deleteConversation(conversationId: string): Promise<void> {
    await zbiRequest(`/ai/conversations/${conversationId}`, { method: 'DELETE' });
  }

  // Get messages for a specific conversation with pagination and filtering
  async getConversationMessages(conversationId: string, params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/ai/conversations/${conversationId}/messages?${queryString}`
      : `/ai/conversations/${conversationId}/messages`;
    return zbiRequest(endpoint, { method: 'GET' });
  }

  // Get detailed conversation with messages
  async getUserConversation(conversationId: string): Promise<unknown> {
    return zbiRequest(`/ai/conversations/${conversationId}`, { method: 'GET' });
  }

  // Export user conversation in specified format
  async exportUserConversation(conversationId: string, format: string = 'json'): Promise<unknown> {
    const response = await zbiRequest<unknown>(`/ai/conversations/${conversationId}/export`, {
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
