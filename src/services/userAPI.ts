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

  // Export user conversation in specified format. Always fetches JSON from the
  // backend (the only format it supports) and converts client-side. Returns a
  // Blob containing the formatted content; the caller is responsible for the
  // download.
  async exportUserConversation(conversationId: string, format: string = 'json'): Promise<Blob> {
    const response = await zbiRequest<ConversationExportResponse>(
      `/ai/conversations/${conversationId}/export`,
      { method: 'GET' }
    );

    const fmt = format.toLowerCase();
    if (fmt === 'markdown' || fmt === 'md') {
      return new Blob([conversationExportToMarkdown(response)], { type: 'text/markdown' });
    }
    if (fmt === 'txt') {
      return new Blob([conversationExportToText(response)], { type: 'text/plain' });
    }
    // Default: JSON
    return new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' });
  }
}

interface ConversationExportMessage {
  sender_type?: string;
  sender_name?: string | null;
  content?: string;
  created_at?: string;
}

interface ConversationExportResponse {
  conversation?: {
    title?: string | null;
    summary?: string | null;
    created_at?: string;
  };
  messages?: ConversationExportMessage[];
}

function senderLabel(msg: ConversationExportMessage): string {
  const type = (msg.sender_type || '').toString().toLowerCase();
  if (msg.sender_name) return msg.sender_name;
  if (type === 'user') return 'You';
  if (type === 'assistant' || type === 'ai') return 'Assistant';
  if (type === 'system') return 'System';
  return type ? type.charAt(0).toUpperCase() + type.slice(1) : 'Unknown';
}

function conversationExportToMarkdown(data: ConversationExportResponse): string {
  const lines: string[] = [];
  const title = data.conversation?.title || 'Conversation';
  lines.push(`# ${title}`);
  if (data.conversation?.created_at) {
    lines.push('', `_Created: ${data.conversation.created_at}_`);
  }
  if (data.conversation?.summary) {
    lines.push('', '## Summary', '', data.conversation.summary);
  }
  lines.push('', '## Messages', '');
  for (const msg of data.messages || []) {
    const ts = msg.created_at ? ` — ${msg.created_at}` : '';
    lines.push(`### ${senderLabel(msg)}${ts}`, '', (msg.content || '').trim(), '');
  }
  return lines.join('\n');
}

function conversationExportToText(data: ConversationExportResponse): string {
  const lines: string[] = [];
  const title = data.conversation?.title || 'Conversation';
  lines.push(title, '='.repeat(title.length), '');
  for (const msg of data.messages || []) {
    const ts = msg.created_at ? ` [${msg.created_at}]` : '';
    lines.push(`${senderLabel(msg)}${ts}:`, (msg.content || '').trim(), '');
  }
  return lines.join('\n');
}

export default new UserAPI();
