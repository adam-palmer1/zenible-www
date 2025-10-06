/**
 * ConversationStreamingManager - Simplified conversation-based streaming management
 * Replaces the complex MultiPanelStreamingManager with a cleaner architecture
 */
class ConversationStreamingManager {
  constructor(wsService) {
    this.wsService = wsService;
    this.conversations = new Map(); // conversationId -> conversation state
    this.activeTrackingIds = new Map(); // conversationId -> trackingId (for cancellation)
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    const socket = this.wsService.getSocket();
    if (!socket) {
      console.error('[ConversationManager] No socket available');
      return;
    }

    // Counter for tracking invocations
    this.streamingCompleteCount = 0;

    // Log all AI-related events for debugging
    socket.onAny((eventName, ...args) => {
      if (eventName.includes('ai_') || eventName.includes('tool_')) {
        console.log(`[ConversationManager] Event received: ${eventName}`, args[0]);

        // Log FULL raw data for ai_streaming_complete events
        if (eventName === 'ai_streaming_complete') {
          console.log(`[ConversationManager] 🔍 RAW ai_streaming_complete data (invocation #${++this.streamingCompleteCount}):`,
            JSON.stringify(args[0], null, 2));
        }
      }
    });

    // AI processing started
    socket.on('ai_processing', (data) => {
      console.log('[ConversationManager] ⚙️ Processing started:', {
        conversation_id: data.conversation_id,
        message_id: data.message_id
      });

      this.updateConversation(data.conversation_id, {
        isProcessing: true,
        currentMessageId: data.message_id
      });
    });

    // Streaming started
    socket.on('ai_streaming_start', (data) => {
      console.log('[ConversationManager] 📡 Streaming started:', {
        conversation_id: data.conversation_id,
        message_id: data.message_id
      });

      this.updateConversation(data.conversation_id, {
        isStreaming: true,
        streamContent: '',
        currentMessageId: data.message_id
      });
    });

    // Streaming chunks
    socket.on('ai_response_chunk', (data) => {
      const conversation = this.conversations.get(data.conversation_id);
      if (!conversation) {
        console.warn('[ConversationManager] Chunk for unknown conversation:', data.conversation_id);
        return;
      }

      // Accumulate stream content
      const newContent = (conversation.streamContent || '') + (data.chunk || '');
      this.updateConversation(data.conversation_id, {
        streamContent: newContent,
        lastChunkIndex: data.chunk_index,
        currentTool: data.tool_name || null
      });

      // Notify listeners
      this.notifyHandlers(data.conversation_id, 'chunk', {
        chunk: data.chunk,
        fullContent: newContent,
        chunkIndex: data.chunk_index,
        toolName: data.tool_name,
        messageId: data.message_id
      });
    });

    // Streaming complete
    socket.on('ai_streaming_complete', (data) => {
      console.log('[ConversationManager] ✅ Streaming complete (summary):', {
        conversation_id: data.conversation_id,
        tool_name: data.tool_name,
        has_structured: !!data.structured_analysis,
        content_type: data.content_type
      });

      console.log('[ConversationManager] 🔍 FULL event data keys:', Object.keys(data));
      console.log('[ConversationManager] 🔍 tool_name value:', data.tool_name);
      console.log('[ConversationManager] 🔍 Does data have tool_name key?', 'tool_name' in data);

      this.updateConversation(data.conversation_id, {
        isStreaming: false,
        isProcessing: false,
        streamContent: '',
        lastResponse: data.full_response,
        lastMessageId: data.message_id,
        lastTool: data.tool_name || null
      });

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
      });
    });

    // Tool error
    socket.on('tool_error', (data) => {
      console.error('[ConversationManager] ❌ Tool error:', {
        tool_name: data.tool_name,
        message: data.message,
        validation_errors: data.validation_errors
      });

      const conversationId = data.conversation_id;
      if (conversationId) {
        this.updateConversation(conversationId, {
          isStreaming: false,
          isProcessing: false,
          lastError: data.message
        });

        this.notifyHandlers(conversationId, 'tool_error', {
          toolName: data.tool_name,
          error: data.message,
          validationErrors: data.validation_errors
        });
      }
    });

    // AI error
    socket.on('ai_error', (data) => {
      console.error('[ConversationManager] ❌ AI error:', {
        conversation_id: data.conversation_id,
        message: data.message || data.error
      });

      const conversationId = data.conversation_id;
      if (conversationId) {
        this.updateConversation(conversationId, {
          isStreaming: false,
          isProcessing: false,
          lastError: data.message || data.error
        });

        this.notifyHandlers(conversationId, 'error', {
          error: data.message || data.error
        });
      }
    });
  }

  /**
   * Create a new conversation
   */
  async createConversation(characterId, feature = null, metadata = {}) {
    const socket = this.wsService.getSocket();
    if (!socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Conversation creation timeout'));
      }, 10000);

      const handleSuccess = (data) => {
        clearTimeout(timeout);
        socket.off('conversation_created', handleSuccess);
        socket.off('ai_error', handleError);

        console.log('[ConversationManager] ✅ Backend returned conversation:', {
          event: 'conversation_created',
          data
        });

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

      const handleError = (data) => {
        clearTimeout(timeout);
        socket.off('conversation_created', handleSuccess);
        socket.off('ai_error', handleError);

        console.error('[ConversationManager] ❌ Backend returned error:', {
          event: 'ai_error',
          data
        });

        reject(new Error(data.message || 'Failed to create conversation'));
      };

      socket.once('conversation_created', handleSuccess);
      socket.once('ai_error', handleError);

      console.log('[ConversationManager] 📤 Creating conversation:', {
        character_id: characterId,
        feature,
        metadata
      });

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
  sendMessage(conversationId, characterId, message) {
    const socket = this.wsService.getSocket();
    if (!socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    // Generate unique tracking ID for this request
    const trackingId = crypto.randomUUID();

    // Store tracking ID for potential cancellation
    this.activeTrackingIds.set(conversationId, trackingId);

    console.log('[ConversationManager] 📤 Sending message:', {
      conversation_id: conversationId,
      character_id: characterId,
      tracking_id: trackingId,
      message_preview: message.substring(0, 50) + '...'
    });

    socket.emit('message_ai_conversation', {
      conversation_id: conversationId,
      character_id: characterId,
      tracking_id: trackingId,
      message
    });
  }

  /**
   * Invoke a tool in a conversation
   */
  invokeTool(conversationId, characterId, toolName, toolArguments) {
    const socket = this.wsService.getSocket();
    if (!socket?.connected) {
      throw new Error('WebSocket not connected');
    }

    // Generate unique tracking ID for this request
    const trackingId = crypto.randomUUID();

    // Store tracking ID for potential cancellation
    this.activeTrackingIds.set(conversationId, trackingId);

    console.log('[ConversationManager] 🔧 Invoking tool:', {
      conversation_id: conversationId,
      character_id: characterId,
      tool_name: toolName,
      tracking_id: trackingId,
      arguments: toolArguments
    });

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
  cancelRequest(conversationId) {
    const socket = this.wsService.getSocket();
    if (!socket?.connected) {
      console.warn('[ConversationManager] Cannot cancel - WebSocket not connected');
      return;
    }

    const trackingId = this.activeTrackingIds.get(conversationId);
    if (!trackingId) {
      console.warn('[ConversationManager] No active tracking ID for conversation:', conversationId);
      return;
    }

    console.log('[ConversationManager] 🛑 Cancelling request:', {
      conversation_id: conversationId,
      tracking_id: trackingId
    });

    socket.emit('cancel_ai_response', {
      tracking_id: trackingId
    });

    // Clear the tracking ID
    this.activeTrackingIds.delete(conversationId);
  }

  /**
   * Get conversation state
   */
  getConversationState(conversationId) {
    return this.conversations.get(conversationId);
  }

  /**
   * Register event handler for a conversation
   */
  onConversationEvent(conversationId, event, handler) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) {
      // Create conversation state if it doesn't exist
      this.conversations.set(conversationId, {
        conversationId,
        messageHandlers: new Map()
      });
    }

    const conv = this.conversations.get(conversationId);
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
  updateConversation(conversationId, updates) {
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
  notifyHandlers(conversationId, event, data) {
    const conversation = this.conversations.get(conversationId);
    if (!conversation || !conversation.messageHandlers) return;

    const handlers = conversation.messageHandlers.get(event) || [];
    handlers.forEach(handler => {
      try {
        handler(data);
      } catch (error) {
        console.error('[ConversationManager] Handler error:', error);
      }
    });
  }

  /**
   * Clear a conversation
   */
  clearConversation(conversationId) {
    console.log('[ConversationManager] 🗑️ Clearing conversation:', conversationId);
    this.conversations.delete(conversationId);
  }

  /**
   * Clear all conversations
   */
  clearAll() {
    console.log('[ConversationManager] 🗑️ Clearing all conversations');
    this.conversations.clear();
  }
}

export default ConversationStreamingManager;