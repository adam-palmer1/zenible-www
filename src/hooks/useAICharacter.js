import { useState, useEffect, useCallback, useRef } from 'react';
import { useWebSocketConnection } from './useWebSocketConnection';

/**
 * Hook for AI character conversations with streaming support
 * @param {Object} options - Configuration options
 * @param {string} options.conversationId - The conversation ID
 * @param {string} options.characterId - The AI character ID
 * @param {string} [options.panelId] - Optional panel ID for multi-panel support
 * @param {Function} [options.onChunk] - Callback for each chunk received
 * @param {Function} [options.onComplete] - Callback when streaming completes
 * @param {Function} [options.onError] - Callback for errors
 */
export function useAICharacter(options) {
  const [isConnected, setIsConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const [trackingId, setTrackingId] = useState(null);
  const [messageId, setMessageId] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  const { streamingManager, joinPanel, leavePanel, isConnected: wsConnected } = useWebSocketConnection();

  const responseAccumulator = useRef('');
  const panelId = options.panelId || `ai_char_${options.conversationId}_${options.characterId}`;
  const unsubscribersRef = useRef([]);

  useEffect(() => {
    if (!options.conversationId || !options.characterId) return;

    const setupPanel = async () => {
      try {
        setIsConnected(wsConnected);

        if (!wsConnected || !streamingManager) {
          return;
        }

        // Join the panel
        await joinPanel(panelId, options.conversationId);

        // Setup event handlers
        const handlers = [
          // Processing phase
          streamingManager.onPanelEvent(panelId, 'processing', (data) => {
            setIsProcessing(true);
            setIsStreaming(false);
            setTrackingId(data.trackingId);
            setMessageId(data.messageId);
            setError(null);
            responseAccumulator.current = '';
            setCurrentResponse('');
          }),

          // Streaming start
          streamingManager.onPanelEvent(panelId, 'streaming_start', (data) => {
            setIsProcessing(false);
            setIsStreaming(true);
          }),

          // Chunks
          streamingManager.onPanelEvent(panelId, 'chunk', (data) => {
            responseAccumulator.current = data.content;
            setCurrentResponse(data.content);

            if (options.onChunk) {
              options.onChunk(data.chunk, data.content);
            }
          }),

          // Streaming complete
          streamingManager.onPanelEvent(panelId, 'streaming_complete', (data) => {
            setIsProcessing(false);
            setIsStreaming(false);
            setMetrics({
              totalTokens: data.totalTokens,
              costCents: data.costCents,
              durationMs: data.durationMs,
              chunksSent: data.chunksSent
            });

            if (options.onComplete) {
              options.onComplete({
                ...data,
                response: data.fullResponse || responseAccumulator.current
              });
            }
          }),

          // Error handling
          streamingManager.onPanelEvent(panelId, 'ai_error', (data) => {
            setIsProcessing(false);
            setIsStreaming(false);
            setError(data.error || 'An error occurred');

            if (options.onError) {
              options.onError(data);
            }
          })
        ];

        unsubscribersRef.current = handlers;
      } catch (error) {
        console.error('Failed to setup AI character panel:', error);
        setError('Failed to connect to AI character');
      }
    };

    setupPanel();

    // Cleanup
    return () => {
      unsubscribersRef.current.forEach(unsub => {
        if (typeof unsub === 'function') unsub();
      });
      unsubscribersRef.current = [];
      leavePanel(panelId);
    };
  }, [options.conversationId, options.characterId, wsConnected, streamingManager]);

  const sendMessage = useCallback((message, metadata = {}) => {
    if (!streamingManager || !isConnected || isProcessing || isStreaming) {
      console.error('Cannot send message:', {
        hasManager: !!streamingManager,
        isConnected,
        isProcessing,
        isStreaming
      });
      return null;
    }

    setError(null);
    responseAccumulator.current = '';

    const fullMetadata = {
      ...metadata,
      characterId: options.characterId,
      conversationId: options.conversationId
    };

    try {
      const trackingId = streamingManager.sendMessageToPanel(
        panelId,
        message,
        fullMetadata
      );

      if (trackingId) {
        setTrackingId(trackingId);
      }

      return trackingId;
    } catch (error) {
      console.error('Failed to send message:', error);
      setError('Failed to send message');
      return null;
    }
  }, [streamingManager, isConnected, isProcessing, isStreaming, options, panelId]);

  const cancelResponse = useCallback(() => {
    if (!streamingManager || !trackingId) {
      return false;
    }

    const socket = streamingManager.wsService?.getSocket();
    if (!socket?.connected) {
      return false;
    }

    socket.emit('cancel_ai_response', {
      tracking_id: trackingId
    });

    setIsProcessing(false);
    setIsStreaming(false);
    setTrackingId(null);
    return true;
  }, [streamingManager, trackingId]);

  const reset = useCallback(() => {
    setCurrentResponse('');
    setError(null);
    setIsProcessing(false);
    setIsStreaming(false);
    setTrackingId(null);
    setMessageId(null);
    setMetrics(null);
    responseAccumulator.current = '';
  }, []);

  return {
    isConnected,
    isProcessing,
    isStreaming,
    currentResponse,
    trackingId,
    messageId,
    metrics,
    error,
    sendMessage,
    cancelResponse,
    reset
  };
}