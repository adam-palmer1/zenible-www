import { makeAuthenticatedRequest } from '../utils/auth';
import { API_BASE_URL } from '@/config/api';

export const messageAPI = {
  /**
   * Update a message in a conversation
   * @param {string} conversationId - The conversation ID
   * @param {string} messageId - The message ID
   * @param {Object} data - Update data (rating, content, metadata)
   * @returns {Promise<Object>} Updated message
   */
  async updateMessage(conversationId, messageId, data) {
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
   * @param {string} conversationId - The conversation ID
   * @param {string} messageId - The message ID
   * @param {'good'|'bad'} rating - The rating value
   * @returns {Promise<Object>} Updated message
   */
  async rateMessage(conversationId, messageId, rating) {
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
   * @param {string} conversationId - The conversation ID
   * @param {string} messageId - The message ID
   * @param {Object} metadata - Metadata to update
   * @returns {Promise<Object>} Updated message
   */
  async updateMessageMetadata(conversationId, messageId, metadata) {
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