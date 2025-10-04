import React, { createContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import WebSocketService from '../services/WebSocketService';
import ConversationStreamingManager from '../services/ConversationStreamingManager';
import StableWebSocketConnection from '../services/StableWebSocketConnection';
import { MessageQueueManager, ErrorRecoveryManager } from '../services/MessageQueueManager';

export const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionHealth, setConnectionHealth] = useState({
    isHealthy: false,
    lastPing: 0,
    latency: 0,
    reconnectCount: 0,
    connectionQuality: 'poor'
  });
  const [connectionError, setConnectionError] = useState(null);

  const navigate = useNavigate();
  const wsServiceRef = useRef(null);
  const conversationManagerRef = useRef(null);
  const stableConnectionRef = useRef(null);
  const messageQueueRef = useRef(null);
  const errorRecoveryRef = useRef(null);
  const healthIntervalRef = useRef(null);
  const initializationRef = useRef(false);

  const initWebSocket = useCallback(async () => {
    console.log('[WebSocketContext] initWebSocket CALLED:', {
      isAlreadyInitialized: initializationRef.current,
      hasToken: !!localStorage.getItem('access_token'),
      timestamp: new Date().toISOString()
    });

    if (initializationRef.current) {
      console.log('[WebSocketContext] Already initialized, skipping');
      return;
    }

    // Check if we have an access token
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('[WebSocketContext] No access token found');
      setConnectionError('Not authenticated');
      return;
    }

    initializationRef.current = true;
    setConnectionError(null);

    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 'https://demo-api.zenible.com';

      console.log('[WebSocketContext] Creating WebSocketService:', { wsUrl });

      const wsService = new WebSocketService({
        baseUrl: wsUrl,
        getAccessToken: () => localStorage.getItem('access_token'),
        onConnectionChange: setIsConnected,
        debug: import.meta.env.DEV
      });

      await wsService.connect();

      console.log('[WebSocketContext] Creating ConversationStreamingManager');
      const conversationManager = new ConversationStreamingManager(wsService);

      console.log('[WebSocketContext] Creating support services');
      const stableConnection = new StableWebSocketConnection(wsService);
      const messageQueue = new MessageQueueManager(wsService, conversationManager);
      const errorRecovery = new ErrorRecoveryManager(wsService, stableConnection);

      // Set callbacks
      stableConnection.setCallbacks({
        onConnectionDegraded: (health) => {
          setConnectionHealth(health);
        },
        onReconnectionFailure: () => {
          setConnectionError('Connection lost. Please refresh the page.');
        }
      });

      messageQueue.setCallbacks({
        onMessageFailed: (message) => {
        }
      });

      errorRecovery.setCallbacks({
        onAuthFailure: () => {
          navigate('/signin');
        }
      });

      wsServiceRef.current = wsService;
      conversationManagerRef.current = conversationManager;
      stableConnectionRef.current = stableConnection;
      messageQueueRef.current = messageQueue;
      errorRecoveryRef.current = errorRecovery;

      console.log('[WebSocketContext] All services initialized and stored in refs:', {
        hasWsService: !!wsServiceRef.current,
        hasConversationManager: !!conversationManagerRef.current
      });

      // Monitor connection health
      healthIntervalRef.current = setInterval(() => {
        const health = stableConnection.getConnectionHealth();
        setConnectionHealth(health);
      }, 5000);

    } catch (error) {
      console.error('[WebSocketContext] Initialization error:', error);
      setConnectionError('Failed to connect to server');
      errorRecoveryRef.current?.handleError('connection_error', error);
      initializationRef.current = false; // Allow retry
    }
  }, [navigate]);

  useEffect(() => {
    console.log('[WebSocketContext] Main effect running');

    // Only initialize if we have an access token
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      console.log('[WebSocketContext] Access token found, initializing WebSocket');
      initWebSocket();
    } else {
      console.log('[WebSocketContext] No access token, skipping WebSocket initialization');
    }

    // Cleanup on unmount
    return () => {
      console.log('[WebSocketContext] CLEANUP RUNNING - DESTROYING ALL SERVICES:', {
        hasConversationManager: !!conversationManagerRef.current,
        stackTrace: new Error().stack
      });

      if (healthIntervalRef.current) {
        clearInterval(healthIntervalRef.current);
      }
      messageQueueRef.current?.destroy();
      stableConnectionRef.current?.destroy();
      wsServiceRef.current?.disconnect();
      initializationRef.current = false;
    };
  }, [initWebSocket]);

  // Create a new conversation
  const createConversation = useCallback(async (characterId, feature = null, metadata = {}) => {
    if (!conversationManagerRef.current) {
      throw new Error('WebSocket not initialized');
    }

    try {
      const conversationId = await conversationManagerRef.current.createConversation(
        characterId,
        feature,
        metadata
      );
      return conversationId;
    } catch (error) {
      console.error('[WebSocketContext] Failed to create conversation:', error);
      throw error;
    }
  }, []);

  // Send a message in a conversation
  const sendMessage = useCallback((conversationId, characterId, message) => {
    if (!conversationManagerRef.current) {
      throw new Error('WebSocket not initialized');
    }

    try {
      conversationManagerRef.current.sendMessage(conversationId, characterId, message);
    } catch (error) {
      // Queue message for retry
      messageQueueRef.current?.enqueue({
        conversationId,
        characterId,
        message,
        maxAttempts: 3
      });
      throw error;
    }
  }, []);

  // Invoke a tool in a conversation
  const invokeTool = useCallback((conversationId, characterId, toolName, toolArguments) => {
    if (!conversationManagerRef.current) {
      throw new Error('WebSocket not initialized');
    }

    try {
      conversationManagerRef.current.invokeTool(
        conversationId,
        characterId,
        toolName,
        toolArguments
      );
    } catch (error) {
      console.error('[WebSocketContext] Failed to invoke tool:', error);
      throw error;
    }
  }, []);

  // Map a panel to a conversation for UI routing
  const mapPanelToConversation = useCallback((panelId, conversationId) => {
    if (!conversationManagerRef.current) return;
    conversationManagerRef.current.mapPanelToConversation(panelId, conversationId);
  }, []);

  // Get conversation for a panel
  const getConversationForPanel = useCallback((panelId) => {
    if (!conversationManagerRef.current) return null;
    return conversationManagerRef.current.getConversationForPanel(panelId);
  }, []);

  // Get conversation state
  const getConversationState = useCallback((conversationId) => {
    if (!conversationManagerRef.current) return null;
    return conversationManagerRef.current.getConversationState(conversationId);
  }, []);

  // Register event handler for a conversation
  const onConversationEvent = useCallback((conversationId, event, handler) => {
    if (!conversationManagerRef.current) return () => {};
    return conversationManagerRef.current.onConversationEvent(conversationId, event, handler);
  }, []);

  // Cancel active AI request
  const cancelRequest = useCallback((conversationId) => {
    if (!conversationManagerRef.current) return;
    conversationManagerRef.current.cancelRequest(conversationId);
  }, []);

  const reconnect = useCallback(async () => {
    await stableConnectionRef.current?.forceReconnect();
  }, []);

  const getQueueSize = useCallback(() => {
    return messageQueueRef.current?.getQueueSize() || 0;
  }, []);

  const value = useMemo(() => ({
    isConnected,
    connectionHealth,
    connectionError,
    createConversation,
    sendMessage,
    invokeTool,
    cancelRequest,
    mapPanelToConversation,
    getConversationForPanel,
    getConversationState,
    onConversationEvent,
    reconnect,
    getQueueSize,
    conversationManager: conversationManagerRef.current
  }), [
    isConnected,
    connectionHealth,
    connectionError,
    createConversation,
    sendMessage,
    cancelRequest,
    invokeTool,
    mapPanelToConversation,
    getConversationForPanel,
    getConversationState,
    onConversationEvent,
    reconnect,
    getQueueSize
  ]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};