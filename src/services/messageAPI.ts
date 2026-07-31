import { makeAuthenticatedRequest } from '../utils/auth';
import { API_BASE_URL, ZBI_API_BASE_URL } from '@/config/api';

export const messageAPI = {
  /**
   * Update a message in a conversation
   */
  async updateMessage(conversationId: string, messageId: string, data: unknown): Promise<unknown> {
    const response = await makeAuthenticatedRequest(`${ZBI_API_BASE_URL}/ai/conversations/${conversationId}/messages/${messageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to update message: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Rate a message
   */
  async rateMessage(conversationId: string, messageId: string, rating: 'good' | 'bad' | null): Promise<unknown> {
    const response = await makeAuthenticatedRequest(`${ZBI_API_BASE_URL}/ai/conversations/${conversationId}/messages/${messageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rating }),
    });

    if (!response.ok) {
      throw new Error(`Failed to rate message: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Update message metadata
   */
  async updateMessageMetadata(conversationId: string, messageId: string, metadata: unknown): Promise<unknown> {
    const response = await makeAuthenticatedRequest(`${ZBI_API_BASE_URL}/ai/conversations/${conversationId}/messages/${messageId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ metadata }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update message metadata: ${response.status}`);
    }

    return response.json();
  },

  /**
   * Soft-delete a message. Removes it from future LLM context
   * and from subsequent history fetches.
   */
  async deleteMessage(conversationId: string, messageId: string): Promise<void> {
    const response = await makeAuthenticatedRequest(
      `${ZBI_API_BASE_URL}/ai/conversations/${conversationId}/messages/${messageId}`,
      { method: 'DELETE' }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete message: ${response.status}`);
    }
  },

  /**
   * Create a share link for a conversation.
   */
  async getShareLink(conversationId: string): Promise<{ shared: boolean; share_code?: string; share_url?: string }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/conversations/${conversationId}/share`,
      { method: 'GET' }
    );
    if (!response.ok) {
      throw new Error(`Failed to get share link: ${response.status}`);
    }
    return response.json();
  },

  async createShareLink(conversationId: string): Promise<{ share_code: string; share_url: string }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/conversations/${conversationId}/share`,
      { method: 'POST' }
    );
    if (!response.ok) {
      throw new Error(`Failed to create share link: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Revoke a share link for a conversation.
   */
  async deleteShareLink(conversationId: string): Promise<void> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/conversations/${conversationId}/share`,
      { method: 'DELETE' }
    );
    if (!response.ok) {
      throw new Error(`Failed to revoke share link: ${response.status}`);
    }
  },

  /**
   * Get a public shared conversation (no auth required).
   */
  async getPublicConversation(shareCode: string): Promise<{
    title: string;
    created_at: string;
    participants: Array<{ name: string; avatar_url: string | null }>;
    messages: Array<{ sender_type: string; sender_name: string; avatar_url: string | null; content: string | null; created_at: string }>;
  }> {
    const response = await fetch(`${API_BASE_URL}/shared/conversations/${shareCode}`);
    if (!response.ok) {
      throw new Error('Conversation not found or link has been revoked');
    }
    return response.json();
  },
};

export default messageAPI;
