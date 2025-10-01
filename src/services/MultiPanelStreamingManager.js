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
      console.log('[MultiPanelStreamingManager] ⚠️ BACKEND SENT proposal_analysis_started with:', {
        backend_conversation_id: data.conversation_id,
        backend_analysis_id: data.analysis_id,
        backend_tracking_id: data.tracking_id,
        all_data_keys: Object.keys(data)
      });

      // Log all registered panels
      console.log('[MultiPanelStreamingManager] 📋 Registered panels:',
        Array.from(this.panels.values()).map(p => ({
          panelId: p.panelId,
          conversationId: p.conversationId
        }))
      );

      // First try to find by conversation ID
      let panel = this.findPanelByConversationId(data.conversation_id);

      // If not found and backend sent a different conversation ID, find the proposal_wizard panel
      // and update its conversation ID to match what the backend is using
      if (!panel) {
        // For proposal wizard, we know the panel ID
        panel = this.panels.get('proposal_wizard');
        if (panel) {
          console.log('[MultiPanelStreamingManager] 🔄 Updating panel conversation ID from', panel.conversationId, 'to backend ID:', data.conversation_id);
          panel.conversationId = data.conversation_id;
        } else {
          console.error('[MultiPanelStreamingManager] ❌ NO PANEL FOUND AT ALL for backend conversation:', data.conversation_id);
          return;
        }
      }

      // Ensure messageHandlers exists
      if (!panel.messageHandlers) {
        panel.messageHandlers = new Map();
      }

      panel.isStreaming = true;
      panel.currentStreamContent = '';

      // Store the backend-provided tracking ID (this is the real session ID for cancellation)
      if (data.tracking_id) {
        console.log('[MultiPanelStreamingManager] 🎯 Storing backend tracking ID:', data.tracking_id);
        panel.trackingIds.add(data.tracking_id);
        // Set this as the active tracking ID for this panel
        panel.activeTrackingId = data.tracking_id;
      }

      // Also check for message_id as backup
      if (data.message_id) {
        console.log('[MultiPanelStreamingManager] 🎯 Also storing backend message_id:', data.message_id);
        panel.trackingIds.add(data.message_id);
        // Use message_id as active tracking ID if no tracking_id
        if (!data.tracking_id) {
          panel.activeTrackingId = data.message_id;
        }
      }

      this.notifyPanelHandlers(panel.panelId, 'proposal_analysis_started', {
        analysisId: data.analysis_id,
        conversationId: data.conversation_id,
        characterId: data.character_id,
        trackingId: data.tracking_id,
        messageId: data.message_id,
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
      console.log('[MultiPanelStreamingManager] 🔄 CHUNK received from backend:', {
        backend_conversation_id: data.conversation_id,
        chunkLength: data.chunk?.length,
        chunkPreview: data.chunk?.substring(0, 50)
      });

      const panel = this.findPanelByConversationId(data.conversation_id);
      if (!panel) {
        console.error('[MultiPanelStreamingManager] ❌ CHUNK DROPPED - No panel for backend conversation:', data.conversation_id);
        console.error('[MultiPanelStreamingManager] Looking for panels with these conversation IDs:',
          Array.from(this.panels.values()).map(p => p.conversationId)
        );
        return;
      }

      console.log('[MultiPanelStreamingManager] Panel found:', panel.panelId);

      // Ensure messageHandlers exists
      if (!panel.messageHandlers) {
        console.log('[MultiPanelStreamingManager] Creating messageHandlers for panel');
        panel.messageHandlers = new Map();
      }

      panel.currentStreamContent += data.chunk || '';
      panel.isStreaming = true;
      console.log('[MultiPanelStreamingManager] Panel content updated, total length:', panel.currentStreamContent.length);

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
    console.log(`[MultiPanelStreamingManager] Creating panel ${panelId} with conversation ${conversationId}`);

    // Check if panel already exists
    let panel = this.panels.get(panelId);
    if (panel) {
      console.log(`[MultiPanelStreamingManager] Panel ${panelId} already exists, updating conversation ID`);
      // Update the existing panel with the conversation ID
      panel.conversationId = conversationId;
    } else {
      console.log(`[MultiPanelStreamingManager] Creating new panel ${panelId}`);
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

    console.log(`[MultiPanelStreamingManager] Panel ${panelId} created/updated successfully`);
    console.log(`[MultiPanelStreamingManager] Total panels:`, this.panels.size);


    // Attach any pending handlers for this panel
    if (this.pendingHandlers && this.pendingHandlers.has(panelId)) {
      const pendingForPanel = this.pendingHandlers.get(panelId);
      pendingForPanel.forEach((handler, event) => {
        panel.messageHandlers.set(event, handler);
      });
      this.pendingHandlers.delete(panelId);
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
      console.error(`[MultiPanelStreamingManager] Panel ${panelId} not found`);
      console.error(`[MultiPanelStreamingManager] Available panels:`, Array.from(this.panels.keys()));
      return null;
    }

    console.log('[MultiPanelStreamingManager] sendMessageToPanel - Panel state:', {
      panelId: panel.panelId,
      conversationId: panel.conversationId,
      hasConversationId: !!panel.conversationId,
      metadata
    });

    // For proposal analysis, use the analyze_proposal event
    if (metadata?.analysisType === 'proposal_wizard') {
      const socket = this.wsService.getSocket();
      if (!socket?.connected) {
        throw new Error('WebSocket not connected');
      }

      const eventData = {
        job_posting: metadata.jobPost || content,
        character_id: metadata.characterId,
        proposal: metadata.proposal,
        platform: metadata.platform,
        conversation_id: panel.conversationId,
        metadata: metadata.extra
      };

      console.log('[MultiPanelStreamingManager] 📤 SENDING TO BACKEND - analyze_proposal event with:');
      console.log('  → Frontend conversation_id:', panel.conversationId);
      console.log('  → Panel ID:', panel.panelId);
      console.log('  → Character ID:', metadata.characterId);
      console.log('[MultiPanelStreamingManager] Full event data:', eventData);

      socket.emit('analyze_proposal', eventData);

      panel.isStreaming = true;
      panel.currentStreamContent = '';

      // Return a placeholder - the real tracking ID will come from the backend
      return 'pending_backend_tracking_id';
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

  // Cancel an active AI response stream
  cancelResponse(trackingId) {
    if (!trackingId) {
      console.warn('[MultiPanelStreamingManager] No tracking ID provided for cancellation');
      return false;
    }

    const socket = this.wsService.getSocket();
    if (!socket?.connected) {
      console.error('[MultiPanelStreamingManager] Socket not connected, cannot cancel');
      return false;
    }

    console.log('[MultiPanelStreamingManager] 🛑 Cancelling response with tracking ID:', trackingId);

    // Emit the cancel event to the backend
    socket.emit('cancel_ai_response', {
      tracking_id: trackingId
    });

    // Find and update the panel state optimistically
    for (const panel of this.panels.values()) {
      if (panel.trackingIds.has(trackingId) || panel.activeTrackingId === trackingId) {
        console.log('[MultiPanelStreamingManager] 🛑 Found panel for cancellation, updating state');
        panel.isStreaming = false;
        // Don't delete the tracking ID immediately - let the backend confirm cancellation
        break;
      }
    }

    return true;
  }

  // Register handlers for panel events
  onPanelEvent(panelId, event, handler) {
    let panel = this.panels.get(panelId);

    // If panel doesn't exist, store the handler to be attached when panel is created
    if (!panel) {
      // This is expected behavior when handlers are registered before panel creation
      // Store the handler temporarily to be attached when panel is created
      if (!this.pendingHandlers) {
        this.pendingHandlers = new Map();
      }
      if (!this.pendingHandlers.has(panelId)) {
        this.pendingHandlers.set(panelId, new Map());
      }
      this.pendingHandlers.get(panelId).set(event, handler);

      // Return unsubscribe function
      return () => {
        this.pendingHandlers?.get(panelId)?.delete(event);
      };
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
      console.warn('[MultiPanelStreamingManager] notifyPanelHandlers: No panel found for:', panelId);
      return;
    }

    const handler = panel.messageHandlers.get(event);
    if (handler) {
      console.log('[MultiPanelStreamingManager] Calling handler for event:', event, 'on panel:', panelId);
      handler(data);
    } else {
      console.warn('[MultiPanelStreamingManager] No handler found for event:', event, 'on panel:', panelId);
      console.log('[MultiPanelStreamingManager] Available handlers:', Array.from(panel.messageHandlers.keys()));
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