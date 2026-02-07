import React, { createContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import WebSocketService from '../services/WebSocketService';
import ConversationStreamingManager from '../services/ConversationStreamingManager';
import StableWebSocketConnection from '../services/StableWebSocketConnection';
import { WS_URL } from '@/config/api';
import logger from '../utils/logger';

interface ConnectionHealth {
  isHealthy: boolean;
  lastPing: number;
  latency: number;
  reconnectCount: number;
  connectionQuality: string;
}

export interface WebSocketContextValue {
  isConnected: boolean;
  connectionHealth: ConnectionHealth;
  connectionError: string | null;
  createConversation: (characterId: string, feature?: string | null, metadata?: Record<string, unknown>) => Promise<string>;
  sendMessage: (conversationId: string, characterId: string, message: string) => void;
  invokeTool: (conversationId: string, characterId: string, toolName: string, toolArguments: unknown) => void;
  cancelRequest: (conversationId: string) => void;
  getConversationState: (conversationId: string) => unknown;
  onConversationEvent: (conversationId: string, event: string, handler: (...args: unknown[]) => void) => () => void;
  reconnect: () => Promise<void>;
  conversationManager: unknown;
}

export const WebSocketContext = createContext<WebSocketContextValue | null>(null);

export const WebSocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionHealth, setConnectionHealth] = useState<ConnectionHealth>({
    isHealthy: false,
    lastPing: 0,
    latency: 0,
    reconnectCount: 0,
    connectionQuality: 'poor'
  });
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(localStorage.getItem('access_token'));

  const navigate = useNavigate();
  const wsServiceRef = useRef<WebSocketService | null>(null);
  const conversationManagerRef = useRef<ConversationStreamingManager | null>(null);
  const stableConnectionRef = useRef<StableWebSocketConnection | null>(null);
  const healthIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initializationRef = useRef<boolean>(false);

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
        onConnectionDegraded: (health: ConnectionHealth) => {
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
      logger.error('[WebSocketContext] Initialization error:', error);
      setConnectionError('Failed to connect to server');
      initializationRef.current = false; // Allow retry
    }
  }, [navigate]);

  // Monitor localStorage changes for access token
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
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
  const createConversation = useCallback(async (characterId: string, feature: string | null = null, metadata: Record<string, unknown> = {}) => {
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
      logger.error('[WebSocketContext] Failed to create conversation:', error);
      throw error;
    }
  }, []);

  // Send a message in a conversation
  const sendMessage = useCallback((conversationId: string, characterId: string, message: string) => {
    if (!conversationManagerRef.current) {
      throw new Error('WebSocket not initialized');
    }

    conversationManagerRef.current.sendMessage(conversationId, characterId, message);
  }, []);

  // Invoke a tool in a conversation
  const invokeTool = useCallback((conversationId: string, characterId: string, toolName: string, toolArguments: unknown) => {
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
      logger.error('[WebSocketContext] Failed to invoke tool:', error);
      throw error;
    }
  }, []);

  // Get conversation state
  const getConversationState = useCallback((conversationId: string) => {
    if (!conversationManagerRef.current) return null;
    return conversationManagerRef.current.getConversationState(conversationId);
  }, []);

  // Register event handler for a conversation
  const onConversationEvent = useCallback((conversationId: string, event: string, handler: (...args: unknown[]) => void) => {
    if (!conversationManagerRef.current) return () => {};
    return conversationManagerRef.current.onConversationEvent(conversationId, event, handler);
  }, []);

  // Cancel active AI request
  const cancelRequest = useCallback((conversationId: string) => {
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
