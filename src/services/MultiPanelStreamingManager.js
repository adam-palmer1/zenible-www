class MultiPanelStreamingManager {
  constructor(wsService) {
    this.wsService = wsService;
    this.panels = new Map();
    this.globalHandlers = new Map();
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    const socket = this.wsService.getSocket();
    if (!socket) {
      console.error('[MultiPanelStreamingManager] No socket available for setting up handlers');
      return;
    }

    // Handle AI processing phase
    socket.on('ai_processing', (data) => {
      const panel = this.findPanelByConversationId(data.conversation_id);
      if (!panel) return;

      panel.trackingIds.add(data.tracking_id);
      panel.isStreaming = true;
      panel.currentStreamContent = '';
      panel.currentCharacterId = data.character_id;

      this.notifyPanelHandlers(panel.panelId, 'processing', {
        conversationId: data.conversation_id,
        messageId: data.message_id,
        characterId: data.character_id,
        trackingId: data.tracking_id,
        status: data.status,
        timestamp: data.timestamp
      });
    });

    // Handle AI streaming start
    socket.on('ai_streaming_start', (data) => {
      const panel = this.findPanelByTrackingId(data.tracking_id);
      if (!panel) return;

      panel.isStreaming = true;
      panel.currentStreamContent = '';

      this.notifyPanelHandlers(panel.panelId, 'streaming_start', {
        conversationId: data.conversation_id,
        messageId: data.message_id,
        characterId: data.character_id,
        trackingId: data.tracking_id,
        timestamp: data.timestamp
      });
    });

    // Handle streaming chunks for all panels (AI character specific)
    socket.on('ai_response_chunk', (data) => {
      const panel = this.findPanelByTrackingId(data.tracking_id);
      if (!panel) return;

      panel.currentStreamContent += data.chunk;
      panel.isStreaming = true;

      // Notify panel-specific handlers
      this.notifyPanelHandlers(panel.panelId, 'chunk', {
        content: panel.currentStreamContent,
        chunk: data.chunk,
        chunkIndex: data.chunk_index,
        conversationId: data.conversation_id,
        messageId: data.message_id,
        characterId: data.character_id,
        trackingId: data.tracking_id,
        timestamp: data.timestamp
      });
    });

    // Handle AI streaming complete
    socket.on('ai_streaming_complete', (data) => {
      const panel = this.findPanelByTrackingId(data.tracking_id);
      if (!panel) return;

      panel.isStreaming = false;

      this.notifyPanelHandlers(panel.panelId, 'streaming_complete', {
        conversationId: data.conversation_id,
        messageId: data.message_id,
        characterId: data.character_id,
        trackingId: data.tracking_id,
        fullResponse: data.full_response || panel.currentStreamContent,
        totalTokens: data.total_tokens,
        costCents: data.cost_cents,
        durationMs: data.duration_ms,
        chunksSent: data.chunks_sent,
        timestamp: data.timestamp
      });

      // Clean up tracking
      panel.trackingIds.delete(data.tracking_id);
      this.wsService.cleanupTracking(data.tracking_id);
      panel.currentStreamContent = '';
    });

    // Handle AI errors
    socket.on('ai_error', (data) => {
      const panel = this.findPanelByTrackingId(data.tracking_id);
      if (!panel) return;

      panel.isStreaming = false;
      panel.currentStreamContent = '';

      this.notifyPanelHandlers(panel.panelId, 'ai_error', {
        conversationId: data.conversation_id,
        messageId: data.message_id,
        characterId: data.character_id,
        trackingId: data.tracking_id,
        error: data.error,
        timestamp: data.timestamp
      });

      // Clean up tracking
      panel.trackingIds.delete(data.tracking_id);
      this.wsService.cleanupTracking(data.tracking_id);
    });

    // Handle generic errors (backward compatibility)
    socket.on('chat_error', (data) => {
      const panel = this.findPanelByTrackingId(data.chat_id || data.tracking_id);
      if (!panel) return;

      panel.isStreaming = false;
      panel.currentStreamContent = '';

      this.notifyPanelHandlers(panel.panelId, 'error', data);
    });

    // Handle complete messages (backward compatibility)
    socket.on('ai_response_complete', (data) => {
      const panel = this.findPanelByTrackingId(data.chat_id || data.tracking_id);
      if (!panel) return;

      panel.isStreaming = false;
      panel.currentStreamContent = '';

      this.notifyPanelHandlers(panel.panelId, 'complete', data);
    });

    // Handle typing indicators
    socket.on('ai_typing', (data) => {
      const panel = this.findPanelByTrackingId(data.chat_id || data.tracking_id);
      if (!panel) return;

      this.notifyPanelHandlers(panel.panelId, 'typing', data);
    });

    // Handle multi-character session events
    socket.on('multi_character_session_start', (data) => {
      const panel = this.findPanelByConversationId(data.conversation_id);
      if (!panel) return;

      this.notifyPanelHandlers(panel.panelId, 'multi_character_start', {
        sessionId: data.session_id,
        conversationId: data.conversation_id,
        mode: data.mode,
        characters: data.characters,
        timestamp: data.timestamp
      });
    });

    socket.on('character_turn', (data) => {
      const panel = this.panels.get(data.panel_id);
      if (!panel) return;

      this.notifyPanelHandlers(panel.panelId, 'character_turn', {
        sessionId: data.session_id,
        characterId: data.character_id,
        characterName: data.character_name,
        order: data.order
      });
    });

    socket.on('multi_character_session_complete', (data) => {
      const panel = this.findPanelByConversationId(data.conversation_id);
      if (!panel) return;

      this.notifyPanelHandlers(panel.panelId, 'multi_character_complete', {
        sessionId: data.session_id,
        conversationId: data.conversation_id,
        roundNumber: data.round_number,
        totalResponses: data.total_responses
      });
    });


    // Handle proposal analysis events
    socket.on('proposal_analysis_started', (data) => {
      const panel = this.findPanelByConversationId(data.conversation_id);
      if (!panel) return;

      // Ensure messageHandlers exists
      if (!panel.messageHandlers) {
        panel.messageHandlers = new Map();
      }

      panel.isStreaming = true;
      panel.currentStreamContent = '';
      if (data.tracking_id) {
        panel.trackingIds.add(data.tracking_id);
      }

      this.notifyPanelHandlers(panel.panelId, 'proposal_analysis_started', {
        analysisId: data.analysis_id,
        conversationId: data.conversation_id,
        characterId: data.character_id,
        trackingId: data.tracking_id,
        timestamp: data.timestamp
      });
    });

    // Handle proposal analysis streaming started
    socket.on('proposal_analysis_streaming_started', (data) => {
      const panel = this.findPanelByConversationId(data.conversation_id);
      if (!panel) return;

      // Ensure messageHandlers exists
      if (!panel.messageHandlers) {
        panel.messageHandlers = new Map();
      }

      panel.isStreaming = true;
      panel.currentStreamContent = '';

      this.notifyPanelHandlers(panel.panelId, 'proposal_analysis_streaming_started', {
        analysisId: data.analysis_id,
        conversationId: data.conversation_id,
        messageId: data.message_id,
        characterId: data.character_id,
        timestamp: data.timestamp
      });
    });

    // Handle proposal analysis streaming chunks
    socket.on('proposal_analysis_chunk', (data) => {
      const panel = this.findPanelByConversationId(data.conversation_id);
      if (!panel) {
        return;
      }

      // Ensure messageHandlers exists
      if (!panel.messageHandlers) {
        panel.messageHandlers = new Map();
      }

      panel.currentStreamContent += data.chunk || '';
      panel.isStreaming = true;

      this.notifyPanelHandlers(panel.panelId, 'proposal_analysis_chunk', {
        analysisId: data.analysis_id,
        conversationId: data.conversation_id,
        messageId: data.message_id,
        chunk: data.chunk,
        content: panel.currentStreamContent,
        chunkIndex: data.chunk_index,
        timestamp: data.timestamp
      });
    });

    socket.on('proposal_analysis_complete', (data) => {
      const panel = this.findPanelByConversationId(data.conversation_id);
      if (!panel) return;

      // Ensure messageHandlers exists
      if (!panel.messageHandlers) {
        panel.messageHandlers = new Map();
      }

      panel.isStreaming = false;

      this.notifyPanelHandlers(panel.panelId, 'proposal_analysis_complete', {
        conversationId: data.conversation_id,
        messageId: data.message_id,
        character: data.character,
        modelUsed: data.model_used,
        tokensUsed: data.tokens_used,
        analysis: data.analysis,
        usage: data.usage,
        timestamp: data.timestamp
      });

      // Clean up tracking
      if (data.tracking_id) {
        panel.trackingIds.delete(data.tracking_id);
        this.wsService.cleanupTracking(data.tracking_id);
      }
      panel.currentStreamContent = '';
    });

    socket.on('proposal_analysis_error', (data) => {
      const panel = this.findPanelByConversationId(data.conversation_id);
      if (!panel) return;

      // Ensure messageHandlers exists
      if (!panel.messageHandlers) {
        panel.messageHandlers = new Map();
      }

      panel.isStreaming = false;
      panel.currentStreamContent = '';

      this.notifyPanelHandlers(panel.panelId, 'proposal_analysis_error', {
        conversationId: data.conversation_id,
        error: data.error,
        timestamp: data.timestamp
      });

      // Clean up tracking
      if (data.tracking_id) {
        panel.trackingIds.delete(data.tracking_id);
        this.wsService.cleanupTracking(data.tracking_id);
      }
    });

    // Handle usage updates
    socket.on('usage_update', (data) => {
      this.notifyGlobalHandlers('usage', data);
    });

    // Handle stream start event (backward compatibility)
    socket.on('stream_start', (data) => {
      const panel = this.findPanelByTrackingId(data.tracking_id);
      if (!panel) return;

      panel.isStreaming = true;
      panel.currentStreamContent = '';

      this.notifyPanelHandlers(panel.panelId, 'start', data);
    });

    // Handle stream end event
    socket.on('stream_end', (data) => {
      const panel = this.findPanelByTrackingId(data.tracking_id);
      if (!panel) return;

      panel.isStreaming = false;

      this.notifyPanelHandlers(panel.panelId, 'end', {
        ...data,
        finalContent: panel.currentStreamContent
      });

      // Clean up tracking
      panel.trackingIds.delete(data.tracking_id);
      this.wsService.cleanupTracking(data.tracking_id);
    });
  }

  findPanelByTrackingId(trackingId) {
    if (!trackingId) return undefined;

    for (const panel of this.panels.values()) {
      if (panel.trackingIds.has(trackingId)) {
        return panel;
      }
    }
    return undefined;
  }

  findPanelByConversationId(conversationId) {
    if (!conversationId) return undefined;

    for (const panel of this.panels.values()) {
      if (panel.conversationId === conversationId) {
        return panel;
      }
    }

    return undefined;
  }


  async createPanel(panelId, conversationId) {
    // Check if panel already exists
    let panel = this.panels.get(panelId);
    if (panel) {
      // Update the existing panel with the conversation ID
      panel.conversationId = conversationId;
    } else {
      // Create panel tracking
      panel = {
        panelId,
        conversationId,
        isStreaming: false,
        currentStreamContent: '',
        trackingIds: new Set(),
        messageHandlers: new Map()
      };
      this.panels.set(panelId, panel);
    }

    // Join the panel on the server
    await this.wsService.joinPanel(panelId, conversationId);
  }

  async removePanel(panelId) {
    const panel = this.panels.get(panelId);
    if (!panel) return;

    // Leave the panel on the server
    await this.wsService.leavePanel(panelId);

    // Cleanup tracking IDs
    panel.trackingIds.forEach(id => this.wsService.cleanupTracking(id));


    // Remove panel
    this.panels.delete(panelId);
  }

  sendMessageToPanel(panelId, content, metadata) {
    const panel = this.panels.get(panelId);
    if (!panel) {
      console.error(`Panel ${panelId} not found`);
      return null;
    }

    // For proposal analysis, use the analyze_proposal event
    if (metadata?.analysisType === 'proposal_wizard') {
      const socket = this.wsService.getSocket();
      if (!socket?.connected) {
        throw new Error('WebSocket not connected');
      }

      // Generate a tracking ID locally
      const trackingId = this.wsService.generateTrackingId();

      const eventData = {
        job_posting: metadata.jobPost || content,
        character_id: metadata.characterId,
        proposal: metadata.proposal,
        platform: metadata.platform,
        conversation_id: panel.conversationId,
        metadata: metadata.extra
      };

      socket.emit('analyze_proposal', eventData);

      panel.trackingIds.add(trackingId);
      panel.isStreaming = true;
      panel.currentStreamContent = '';

      return trackingId;
    }
    // For AI character conversations, use the start_ai_conversation event
    else if (metadata?.characterId) {
      const socket = this.wsService.getSocket();
      if (!socket?.connected) {
        throw new Error('WebSocket not connected');
      }

      // Generate a tracking ID locally (server will also generate one)
      const trackingId = this.wsService.generateTrackingId();

      socket.emit('start_ai_conversation', {
        conversation_id: panel.conversationId,
        character_id: metadata.characterId,
        message: content,
        panel_id: panelId,
        parent_message_id: metadata.parentMessageId,
        attachments: metadata.attachments,
        metadata: metadata.extra
      });

      panel.trackingIds.add(trackingId);
      panel.isStreaming = true;
      panel.currentStreamContent = '';

      return trackingId;
    } else {
      // Fallback to generic message sending
      const trackingId = this.wsService.sendMessage({
        panelId,
        conversationId: panel.conversationId,
        content,
        metadata
      });

      panel.trackingIds.add(trackingId);
      panel.isStreaming = true;
      panel.currentStreamContent = '';

      return trackingId;
    }
  }

  // Register handlers for panel events
  onPanelEvent(panelId, event, handler) {
    let panel = this.panels.get(panelId);

    // If panel doesn't exist, create a placeholder for it
    if (!panel) {
      panel = {
        panelId,
        conversationId: null,
        isStreaming: false,
        currentStreamContent: '',
        trackingIds: new Set(),
        messageHandlers: new Map()
      };
      this.panels.set(panelId, panel);
    }

    const key = event;
    panel.messageHandlers.set(key, handler);

    // Return unsubscribe function
    return () => {
      const p = this.panels.get(panelId);
      if (p) {
        p.messageHandlers.delete(key);
      }
    };
  }

  // Register global event handlers
  onGlobalEvent(event, handler) {
    if (!this.globalHandlers.has(event)) {
      this.globalHandlers.set(event, new Set());
    }

    this.globalHandlers.get(event).add(handler);

    // Return unsubscribe function
    return () => {
      this.globalHandlers.get(event)?.delete(handler);
    };
  }

  notifyPanelHandlers(panelId, event, data) {
    const panel = this.panels.get(panelId);
    if (!panel) {
      return;
    }

    const handler = panel.messageHandlers.get(event);
    if (handler) {
      handler(data);
    }
  }

  notifyGlobalHandlers(event, data) {
    const handlers = this.globalHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(data));
    }
  }

  getPanelState(panelId) {
    const panel = this.panels.get(panelId);
    if (!panel) return null;

    return {
      isStreaming: panel.isStreaming,
      currentContent: panel.currentStreamContent,
      activeMessages: panel.trackingIds.size
    };
  }

  getAllPanels() {
    return Array.from(this.panels.keys());
  }

  reconnectHandlers() {
    this.setupGlobalHandlers();
  }
}

export default MultiPanelStreamingManager;