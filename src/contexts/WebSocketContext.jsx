import React, { createContext, useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import WebSocketService from '../services/WebSocketService';
import MultiPanelStreamingManager from '../services/MultiPanelStreamingManager';
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
  const streamingManagerRef = useRef(null);
  const stableConnectionRef = useRef(null);
  const messageQueueRef = useRef(null);
  const errorRecoveryRef = useRef(null);
  const healthIntervalRef = useRef(null);
  const initializationRef = useRef(false);

  const initWebSocket = useCallback(async () => {
    if (initializationRef.current) {
      console.log('WebSocket already initialized');
      return;
    }

    // Check if we have an access token
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('No access token found, skipping WebSocket connection');
      setConnectionError('Not authenticated');
      return;
    }

    initializationRef.current = true;
    setConnectionError(null);

    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 'https://demo-api.zenible.com';

      const wsService = new WebSocketService({
        baseUrl: wsUrl,
        getAccessToken: () => localStorage.getItem('access_token'),
        onConnectionChange: setIsConnected,
        debug: import.meta.env.DEV
      });

      await wsService.connect();

      const streamingManager = new MultiPanelStreamingManager(wsService);
      const stableConnection = new StableWebSocketConnection(wsService);
      const messageQueue = new MessageQueueManager(wsService, streamingManager);
      const errorRecovery = new ErrorRecoveryManager(wsService, stableConnection);

      // Set callbacks
      stableConnection.setCallbacks({
        onConnectionDegraded: (health) => {
          console.warn('Connection degraded:', health);
          setConnectionHealth(health);
        },
        onReconnectionFailure: () => {
          console.error('WebSocket reconnection failed');
          setConnectionError('Connection lost. Please refresh the page.');
        }
      });

      messageQueue.setCallbacks({
        onMessageFailed: (message) => {
          console.error('Message failed to send:', message);
        }
      });

      errorRecovery.setCallbacks({
        onAuthFailure: () => {
          console.error('Authentication failed');
          navigate('/signin');
        }
      });

      wsServiceRef.current = wsService;
      streamingManagerRef.current = streamingManager;
      stableConnectionRef.current = stableConnection;
      messageQueueRef.current = messageQueue;
      errorRecoveryRef.current = errorRecovery;

      // Monitor connection health
      healthIntervalRef.current = setInterval(() => {
        const health = stableConnection.getConnectionHealth();
        setConnectionHealth(health);
      }, 5000);

      console.log('WebSocket initialized successfully');
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
      setConnectionError('Failed to connect to server');
      errorRecoveryRef.current?.handleError('connection_error', error);
      initializationRef.current = false; // Allow retry
    }
  }, [navigate]);

  useEffect(() => {
    // Only initialize if we have an access token
    const accessToken = localStorage.getItem('access_token');
    console.log('WebSocketContext effect - token present:', !!accessToken);
    if (accessToken) {
      initWebSocket();
    } else {
      console.log('No access token, deferring WebSocket connection');
    }

    // Cleanup on unmount
    return () => {
      if (healthIntervalRef.current) {
        clearInterval(healthIntervalRef.current);
      }
      messageQueueRef.current?.destroy();
      stableConnectionRef.current?.destroy();
      wsServiceRef.current?.disconnect();
      initializationRef.current = false;
    };
  }, [initWebSocket]);

  const sendMessage = useCallback((panelId, content, metadata) => {
    if (!streamingManagerRef.current) {
      console.error('WebSocket not initialized');
      return null;
    }

    try {
      return streamingManagerRef.current.sendMessageToPanel(panelId, content, metadata);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Queue message for retry
      messageQueueRef.current?.enqueue({
        panelId,
        content,
        metadata,
        maxAttempts: 3
      });
      return null;
    }
  }, []);

  const joinPanel = useCallback(async (panelId, conversationId) => {
    if (!streamingManagerRef.current) {
      throw new Error('WebSocket not initialized');
    }
    await streamingManagerRef.current.createPanel(panelId, conversationId);
  }, []);

  const leavePanel = useCallback(async (panelId) => {
    if (!streamingManagerRef.current) return;
    await streamingManagerRef.current.removePanel(panelId);
  }, []);

  const getPanelState = useCallback((panelId) => {
    return streamingManagerRef.current?.getPanelState(panelId);
  }, []);

  const reconnect = useCallback(async () => {
    await stableConnectionRef.current?.forceReconnect();
  }, []);

  const getQueueSize = useCallback(() => {
    return messageQueueRef.current?.getQueueSize() || 0;
  }, []);

  const value = {
    isConnected,
    connectionHealth,
    connectionError,
    sendMessage,
    joinPanel,
    leavePanel,
    getPanelState,
    reconnect,
    getQueueSize,
    streamingManager: streamingManagerRef.current
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};