import React, { createContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import WebSocketService from '../services/WebSocketService';
import ConversationStreamingManager from '../services/ConversationStreamingManager';
import StableWebSocketConnection from '../services/StableWebSocketConnection';
import { WS_URL } from '@/config/api';

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
  const [accessToken, setAccessToken] = useState(localStorage.getItem('access_token'));

  const navigate = useNavigate();
  const wsServiceRef = useRef(null);
  const conversationManagerRef = useRef(null);
  const stableConnectionRef = useRef(null);
  const healthIntervalRef = useRef(null);
  const initializationRef = useRef(false);

  const initWebSocket = useCallback(async () => {
    if (initializationRef.current) {
      return;
    }

    // Check if we have an access token
    const token = localStorage.getItem('access_token');
    if (!token) {
      setConnectionError('Not authenticated');
      return;
    }

    initializationRef.current = true;
    setConnectionError(null);

    try {
      const wsUrl = import.meta.env.VITE_WS_URL || WS_URL;

      const wsService = new WebSocketService({
        baseUrl: wsUrl,
        getAccessToken: () => localStorage.getItem('access_token'),
        onConnectionChange: setIsConnected,
        debug: import.meta.env.DEV
      });

      await wsService.connect();

      const conversationManager = new ConversationStreamingManager(wsService);

      const stableConnection = new StableWebSocketConnection(wsService);

      // Set callbacks
      stableConnection.setCallbacks({
        onConnectionDegraded: (health) => {
          setConnectionHealth(health);
        },
        onReconnectionFailure: () => {
          setConnectionError('Connection lost. Please refresh the page.');
        }
      });

      wsServiceRef.current = wsService;
      conversationManagerRef.current = conversationManager;
      stableConnectionRef.current = stableConnection;

      // Monitor connection health
      healthIntervalRef.current = setInterval(() => {
        const health = stableConnection.getConnectionHealth();
        setConnectionHealth(health);
      }, 5000);

    } catch (error) {
      console.error('[WebSocketContext] Initialization error:', error);
      setConnectionError('Failed to connect to server');
      initializationRef.current = false; // Allow retry
    }
  }, [navigate]);

  // Monitor localStorage changes for access token
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'access_token') {
        const newToken = e.newValue;
        setAccessToken(newToken);

        if (newToken && !initializationRef.current) {
          initWebSocket();
        } else if (!newToken && initializationRef.current) {
          // Cleanup WebSocket when token is removed
          if (healthIntervalRef.current) {
            clearInterval(healthIntervalRef.current);
          }
          stableConnectionRef.current?.destroy();
          wsServiceRef.current?.disconnect();
          initializationRef.current = false;
          setIsConnected(false);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [initWebSocket]);

  // Check for token periodically (fallback for same-tab changes)
  useEffect(() => {
    const checkToken = () => {
      const currentToken = localStorage.getItem('access_token');
      if (currentToken !== accessToken) {
        setAccessToken(currentToken);
      }
    };

    const interval = setInterval(checkToken, 1000); // Check every second
    return () => clearInterval(interval);
  }, [accessToken]);

  useEffect(() => {
    // Only initialize if we have an access token
    if (accessToken) {
      initWebSocket();
    }

    // Cleanup on unmount
    return () => {
      if (healthIntervalRef.current) {
        clearInterval(healthIntervalRef.current);
      }
      stableConnectionRef.current?.destroy();
      wsServiceRef.current?.disconnect();
      initializationRef.current = false;
    };
  }, [accessToken, initWebSocket]);

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

    conversationManagerRef.current.sendMessage(conversationId, characterId, message);
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

  const value = useMemo(() => ({
    isConnected,
    connectionHealth,
    connectionError,
    createConversation,
    sendMessage,
    invokeTool,
    cancelRequest,
    getConversationState,
    onConversationEvent,
    reconnect,
    conversationManager: conversationManagerRef.current
  }), [
    isConnected,
    connectionHealth,
    connectionError,
    createConversation,
    sendMessage,
    cancelRequest,
    invokeTool,
    getConversationState,
    onConversationEvent,
    reconnect
  ]);

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};