import { makeAuthenticatedRequest } from '../utils/auth';
import { API_BASE_URL } from '@/config/api';

export const messageAPI = {
  /**
   * Update a message in a conversation
   */
  async updateMessage(conversationId: string, messageId: string, data: unknown): Promise<unknown> {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/ai/conversations/${conversationId}/messages/${messageId}`, {
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
  async rateMessage(conversationId: string, messageId: string, rating: 'good' | 'bad'): Promise<unknown> {
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/ai/conversations/${conversationId}/messages/${messageId}`, {
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
    const response = await makeAuthenticatedRequest(`${API_BASE_URL}/ai/conversations/${conversationId}/messages/${messageId}`, {
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
};

export default messageAPI;
