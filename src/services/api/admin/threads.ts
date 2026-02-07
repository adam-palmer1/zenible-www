/**
 * Admin Threads API Service
 * Handles thread management, messages, and conversation admin operations
 */

import { createRequest } from '../httpClient';

const request = createRequest('AdminThreadsAPI');

const adminThreadsAPI = {
  // Thread management endpoints
  async getThreads(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/ai/threads/?${queryString}` : '/ai/threads/';
    return request(endpoint, { method: 'GET' });
  },

  async getThread(threadId: string): Promise<unknown> {
    return request(`/ai/threads/${threadId}`, { method: 'GET' });
  },

  async getOpenAIThread(threadId: string): Promise<unknown> {
    return request(`/ai/threads/${threadId}/openai`, { method: 'GET' });
  },

  async getThreadMessages(threadId: string, params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/ai/threads/${threadId}/messages?${queryString}` : `/ai/threads/${threadId}/messages`;
    return request(endpoint, { method: 'GET' });
  },

  async deleteThread(threadId: string, deleteFromOpenAI: boolean = true): Promise<unknown> {
    const endpoint = `/ai/threads/${threadId}?delete_from_openai=${deleteFromOpenAI}`;
    return request(endpoint, { method: 'DELETE' });
  },

  async updateThreadStatus(threadId: string, status: string): Promise<unknown> {
    return request(`/ai/threads/${threadId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async getUserThreads(userId: string): Promise<unknown> {
    return request(`/ai/threads/user/${userId}`, { method: 'GET' });
  },

  async cleanupOrphanedThreads(dryRun: boolean = true): Promise<unknown> {
    const endpoint = `/ai/threads/cleanup?dry_run=${dryRun}`;
    return request(endpoint, { method: 'POST' });
  },

  // Conversation Management endpoints
  async getConversations(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/ai/conversations/admin/all?${queryString}` : '/ai/conversations/admin/all';
    return request(endpoint, { method: 'GET' });
  },

  async getConversation(conversationId: string): Promise<unknown> {
    return request(`/ai/conversations/admin/${conversationId}`, { method: 'GET' });
  },

  async getConversationStats(params: Record<string, string> = {}): Promise<unknown> {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/ai/conversations/admin/stats?${queryString}` : '/ai/conversations/admin/stats';
    return request(endpoint, { method: 'GET' });
  },

  async exportConversation(conversationId: string, format: string = 'json'): Promise<unknown> {
    const response = await request<unknown>(`/ai/conversations/admin/${conversationId}/export`, {
      method: 'POST',
      body: JSON.stringify({ format }),
    });

    // Handle different export formats
    if (format === 'json') {
      return response;
    } else if (format === 'csv' || format === 'txt') {
      // For CSV and TXT, the response might be text/plain
      // Convert to downloadable format
      const blob = new Blob([response as BlobPart], {
        type: format === 'csv' ? 'text/csv' : 'text/plain'
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversation_${conversationId}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      return { success: true, format };
    }

    return response;
  },
};

export default adminThreadsAPI;
