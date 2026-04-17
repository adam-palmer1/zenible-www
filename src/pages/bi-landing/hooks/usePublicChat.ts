import { useState, useCallback, useRef, useEffect } from 'react';
import { publicChatApi, type ChatMessageDTO } from '../services/publicChatApi';

const STORAGE_KEY = 'zbi_public_session';
const VISITOR_KEY = 'zbi_visitor_id';

function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

interface CharacterInfo {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface UsePublicChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  streamingContent: string;
  characterInfo: CharacterInfo | null;
  messagesRemaining: number | null;
  maxMessages: number | null;
  limitType: 'session' | 'daily' | 'monthly' | null;
  isSessionExpired: boolean;
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  selectCharacter: (id: string, name: string, avatarUrl: string | null) => void;
  clearError: () => void;
}

function dtoToMessage(dto: ChatMessageDTO): ChatMessage | null {
  if (!dto.content) return null;
  return {
    id: dto.id,
    role: dto.sender_type === 'USER' ? 'user' : 'assistant',
    content: dto.content,
    createdAt: dto.created_at,
  };
}

export function usePublicChat(): UsePublicChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [characterInfo, setCharacterInfo] = useState<CharacterInfo | null>(null);
  const [messagesRemaining, setMessagesRemaining] = useState<number | null>(null);
  const [maxMessages, setMaxMessages] = useState<number | null>(null);
  const [limitType, setLimitType] = useState<'session' | 'daily' | 'monthly' | null>(null);
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionTokenRef = useRef<string | null>(null);
  const selectedCharIdRef = useRef<string | null>(null);

  // Try to restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const { token } = JSON.parse(stored);
        if (token) {
          resumeSession(token);
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const resumeSession = useCallback(async (token: string) => {
    setIsLoading(true);
    try {
      const info = await publicChatApi.getSession(token);
      sessionTokenRef.current = info.session_token;
      selectedCharIdRef.current = info.character_id;
      setCharacterInfo({
        id: info.character_id,
        name: info.character_name,
        avatarUrl: info.character_avatar_url,
      });
      // Prefer the backend-computed tightest-limit summary (session vs daily
      // vs monthly, whichever has the fewest remaining). Fall back to the
      // session-only math for older API responses that don't include it.
      if (info.messages_remaining != null && info.messages_limit != null) {
        setMessagesRemaining(info.messages_remaining);
        setMaxMessages(info.messages_limit);
        setLimitType(info.limit_type);
      } else if (info.session_limit !== null && info.session_limit !== undefined) {
        setMessagesRemaining(Math.max(0, info.session_limit - info.message_count));
        setMaxMessages(info.session_limit);
        setLimitType('session');
      }

      const restored = info.messages
        .map(dtoToMessage)
        .filter((m): m is ChatMessage => m !== null);
      setMessages(restored);
      setIsSessionExpired(false);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      sessionTokenRef.current = null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Select a character — just updates local state, keeps conversation
  const selectCharacter = useCallback((id: string, name: string, avatarUrl: string | null) => {
    selectedCharIdRef.current = id;
    setCharacterInfo({ id, name, avatarUrl });
    setError(null);
  }, []);

  // Create session lazily on first message
  const ensureSession = useCallback(async (): Promise<string | null> => {
    if (sessionTokenRef.current) return sessionTokenRef.current;

    const charId = selectedCharIdRef.current;
    if (!charId) return null;

    try {
      const session = await publicChatApi.createSession(charId, getVisitorId());
      sessionTokenRef.current = session.session_token;
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ token: session.session_token, characterId: charId })
      );
      setCharacterInfo({
        id: session.character_id,
        name: session.character_name,
        avatarUrl: session.character_avatar_url,
      });
      if (session.messages_remaining != null && session.messages_limit != null) {
        setMessagesRemaining(session.messages_remaining);
        setMaxMessages(session.messages_limit);
        setLimitType(session.limit_type);
      } else if (session.session_limit !== null && session.session_limit !== undefined) {
        setMessagesRemaining(session.session_limit);
        setMaxMessages(session.session_limit);
        setLimitType('session');
      }
      return session.session_token;
    } catch (err: any) {
      setError(err.message || 'Failed to start session');
      return null;
    }
  }, [maxMessages]);

  const sendMessage = useCallback(async (text: string) => {
    if (isStreaming || !selectedCharIdRef.current) return;

    const trimmed = text.trim();
    if (!trimmed) return;

    setError(null);

    // Add user message optimistically
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setStreamingContent('');

    try {
      // Create session lazily if needed
      const token = await ensureSession();
      if (!token) {
        setIsStreaming(false);
        return;
      }

      const response = await publicChatApi.sendMessage(token, trimmed, selectedCharIdRef.current || undefined, getVisitorId());
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;

          try {
            const payload = JSON.parse(line.slice(6));

            if (payload.type === 'chunk') {
              fullContent += payload.content;
              setStreamingContent(fullContent);
            } else if (payload.type === 'done') {
              fullContent = payload.content || fullContent;
            } else if (payload.type === 'error') {
              setError(payload.message || 'An error occurred');
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }

      if (fullContent) {
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: fullContent,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setMessagesRemaining((prev) => Math.max(0, prev - 1));
      }
    } catch (err: any) {
      if (err.message?.includes('expired')) {
        setIsSessionExpired(true);
        localStorage.removeItem(STORAGE_KEY);
      } else if (err.message?.includes('limit reached')) {
        setMessagesRemaining(0);
      } else {
        setError(err.message || 'Failed to send message');
      }
    } finally {
      setIsStreaming(false);
      setStreamingContent('');
    }
  }, [isStreaming, ensureSession]);

  const clearError = useCallback(() => setError(null), []);

  return {
    messages,
    isStreaming,
    streamingContent,
    characterInfo,
    messagesRemaining,
    maxMessages,
    limitType,
    isSessionExpired,
    isLoading,
    error,
    sendMessage,
    selectCharacter,
    clearError,
  };
}
