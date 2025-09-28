import { useEffect, useState, useRef, useCallback, useContext } from 'react';
import WebSocketService from '../services/WebSocketService';
import MultiPanelStreamingManager from '../services/MultiPanelStreamingManager';
import StableWebSocketConnection from '../services/StableWebSocketConnection';
import { MessageQueueManager, ErrorRecoveryManager } from '../services/MessageQueueManager';
import { WebSocketContext } from '../contexts/WebSocketContext';

export const useWebSocketConnection = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketConnection must be used within WebSocketProvider');
  }
  return context;
};

// Hook for individual panel streaming
export const usePanelStreaming = (panelId, conversationId) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [error, setError] = useState(null);
  const { joinPanel, leavePanel, sendMessage, getPanelState, streamingManager } = useWebSocketConnection();

  const unsubscribersRef = useRef([]);

  useEffect(() => {
    if (!panelId || !conversationId) return;

    const setupPanel = async () => {
      try {
        await joinPanel(panelId, conversationId);

        // Setup event handlers
        if (streamingManager) {
          // Handle streaming chunks
          const unsubChunk = streamingManager.onPanelEvent(
            panelId,
            'chunk',
            (data) => {
              setStreamContent(data.content);
              setIsStreaming(!data.isFinal);
            }
          );
          unsubscribersRef.current.push(unsubChunk);

          // Handle stream start
          const unsubStart = streamingManager.onPanelEvent(
            panelId,
            'start',
            (data) => {
              setIsStreaming(true);
              setStreamContent('');
              setError(null);
            }
          );
          unsubscribersRef.current.push(unsubStart);

          // Handle stream end
          const unsubEnd = streamingManager.onPanelEvent(
            panelId,
            'end',
            (data) => {
              setIsStreaming(false);
            }
          );
          unsubscribersRef.current.push(unsubEnd);

          // Handle completion
          const unsubComplete = streamingManager.onPanelEvent(
            panelId,
            'complete',
            (data) => {
              setIsStreaming(false);
              setStreamContent('');
            }
          );
          unsubscribersRef.current.push(unsubComplete);

          // Handle errors
          const unsubError = streamingManager.onPanelEvent(
            panelId,
            'error',
            (data) => {
              setError(data.message || data.error || 'An error occurred');
              setIsStreaming(false);
            }
          );
          unsubscribersRef.current.push(unsubError);
        }
      } catch (error) {
        console.error(`Failed to setup panel ${panelId}:`, error);
        setError('Failed to connect to chat panel');
      }
    };

    setupPanel();

    // Cleanup
    return () => {
      leavePanel(panelId);
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };
  }, [panelId, conversationId, joinPanel, leavePanel, streamingManager]);

  const sendPanelMessage = useCallback((content, metadata) => {
    setError(null);
    return sendMessage(panelId, content, metadata);
  }, [panelId, sendMessage]);

  const clearContent = useCallback(() => {
    setStreamContent('');
  }, []);

  return {
    isStreaming,
    streamContent,
    error,
    sendMessage: sendPanelMessage,
    clearContent,
    panelState: getPanelState(panelId)
  };
};

// Simplified hook for AI streaming without panel management
export const useAIStreaming = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamContent, setStreamContent] = useState('');
  const [error, setError] = useState(null);
  const panelIdRef = useRef(`panel_${Date.now()}_${Math.random()}`);
  const conversationIdRef = useRef(`conv_${Date.now()}_${Math.random()}`);

  const {
    isStreaming: panelStreaming,
    streamContent: panelContent,
    error: panelError,
    sendMessage,
    clearContent
  } = usePanelStreaming(panelIdRef.current, conversationIdRef.current);

  useEffect(() => {
    setIsStreaming(panelStreaming);
    setStreamContent(panelContent);
    setError(panelError);
  }, [panelStreaming, panelContent, panelError]);

  const sendAIMessage = useCallback(async (content, metadata = {}) => {
    clearContent();
    return sendMessage(content, metadata);
  }, [sendMessage, clearContent]);

  const reset = useCallback(() => {
    setStreamContent('');
    setError(null);
    setIsStreaming(false);
    clearContent();
  }, [clearContent]);

  return {
    isStreaming,
    streamContent,
    error,
    sendMessage: sendAIMessage,
    reset
  };
};