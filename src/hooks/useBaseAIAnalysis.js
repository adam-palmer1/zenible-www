import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { WebSocketContext } from '../contexts/WebSocketContext';

/**
 * Base hook for AI analysis using the new AI tools system
 * Handles the common two-step flow: create conversation, then invoke tool
 *
 * This hook can be wrapped by feature-specific hooks (useProposalAnalysis, useViralPostAnalysis, etc.)
 * to provide a consistent interface for AI tool invocation
 *
 * @param {Object} config Configuration object
 * @param {string} config.characterId - ID of the AI character to use
 * @param {string} config.panelId - ID of the panel (e.g., 'proposal_wizard', 'viral_post_generator')
 * @param {string[]} config.supportedTools - Array of tool names this hook should handle
 * @param {Function} config.structuredAnalysisMapper - Optional function to map structured analysis data
 * @param {Object} config.callbacks - Callback functions for different events
 */
export function useBaseAIAnalysis({
  characterId,
  panelId,
  supportedTools = [],
  structuredAnalysisMapper = null,
  onAnalysisStarted,
  onAnalysisComplete,
  onStreamingStarted,
  onStreamingChunk,
  onError
}) {
  // State
  const [conversationId, setConversationId] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [structuredAnalysis, setStructuredAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [messageId, setMessageId] = useState(null);

  // Refs
  const isAnalyzingRef = useRef(false);
  const isStreamingRef = useRef(false);
  const streamingContentRef = useRef('');
  const unsubscribersRef = useRef([]);

  // Context
  const {
    isConnected,
    createConversation,
    invokeTool: invokeToolContext,
    sendMessage,
    cancelRequest,
    onConversationEvent,
    conversationManager
  } = useContext(WebSocketContext);

  // Store callbacks in refs to avoid effect re-runs
  const callbacksRef = useRef({
    onAnalysisStarted,
    onAnalysisComplete,
    onStreamingStarted,
    onStreamingChunk,
    onError
  });

  // Update callbacks without triggering effect
  useEffect(() => {
    callbacksRef.current = {
      onAnalysisStarted,
      onAnalysisComplete,
      onStreamingStarted,
      onStreamingChunk,
      onError
    };
  }, [onAnalysisStarted, onAnalysisComplete, onStreamingStarted, onStreamingChunk, onError]);

  // Setup event handlers for conversation
  useEffect(() => {
    if (!conversationId || !conversationManager) return;

    console.log('[useBaseAIAnalysis] Setting up event handlers for conversation:', conversationId);

    // Clear previous handlers
    unsubscribersRef.current.forEach(unsub => unsub());
    unsubscribersRef.current = [];

    // Register event handlers
    const handlers = [
      // Handle streaming chunks
      onConversationEvent(conversationId, 'chunk', (data) => {
        console.log('[useBaseAIAnalysis] Received chunk:', {
          toolName: data.toolName,
          chunkLength: data.chunk?.length,
          chunkIndex: data.chunkIndex
        });

        // Only handle chunks from supported tools
        if (supportedTools.includes(data.toolName)) {
          setIsStreaming(true);
          isStreamingRef.current = true;

          const newContent = data.fullContent || '';
          setStreamingContent(newContent);
          streamingContentRef.current = newContent;

          if (callbacksRef.current.onStreamingChunk) {
            callbacksRef.current.onStreamingChunk({
              chunk: data.chunk,
              fullContent: newContent,
              chunkIndex: data.chunkIndex,
              toolName: data.toolName
            });
          }
        }
      }),

      // Handle completion
      onConversationEvent(conversationId, 'complete', (data) => {
        console.log('[useBaseAIAnalysis] Analysis complete:', {
          toolName: data.toolName,
          hasStructured: !!data.structuredAnalysis,
          contentType: data.contentType
        });

        // Check if this is a response from one of our supported tools
        if (supportedTools.includes(data.toolName)) {
          setIsAnalyzing(false);
          isAnalyzingRef.current = false;
          setIsStreaming(false);
          isStreamingRef.current = false;

          // Set structured analysis if available
          let mappedStructuredAnalysis = null;

          if (data.structuredAnalysis) {
            // Use custom mapper if provided, otherwise use raw data
            mappedStructuredAnalysis = structuredAnalysisMapper
              ? structuredAnalysisMapper(data.structuredAnalysis)
              : data.structuredAnalysis;

            setStructuredAnalysis(mappedStructuredAnalysis);
            setAnalysis({
              raw: data.fullResponse,
              structured: mappedStructuredAnalysis
            });
          } else {
            setAnalysis({
              raw: data.fullResponse,
              structured: null
            });
          }

          // Set metrics
          if (data.usage) {
            setMetrics({
              totalTokens: data.usage.totalTokens,
              costCents: data.usage.costCents,
              durationMs: data.usage.durationMs
            });
          }

          // Set message ID for rating
          setMessageId(data.messageId);

          if (callbacksRef.current.onAnalysisComplete) {
            callbacksRef.current.onAnalysisComplete({
              analysis: {
                raw: data.fullResponse,
                structured: mappedStructuredAnalysis
              },
              messageId: data.messageId,
              usage: data.usage,
              contentType: data.contentType,
              toolName: data.toolName
            });
          }
        }
      }),

      // Handle tool errors
      onConversationEvent(conversationId, 'tool_error', (data) => {
        console.error('[useBaseAIAnalysis] Tool error:', data);

        if (supportedTools.includes(data.toolName)) {
          setIsAnalyzing(false);
          isAnalyzingRef.current = false;
          setIsStreaming(false);
          isStreamingRef.current = false;

          const errorMessage = data.validationErrors?.length > 0
            ? data.validationErrors.map(e => `${e.field}: ${e.message}`).join(', ')
            : data.error;

          setError(errorMessage);

          if (callbacksRef.current.onError) {
            callbacksRef.current.onError({
              error: errorMessage,
              validationErrors: data.validationErrors,
              toolName: data.toolName
            });
          }
        }
      }),

      // Handle general errors
      onConversationEvent(conversationId, 'error', (data) => {
        console.error('[useBaseAIAnalysis] General error:', data);

        setIsAnalyzing(false);
        isAnalyzingRef.current = false;
        setIsStreaming(false);
        isStreamingRef.current = false;
        setError(data.error);

        if (callbacksRef.current.onError) {
          callbacksRef.current.onError({ error: data.error });
        }
      })
    ];

    unsubscribersRef.current = handlers;

    return () => {
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };
  }, [conversationId, conversationManager, onConversationEvent, supportedTools, structuredAnalysisMapper]);

  /**
   * Generic tool invocation function
   * @param {string} toolName - Name of the tool to invoke
   * @param {Object} toolArguments - Arguments to pass to the tool
   */
  const invokeTool = useCallback(async (toolName, toolArguments) => {
    if (!isConnected) {
      setError('Not connected to server');
      return null;
    }

    if (isAnalyzing) {
      console.log('[useBaseAIAnalysis] Already analyzing');
      return null;
    }

    if (!supportedTools.includes(toolName)) {
      console.error('[useBaseAIAnalysis] Unsupported tool:', toolName);
      setError(`Tool '${toolName}' is not supported by this hook`);
      return null;
    }

    // Reset analysis state
    console.log('[useBaseAIAnalysis] Resetting analysis state for new analysis');
    setError(null);
    setAnalysis(null);
    setStructuredAnalysis(null);
    setMessageId(null);
    setMetrics(null);
    setIsStreaming(false);
    isStreamingRef.current = false;
    setStreamingContent('');
    streamingContentRef.current = '';

    try {
      console.log('[useBaseAIAnalysis] Starting analysis with tool:', toolName);
      setIsAnalyzing(true);
      isAnalyzingRef.current = true;

      // Step 1: Create conversation if needed
      let convId = conversationId;
      if (!convId) {
        console.log('[useBaseAIAnalysis] Creating new conversation...');
        convId = await createConversation(characterId, panelId, {});
        setConversationId(convId);
        console.log('[useBaseAIAnalysis] Conversation created:', convId);
      }

      // Step 2: Invoke the tool
      console.log('[useBaseAIAnalysis] Invoking tool:', toolName);

      if (callbacksRef.current.onAnalysisStarted) {
        callbacksRef.current.onAnalysisStarted({ conversationId: convId, toolName });
      }

      // Wait a moment for event handlers to be set up if conversation was just created
      if (!conversationId) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await invokeToolContext(
        convId,
        characterId,
        toolName,
        toolArguments
      );

      console.log('[useBaseAIAnalysis] Tool invoked successfully');

      if (callbacksRef.current.onStreamingStarted) {
        callbacksRef.current.onStreamingStarted({ conversationId: convId, toolName });
      }

      return convId;
    } catch (error) {
      console.error('[useBaseAIAnalysis] Failed to invoke tool:', error);
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
      setError(error.message || `Failed to invoke tool: ${toolName}`);

      if (callbacksRef.current.onError) {
        callbacksRef.current.onError({ error: error.message, toolName });
      }

      return null;
    }
  }, [isConnected, isAnalyzing, conversationId, characterId, panelId, supportedTools, createConversation, invokeToolContext]);

  // Send follow-up message
  const sendFollowUpMessage = useCallback(async (message) => {
    if (!conversationId) {
      setError('No active conversation');
      return;
    }

    if (!isConnected) {
      setError('Not connected to server');
      return;
    }

    try {
      console.log('[useBaseAIAnalysis] Sending follow-up message...');
      await sendMessage(conversationId, characterId, message);
      return conversationId;
    } catch (error) {
      console.error('[useBaseAIAnalysis] Failed to send message:', error);
      setError(error.message || 'Failed to send message');
      return null;
    }
  }, [conversationId, isConnected, characterId, sendMessage]);

  // Reset function with cancellation
  const reset = useCallback(() => {
    // Cancel any active request
    if (conversationId && cancelRequest) {
      cancelRequest(conversationId);
    }

    setIsAnalyzing(false);
    isAnalyzingRef.current = false;
    setIsStreaming(false);
    isStreamingRef.current = false;
    setStreamingContent('');
    streamingContentRef.current = '';
    setAnalysis(null);
    setStructuredAnalysis(null);
    setError(null);
    setMetrics(null);
    setMessageId(null);
    // Don't reset conversationId - keep it for follow-ups
  }, [conversationId, cancelRequest]);

  // Clear conversation
  const clearConversation = useCallback(() => {
    reset();
    setConversationId(null);
    if (conversationManager && conversationId) {
      conversationManager.clearConversation(conversationId);
    }
  }, [reset, conversationId, conversationManager]);

  return {
    // State
    conversationId,
    isAnalyzing,
    isStreaming,
    streamingContent,
    analysis,
    structuredAnalysis,
    error,
    metrics,
    messageId,
    isConnected,

    // Functions
    invokeTool,
    sendFollowUpMessage,
    reset,
    clearConversation
  };
}
