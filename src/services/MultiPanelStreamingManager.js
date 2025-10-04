class MultiPanelStreamingManager {
  constructor(wsService) {
    this.wsService = wsService;
    this.panels = new Map();
    this.globalHandlers = new Map();
    this.instanceId = `manager_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log('[StreamingManager] NEW INSTANCE CREATED:', {
      instanceId: this.instanceId,
      timestamp: new Date().toISOString()
    });
    this.setupGlobalHandlers();
  }

  setupGlobalHandlers() {
    const socket = this.wsService.getSocket();
    if (!socket) {
      return;
    }

    // Generic event logger for all AI events
    socket.onAny((eventName, ...args) => {
      if (eventName.includes('ai_') || eventName.includes('proposal_')) {
        console.log(`[StreamingManager] WebSocket event received: ${eventName}`, {
          eventName,
          data: args[0],
          timestamp: new Date().toISOString()
        });
      }
    });

    // Handle AI processing phase
    socket.on('ai_processing', (data) => {
      console.log('[StreamingManager] ai_processing event received:', {
        conversation_id: data.conversation_id,
        tracking_id: data.tracking_id,
        panel_id: data.panel_id,
        character_id: data.character_id,
        message_id: data.message_id
      });

      // Route by tracking_id first, fallback to panel_id
      let panel = this.findPanelByTrackingId(data.tracking_id);
      if (!panel && data.panel_id) {
        panel = this.panels.get(data.panel_id);
      }

      if (!panel) {
        console.error('[StreamingManager] Panel NOT found for ai_processing:', {
          searching_for_tracking_id: data.tracking_id,
          searching_for_panel_id: data.panel_id,
          conversation_id_in_event: data.conversation_id,
          available_panels: Array.from(this.panels.entries()).map(([id, p]) => ({
            panelId: id,
            conversationId: p.conversationId,
            trackingIds: Array.from(p.trackingIds)
          }))
        });
        return;
      }

      console.log('[StreamingManager] Panel found for ai_processing, updating state:', {
        panelId: panel.panelId,
        existingConversationId: panel.conversationId,
        backendConversationId: data.conversation_id,
        trackingId: data.tracking_id,
        existingTrackingIds: Array.from(panel.trackingIds)
      });

      // Update conversation ID if backend provides a different one
      if (data.conversation_id && panel.conversationId !== data.conversation_id) {
        console.log('[StreamingManager] 🔄 CONVERSATION ID UPDATE - Backend created/returned conversation_id:', {
          oldConversationId: panel.conversationId,
          newConversationId: data.conversation_id,
          panelId: panel.panelId,
          trackingId: data.tracking_id,
          messageType: 'ai_processing',
          timestamp: new Date().toISOString()
        });
        panel.conversationId = data.conversation_id;
      } else if (data.conversation_id) {
        console.log('[StreamingManager] ✅ CONVERSATION ID MATCHED - Using existing conversation:', {
          conversationId: data.conversation_id,
          panelId: panel.panelId,
          trackingId: data.tracking_id,
          timestamp: new Date().toISOString()
        });
      }

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
      console.log('[StreamingManager] ai_streaming_start event received:', {
        tracking_id: data.tracking_id,
        conversation_id: data.conversation_id,
        panel_id: data.panel_id,
        message_id: data.message_id,
        character_id: data.character_id
      });

      const panel = this.findPanelByTrackingId(data.tracking_id);
      if (!panel) {
        console.error('[StreamingManager] Panel NOT found for ai_streaming_start:', {
          searching_by_tracking_id: data.tracking_id,
          conversation_id_in_event: data.conversation_id,
          panel_id_in_event: data.panel_id,
          available_panels: Array.from(this.panels.entries()).map(([id, p]) => ({
            panelId: id,
            conversationId: p.conversationId,
            trackingIds: Array.from(p.trackingIds)
          }))
        });
        return;
      }

      console.log('[StreamingManager] Panel found for ai_streaming_start:', {
        panelId: panel.panelId,
        conversationId: panel.conversationId
      });

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
      console.log('[StreamingManager] ai_response_chunk received:', {
        chunk_index: data.chunk_index,
        tracking_id: data.tracking_id,
        conversation_id: data.conversation_id,
        panel_id: data.panel_id,
        chunk_preview: data.chunk?.substring(0, 20) + '...',
        chunk_length: data.chunk?.length
      });

      const panel = this.findPanelByTrackingId(data.tracking_id);
      if (!panel) {
        console.error('[StreamingManager] Panel NOT found for ai_response_chunk:', {
          searching_by_tracking_id: data.tracking_id,
          conversation_id_in_event: data.conversation_id,
          panel_id_in_event: data.panel_id,
          chunk_index: data.chunk_index,
          available_panels: Array.from(this.panels.entries()).map(([id, p]) => ({
            panelId: id,
            conversationId: p.conversationId,
            trackingIds: Array.from(p.trackingIds),
            isStreaming: p.isStreaming
          }))
        });
        return;
      }

      console.log('[StreamingManager] Chunk delivered to panel:', {
        panelId: panel.panelId,
        chunk_index: data.chunk_index,
        total_content_length: panel.currentStreamContent.length + data.chunk?.length
      });

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
      console.log('[StreamingManager] proposal_analysis_started event received:', {
        conversation_id: data.conversation_id,
        tracking_id: data.tracking_id,
        panel_id: data.panel_id,
        message_id: data.message_id
      });

      // Route by tracking_id first, fallback to panel_id
      let panel = this.findPanelByTrackingId(data.tracking_id);
      if (!panel && data.panel_id) {
        panel = this.panels.get(data.panel_id);
      }

      if (!panel) {
        console.error('[StreamingManager] Panel NOT found for proposal_analysis_started:', {
          searching_for_tracking_id: data.tracking_id,
          searching_for_panel_id: data.panel_id,
          conversation_id_in_event: data.conversation_id,
          available_panels: Array.from(this.panels.entries()).map(([id, p]) => ({
            panelId: id,
            conversationId: p.conversationId,
            trackingIds: Array.from(p.trackingIds)
          }))
        });
        return;
      }

      console.log('[StreamingManager] Panel found for proposal_analysis_started, updating state:', {
        panelId: panel.panelId,
        existingConversationId: panel.conversationId,
        backendConversationId: data.conversation_id,
        trackingId: data.tracking_id
      });

      // Update conversation ID if backend provides a different one
      if (data.conversation_id && panel.conversationId !== data.conversation_id) {
        console.log('[StreamingManager] 🔄 CONVERSATION ID UPDATE - Backend created/returned conversation_id:', {
          oldConversationId: panel.conversationId,
          newConversationId: data.conversation_id,
          panelId: panel.panelId,
          trackingId: data.tracking_id,
          messageType: 'proposal_analysis_started',
          timestamp: new Date().toISOString()
        });
        panel.conversationId = data.conversation_id;
      } else if (data.conversation_id) {
        console.log('[StreamingManager] ✅ CONVERSATION ID MATCHED - Using existing conversation:', {
          conversationId: data.conversation_id,
          panelId: panel.panelId,
          trackingId: data.tracking_id,
          messageType: 'proposal_analysis_started',
          timestamp: new Date().toISOString()
        });
      }

      // Ensure messageHandlers exists
      if (!panel.messageHandlers) {
        panel.messageHandlers = new Map();
      }

      panel.isStreaming = true;
      panel.currentStreamContent = '';
      panel.trackingIds.add(data.tracking_id);
      panel.activeTrackingId = data.tracking_id;

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
      const panel = this.findPanelByTrackingId(data.tracking_id);
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
        trackingId: data.tracking_id,
        timestamp: data.timestamp
      });
    });

    // Handle proposal analysis streaming chunks
    socket.on('proposal_analysis_chunk', (data) => {
      const panel = this.findPanelByTrackingId(data.tracking_id);
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
        trackingId: data.tracking_id,
        timestamp: data.timestamp
      });
    });

    socket.on('proposal_analysis_complete', (data) => {
      const panel = this.findPanelByTrackingId(data.tracking_id);
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
        trackingId: data.tracking_id,
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
      const panel = this.findPanelByTrackingId(data.tracking_id);
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
        trackingId: data.tracking_id,
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
    console.log('[StreamingManager] createPanel called:', {
      panelId,
      conversationId,
      existingPanels: Array.from(this.panels.keys())
    });

    // Check if panel already exists
    let panel = this.panels.get(panelId);
    if (panel) {
      console.log('[StreamingManager] Panel already exists, updating conversation ID:', {
        panelId,
        oldConversationId: panel.conversationId,
        newConversationId: conversationId,
        existingTrackingIds: Array.from(panel.trackingIds)
      });
      // Update the existing panel with the conversation ID but PRESERVE existing handlers
      panel.conversationId = conversationId;
    } else {
      console.log('[StreamingManager] Creating new panel:', {
        panelId,
        conversationId
      });
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
      console.log('[StreamingManager] Panel created successfully:', {
        panelId,
        conversationId,
        totalPanels: this.panels.size,
        allPanels: Array.from(this.panels.keys())
      });
    }



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
    if (!panel) {
      console.log('[StreamingManager] REMOVE PANEL - panel not found:', {
        instanceId: this.instanceId,
        panelId,
        availablePanels: Array.from(this.panels.keys())
      });
      return;
    }

    console.log('[StreamingManager] REMOVING PANEL:', {
      instanceId: this.instanceId,
      panelId,
      conversationId: panel.conversationId,
      trackingIds: Array.from(panel.trackingIds),
      remainingPanels: this.panels.size - 1,
      stackTrace: new Error().stack
    });

    // Leave the panel on the server
    await this.wsService.leavePanel(panelId);

    // Cleanup tracking IDs
    panel.trackingIds.forEach(id => this.wsService.cleanupTracking(id));


    // Remove panel
    this.panels.delete(panelId);

    console.log('[StreamingManager] PANEL REMOVED:', {
      instanceId: this.instanceId,
      panelId,
      remainingPanels: this.panels.size,
      allPanels: Array.from(this.panels.keys())
    });
  }

  sendMessageToPanel(panelId, content, metadata) {
    console.log('[StreamingManager] sendMessageToPanel called:', {
      instanceId: this.instanceId,
      panelId,
      panelsMapSize: this.panels.size,
      contentPreview: typeof content === 'string' ? content.substring(0, 50) + '...' : content,
      metadata: {
        characterId: metadata?.characterId,
        conversationId: metadata?.conversationId,
        analysisType: metadata?.analysisType,
        messageType: metadata?.messageType
      }
    });

    const panel = this.panels.get(panelId);
    if (!panel) {
      console.error('[StreamingManager] Panel not found in sendMessageToPanel:', {
        instanceId: this.instanceId,
        requestedPanelId: panelId,
        panelsMapSize: this.panels.size,
        panelsMapKeys: Array.from(this.panels.keys()),
        availablePanels: Array.from(this.panels.entries()).map(([id, p]) => ({
          panelId: id,
          conversationId: p.conversationId,
          isStreaming: p.isStreaming,
          trackingIds: Array.from(p.trackingIds)
        })),
        stackTrace: new Error().stack
      });
      return null;
    }

    console.log('[StreamingManager] Panel found, sending message:', {
      panelId: panel.panelId,
      conversationId: panel.conversationId,
      existingTrackingIds: Array.from(panel.trackingIds)
    });

    // For proposal analysis, use the analyze_proposal event
    if (metadata?.analysisType === 'proposal_wizard') {
      const socket = this.wsService.getSocket();
      if (!socket?.connected) {
        throw new Error('WebSocket not connected');
      }

      // Generate a tracking ID for frontend routing
      const trackingId = this.wsService.generateTrackingId();

      const eventData = {
        tracking_id: trackingId,
        job_posting: metadata.jobPost || content,
        character_id: metadata.characterId,
        proposal: metadata.proposal,
        platform: metadata.platform,
        feature: 'proposal_wizard',
        panel_id: panelId,
        metadata: metadata.extra
      };

      console.log('[StreamingManager] Sending analyze_proposal with tracking_id:', {
        tracking_id: trackingId,
        panel_id: panelId,
        character_id: metadata.characterId
      });

      socket.emit('analyze_proposal', eventData);

      // Add tracking ID to panel for routing incoming events
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

      // Generate a tracking ID for frontend routing
      const trackingId = this.wsService.generateTrackingId();

      const eventData = {
        tracking_id: trackingId,
        character_id: metadata.characterId,
        message: content,
        panel_id: panelId,
        conversation_id: metadata.conversationId,
        parent_message_id: metadata.parentMessageId,
        attachments: metadata.attachments,
        metadata: metadata.extra
      };

      // Add feature field if this is from proposal wizard
      if (metadata?.analysisType === 'proposal_wizard' || panelId === 'proposal_wizard') {
        eventData.feature = 'proposal_wizard';
      }

      console.log('[StreamingManager] 📤 SENDING start_ai_conversation:', {
        tracking_id: trackingId,
        panel_id: panelId,
        character_id: metadata.characterId,
        conversation_id: metadata.conversationId,
        feature: eventData.feature,
        hasConversationId: !!metadata.conversationId,
        timestamp: new Date().toISOString()
      });

      if (!metadata.conversationId) {
        console.warn('[StreamingManager] ⚠️ SENDING MESSAGE WITHOUT CONVERSATION_ID - Backend will create new conversation!');
      } else {
        console.log('[StreamingManager] ✅ SENDING MESSAGE WITH CONVERSATION_ID - Should continue existing conversation');
      }

      socket.emit('start_ai_conversation', eventData);

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
      return false;
    }

    const socket = this.wsService.getSocket();
    if (!socket?.connected) {
      return false;
    }


    // Emit the cancel event to the backend
    socket.emit('cancel_ai_response', {
      tracking_id: trackingId
    });

    // Find and update the panel state optimistically
    for (const panel of this.panels.values()) {
      if (panel.trackingIds.has(trackingId) || panel.activeTrackingId === trackingId) {
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
      return;
    }

    const handler = panel.messageHandlers.get(event);
    if (handler) {
      handler(data);
    } else {
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
    if (!panel) {
      console.log('[StreamingManager] getPanelState - Panel not found:', panelId);
      return null;
    }

    const state = {
      isStreaming: panel.isStreaming,
      currentContent: panel.currentStreamContent,
      activeMessages: panel.trackingIds.size,
      conversationId: panel.conversationId
    };

    console.log('[StreamingManager] 📋 getPanelState returning:', {
      panelId,
      conversationId: state.conversationId,
      hasConversationId: !!state.conversationId,
      isStreaming: state.isStreaming,
      activeMessages: state.activeMessages
    });

    return state;
  }

  getAllPanels() {
    return Array.from(this.panels.keys());
  }

  reconnectHandlers() {
    this.setupGlobalHandlers();
  }
}

export default MultiPanelStreamingManager;