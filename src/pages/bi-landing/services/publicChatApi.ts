import { ZBI_API_BASE_URL } from '../../../config/api';

const BASE = `${ZBI_API_BASE_URL}/public/chat`;

export interface PublicChatSession {
  session_token: string;
  character_id: string;
  character_name: string;
  character_avatar_url: string | null;
  session_limit: number | null;
  daily_limit: number | null;
  monthly_limit: number | null;
  // Tightest-limit summary (backend picks whichever of session/daily/monthly
  // has the fewest remaining). Null when no caps are configured.
  messages_remaining: number | null;
  messages_limit: number | null;
  limit_type: 'session' | 'daily' | 'monthly' | null;
}

export interface SessionInfo extends PublicChatSession {
  message_count: number;
  messages: ChatMessageDTO[];
}

export interface ChatMessageDTO {
  id: string;
  sender_type: 'USER' | 'AI' | 'SYSTEM';
  sender_id: string;
  content: string | null;
  created_at: string;
}

export interface PublicCharacter {
  id: string;
  name: string;
  internal_name: string;
  description: string | null;
  avatar_url: string | null;
  display_order: number;
  is_accessible: boolean;
  required_plan_name?: string;
  required_plan_price?: number;
  metadata?: { conversation_starters?: string[] };
}

export const publicChatApi = {
  async getCharacters(): Promise<PublicCharacter[]> {
    const resp = await fetch(`${BASE}/characters`);
    if (!resp.ok) return [];
    return resp.json();
  },

  async createSession(characterId: string, visitorId?: string): Promise<PublicChatSession> {
    const resp = await fetch(`${BASE}/sessions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character_id: characterId, visitor_id: visitorId }),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: 'Failed to create session' }));
      throw new Error(err.detail || `HTTP ${resp.status}`);
    }
    return resp.json();
  },

  async getSession(sessionToken: string): Promise<SessionInfo> {
    const resp = await fetch(`${BASE}/sessions/${sessionToken}`);
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: 'Session not found' }));
      throw new Error(err.detail || `HTTP ${resp.status}`);
    }
    return resp.json();
  },

  /**
   * Send a message and return the raw Response for SSE streaming.
   * Caller must read from response.body to parse SSE events.
   */
  async sendMessage(sessionToken: string, message: string, characterId?: string, visitorId?: string): Promise<Response> {
    const payload: Record<string, string> = { session_token: sessionToken, message };
    if (characterId) payload.character_id = characterId;
    if (visitorId) payload.visitor_id = visitorId;
    const resp = await fetch(`${BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({ detail: 'Failed to send message' }));
      throw new Error(err.detail || `HTTP ${resp.status}`);
    }
    return resp;
  },
};
