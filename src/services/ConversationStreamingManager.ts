/**
 * ConversationStreamingManager - Simplified conversation-based streaming management
 * Replaces the complex MultiPanelStreamingManager with a cleaner architecture
 */

import type WebSocketService from './WebSocketService';
import logger from '../utils/logger';

type EventHandler = (data: unknown) => void;

interface ConversationState {
  conversationId: string;
  characterId?: string;
  feature?: string | null;
  isActive?: boolean;
  createdAt?: string;
  messageHandlers: Map<string, EventHandler[]>;
  isProcessing?: boolean;
  currentMessageId?: string;
  isStreaming?: boolean;
  streamContent?: string;
  currentTool?: string | null;
}

interface ChunkEventData {
  chunk: string;
  fullContent: string;
  chunkIndex: number;
  toolName: string | null;
  messageId: string;
}

interface CompleteEventData {
  fullResponse: string;
  messageId: string;
  toolName: string | null;
  contentType: string;
  structuredAnalysis: unknown;
  toolExecution: unknown;
  usage: {
    totalTokens: number;
    costCents: number;
    durationMs: number;
  };
}

interface ToolErrorEventData {
  toolName: string;
  error: string;
  validationErrors: unknown;
  errorType?: string;
  reason?: string;
  current?: number | null;
  limit?: number | null;
}

interface ErrorEventData {
  error: string;
}

interface SocketEventData {
  conversation_id: string;
  message_id?: string;
  user_message_id?: string;
  tracking_id?: string;
  chunk?: string;
  chunk_index?: number;
  tool_name?: string;
  full_response?: string;
  content_type?: string;
  structured_analysis?: unknown;
  tool_execution?: unknown;
  total_tokens?: number;
  cost_cents?: number;
  duration_ms?: number;
  message?: string;
  error?: string;
  error_type?: string;
  reason?: string;
  current?: number | null;
  limit?: number | null;
  validation_errors?: unknown;
}

interface StreamingStartEventData {
  messageId?: string;
  userMessageId?: string;
}

class ConversationStreamingManager {
  private wsService: WebSocketService;
  private conversations: Map<string, ConversationState>;
  private activeTrackingIds: Map<string, string>;
  private trackingIdToConversation: Map<string, string>;

  constructor(wsService: WebSocketService) {
    this.wsService = wsService;
    this.conversations = new Map(); // conversationId -> conversation state
    this.activeTrackingIds = new Map(); // conversationId -> trackingId (for cancellation)
    this.trackingIdToConversation = new Map(); // trackingId -> conversationId (reverse lookup)
    this.setupGlobalHandlers();
  }

  private setupGlobalHandlers(): void {
    const socket = this.wsService.getSocket();
    if (!socket) {
      logger.error('[ConversationManager] No socket available');
      return;
    }

    // AI processing started
    socket.on('ai_processing', (data: SocketEventData) => {
      this.updateConversation(data.conversation_id, {
        isProcessing: true,
        currentMessageId: data.message_id
      });
    });

    // Streaming started
    socket.on('ai_streaming_start', (data: SocketEventData) => {
      this.updateConversation(data.conversation_id, {
        isStreaming: true,
        streamContent: '',
        currentMessageId: data.message_id
      });

      // Forward user_message_id so UI can tag the local user message
      this.notifyHandlers(data.conversation_id, 'streaming_start', {
        messageId: data.message_id,
        userMessageId: data.user_message_id,
      } as StreamingStartEventData);
    });

    // Streaming chunks
    socket.on('ai_response_chunk', (data: SocketEventData) => {
      const conversation = this.conversations.get(data.conversation_id);
      if (!conversation) {
        logger.warn('[ConversationManager] Chunk for unknown conversation:', data.conversation_id);
        return;
      }

      // Accumulate stream content
      const newContent = (conversation.streamContent || '') + (data.chunk || '');
      this.updateConversation(data.conversation_id, {
        streamContent: newContent,
        currentTool: data.tool_name || null
      });

      // Notify listeners
      this.notifyHandlers(data.conversation_id, 'chunk', {
        chunk: data.chunk,
        fullContent: newContent,
        chunkIndex: data.chunk_index,
        toolName: data.tool_name,
        messageId: data.message_id
      } as ChunkEventData);
    });

    // Streaming complete
    socket.on('ai_streaming_complete', (data: SocketEventData) => {
      this.updateConversation(data.conversation_id, {
        isStreaming: false,
        isProcessing: false,
        streamContent: ''
      });

      // Clear tracking IDs for this conversation
      const trackingId = this.activeTrackingIds.get(data.conversation_id);
      if (trackingId) {
        this.trackingIdToConversation.delete(trackingId);
        this.activeTrackingIds.delete(data.conversation_id);
      }

      // Notify listeners with complete data
      this.notifyHandlers(data.conversation_id, 'complete', {
        fullResponse: data.full_response,
        messageId: data.message_id,
        toolName: data.tool_name,
        contentType: data.content_type,
        structuredAnalysis: data.structured_analysis,
        toolExecution: data.tool_execution,
        usage: {
          totalTokens: data.total_tokens,
          costCents: data.cost_cents,
          durationMs: data.duration_ms
        }
      } as CompleteEventData);
    });

    // Response cancelled by backend (confirms user-initiated stop)
    socket.on('ai_response_cancelled', (data: SocketEventData) => {
      const trackingId = data.tracking_id;
      if (!trackingId) return;

      const conversationId = this.trackingIdToConversation.get(trackingId);
      this.trackingIdToConversation.delete(trackingId);

      if (!conversationId) return;

      this.updateConversation(conversationId, {
        isStreaming: false,
        isProcessing: false,
        streamContent: ''
      });

      this.activeTrackingIds.delete(conversationId);

      // Notify listeners so UI resets even if our optimistic local reset missed.
      // fullResponse/messageId are undefined — the hook should simply reset state.
      this.notifyHandlers(conversationId, 'complete', {
        fullResponse: undefined,
        messageId: undefined,
        toolName: null,
      } as unknown as CompleteEventData);
    });

    // Tool error
    socket.on('tool_error', (data: SocketEventData) => {
      logger.error('[ConversationManager] Tool error:', {
        tool_name: data.tool_name,
        message: data.message,
        validation_errors: data.validation_errors
      });

      const conversationId = data.conversation_id;
      if (conversationId) {
        this.updateConversation(conversationId, {
          isStreaming: false,
          isProcessing: false
        });

        this.notifyHandlers(conversationId, 'tool_error', {
          toolName: data.tool_name,
          error: data.message,
          validationErrors: data.validation_errors,
          errorType: data.error_type,
          reason: data.reason,
          current: data.current,
          limit: data.limit,
        } as ToolErrorEventData);
      }
    });

    // AI error
    socket.on('ai_error', (data: SocketEventData) => {
      logger.error('[ConversationManager] AI error:', {
        conversation_id: data.conversation_id,
        message: data.message || data.error
      });

      const conversationId = data.conversation_id;
      if (conversationId) {
        this.updateConversation(conversationId, {
          isStreaming: false,
          isProcessing: false
        });

        // Clear tracking IDs
        const trackingId = this.activeTrackingIds.get(conversationId);
        if (trackingId) {
          this.trackingIdToConversation.delete(trackingId);
          this.activeTrackingIds.delete(conversationId);
        }

        this.notifyHandlers(conversationId, 'error', {
          error: data.message || data.error
        } as ErrorEventData);
      }
    });
  }

  /**
   * Create a new conversation
   */
  async createConversation(characterId: string, feature: string | null = null, metadata: Record<string, unknown> = {}): Promise<string> {
    const socket = this.wsService.getSocket();
    if (!socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Conversation creation timeout'));
      }, 10000);

      const handleSuccess = (data: { conversation_id: string }): void => {
        clearTimeout(timeout);
        socket.off('conversation_created', handleSuccess);
        socket.off('ai_error', handleError);

        // Store the new conversation
        this.conversations.set(data.conversation_id, {
          conversationId: data.conversation_id,
          characterId,
          feature,
          isActive: true,
          createdAt: new Date().toISOString(),
          messageHandlers: new Map()
        });

        resolve(data.conversation_id);
      };

      const handleError = (data: { message?: string }): void => {
        clearTimeout(timeout);
        socket.off('conversation_created', handleSuccess);
        socket.off('ai_error', handleError);

        logger.error('[ConversationManager] Backend returned error:', {
          event: 'ai_error',
          data
        });

        reject(new Error(data.message || 'Failed to create conversation'));
      };

      socket.once('conversation_created', handleSuccess);
      socket.once('ai_error', handleError);

      socket.emit('start_ai_conversation', {
        character_id: characterId,
        feature,
        metadata
      });
    });
  }

  /**
   * Send a message in a conversation
   */
  sendMessage(conversationId: string, characterId: string, message: string, options?: {
    attachments?: Array<{ document_id: string; file_name: string; file_type: string; url: string; thumbnail_url?: string }>;
    metadata?: Record<string, unknown>;
  }): void {
    const socket = this.wsService.getSocket();
    if (!socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    // Generate unique tracking ID for this request
    const trackingId = crypto.randomUUID();

    // Store tracking ID for potential cancellation (both directions)
    this.activeTrackingIds.set(conversationId, trackingId);
    this.trackingIdToConversation.set(trackingId, conversationId);

    socket.emit('message_ai_conversation', {
      conversation_id: conversationId,
      character_id: characterId,
      tracking_id: trackingId,
      message,
      ...(options?.metadata?.feature ? { feature: options.metadata.feature } : {}),
      ...(options?.attachments?.length ? { attachments: options.attachments } : {}),
      ...(options?.metadata ? { metadata: options.metadata } : {}),
    });
  }

  /**
   * Invoke a tool in a conversation
   */
  invokeTool(conversationId: string, characterId: string, toolName: string, toolArguments: unknown): void {
    const socket = this.wsService.getSocket();
    if (!socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    // Generate unique tracking ID for this request
    const trackingId = crypto.randomUUID();

    // Store tracking ID for potential cancellation (both directions)
    this.activeTrackingIds.set(conversationId, trackingId);
    this.trackingIdToConversation.set(trackingId, conversationId);

    socket.emit('message_ai_conversation', {
      conversation_id: conversationId,
      character_id: characterId,
      tracking_id: trackingId,
      ai_tool: toolName,
      ai_tool_arguments: toolArguments
    });
  }

  /**
   * Cancel an active AI request
   */
  cancelRequest(conversationId: string): void {
    const socket = this.wsService.getSocket();
    if (!socket?.connected) {
      logger.warn('[ConversationManager] Cannot cancel - WebSocket not connected');
      return;
    }

    const trackingId = this.activeTrackingIds.get(conversationId);
    if (!trackingId) {
      logger.warn('[ConversationManager] No active tracking ID for conversation:', conversationId);
      return;
    }

    socket.emit('cancel_ai_response', {
      tracking_id: trackingId
    });

    // Keep reverse lookup until backend confirms; clear forward mapping now
    this.activeTrackingIds.delete(conversationId);
  }

  /**
   * Get conversation state
   */
  getConversationState(conversationId: string): ConversationState | undefined {
    return this.conversations.get(conversationId);
  }

  /**
   * Register event handler for a conversation
   */
  onConversationEvent(conversationId: string, event: string, handler: EventHandler): () => void {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      // Create conversation state if it doesn't exist
      this.conversations.set(conversationId, {
        conversationId,
        messageHandlers: new Map()
      });
    }

    const conv = this.conversations.get(conversationId)!;
    if (!conv.messageHandlers) {
      conv.messageHandlers = new Map();
    }

    const handlers = conv.messageHandlers.get(event) || [];
    handlers.push(handler);
    conv.messageHandlers.set(event, handlers);

    // Return unsubscribe function
    return () => {
      const currentHandlers = conv.messageHandlers.get(event) || [];
      const index = currentHandlers.indexOf(handler);
      if (index > -1) {
        currentHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Update conversation state
   */
  private updateConversation(conversationId: string, updates: Partial<ConversationState>): void {
    const existing = this.conversations.get(conversationId) || {
      conversationId,
      messageHandlers: new Map()
    };

    this.conversations.set(conversationId, {
      ...existing,
      ...updates
    });
  }

  /**
   * Notify conversation event handlers
   */
  private notifyHandlers(conversationId: string, event: string, data: unknown): void {
    const conversation = this.conversations.get(conversationId);
    if (!conversation || !conversation.messageHandlers) return;

    const handlers = conversation.messageHandlers.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        logger.error('[ConversationManager] Handler error:', error);
      }
    });
  }

  /**
   * Clear a conversation
   */
  clearConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
  }

  /**
   * Clear all conversations
   */
  clearAll(): void {
    this.conversations.clear();
  }
}

export default ConversationStreamingManager;
