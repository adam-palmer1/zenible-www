import { useState, useCallback, useRef, useContext, useEffect } from 'react';
import { WebSocketContext, WebSocketContextValue } from '../contexts/WebSocketContext';
import type { FollowUpMessage } from '../components/shared/ai-feedback/types';

interface UseBoardroomChatReturn {
  conversationId: string | null;
  messages: FollowUpMessage[];
  isStreaming: boolean;
  streamingContent: string;
  isSending: boolean;
  error: string | null;
  sendMessage: (text: string) => Promise<void>;
  loadConversation: (convId: string, existingMessages: FollowUpMessage[]) => void;
  clearChat: () => void;
  setConversationId: (id: string | null) => void;
}

export function useBoardroomChat(characterId: string | null): UseBoardroomChatReturn {
  const wsContext = useContext(WebSocketContext) as WebSocketContextValue;

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<FollowUpMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track unsubscribers for event handlers
  const unsubscribersRef = useRef<Array<() => void>>([]);
  // Track conversationId in a ref for use in async callbacks
  const conversationIdRef = useRef<string | null>(null);
  const characterIdRef = useRef<string | null>(characterId);

  // Keep refs in sync
  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  useEffect(() => {
    characterIdRef.current = characterId;
  }, [characterId]);

  // Cleanup event handlers
  const cleanupHandlers = useCallback(() => {
    unsubscribersRef.current.forEach(unsub => unsub());
    unsubscribersRef.current = [];
  }, []);

  // Register event handlers for a conversation
  const registerHandlers = useCallback((convId: string) => {
    if (!wsContext?.onConversationEvent) return;

    cleanupHandlers();

    // Handle streaming chunks (non-tool responses only)
    unsubscribersRef.current.push(
      wsContext.onConversationEvent(convId, 'chunk', (...args: unknown[]) => {
        const data = args[0] as { toolName?: string; fullContent?: string };
        if (!data.toolName) {
          setIsStreaming(true);
          setIsSending(false);
          setStreamingContent(data.fullContent || '');
        }
      })
    );

    // Handle completion
    unsubscribersRef.current.push(
      wsContext.onConversationEvent(convId, 'complete', (...args: unknown[]) => {
        const data = args[0] as { toolName?: string; fullResponse?: string; messageId?: string };
        if (!data.toolName) {
          setIsStreaming(false);
          setStreamingContent('');
          setIsSending(false);

          setMessages(prev => [...prev, {
            role: 'assistant',
            content: data.fullResponse || '',
            timestamp: new Date().toISOString(),
            messageId: data.messageId,
          }]);
        }
      })
    );

    // Handle errors
    unsubscribersRef.current.push(
      wsContext.onConversationEvent(convId, 'error', (...args: unknown[]) => {
        const data = args[0] as { error?: string };
        console.error('[Boardroom] Chat error:', data);
        setIsStreaming(false);
        setStreamingContent('');
        setIsSending(false);
        setError(data?.error || 'An error occurred');
      })
    );
  }, [wsContext, cleanupHandlers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupHandlers();
    };
  }, [cleanupHandlers]);

  const sendMessage = useCallback(async (text: string) => {
    if (!characterIdRef.current) {
      setError('No character selected');
      return;
    }

    if (!wsContext) {
      setError('Not connected to server');
      return;
    }

    setError(null);
    setIsSending(true);

    // Add user message immediately
    setMessages(prev => [...prev, {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }]);

    try {
      let convId = conversationIdRef.current;

      // Create conversation if needed
      if (!convId) {
        convId = await wsContext.createConversation(
          characterIdRef.current,
          'boardroom',
          {}
        );
        conversationIdRef.current = convId;
        setConversationId(convId);
        registerHandlers(convId);
      }

      // Send message
      wsContext.sendMessage(convId, characterIdRef.current, text);
    } catch (err) {
      console.error('[Boardroom] Failed to send message:', err);
      setIsSending(false);
      setError('Failed to send message. Please try again.');
    }
  }, [wsContext, registerHandlers]);

  const loadConversation = useCallback((convId: string, existingMessages: FollowUpMessage[]) => {
    cleanupHandlers();
    conversationIdRef.current = convId;
    setConversationId(convId);
    setMessages(existingMessages);
    setIsStreaming(false);
    setStreamingContent('');
    setIsSending(false);
    setError(null);
    registerHandlers(convId);
  }, [cleanupHandlers, registerHandlers]);

  const clearChat = useCallback(() => {
    cleanupHandlers();
    conversationIdRef.current = null;
    setConversationId(null);
    setMessages([]);
    setIsStreaming(false);
    setStreamingContent('');
    setIsSending(false);
    setError(null);
  }, [cleanupHandlers]);

  return {
    conversationId,
    messages,
    isStreaming,
    streamingContent,
    isSending,
    error,
    sendMessage,
    loadConversation,
    clearChat,
    setConversationId,
  };
}
