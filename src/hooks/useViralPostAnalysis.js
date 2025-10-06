import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { WebSocketContext } from '../contexts/WebSocketContext';

/**
 * Hook for viral post analysis using the new AI tools system
 * Supports two tools:
 * - linkedin_post_from_draft (Polish tab)
 * - linkedin_strategy_from_topic_goal_audience (Strategy tab)
 */
export function useViralPostAnalysis({
  characterId,
  panelId = 'viral_post_generator',
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
  const [currentTool, setCurrentTool] = useState(null);

  // Refs
  const isAnalyzingRef = useRef(false);
  const isStreamingRef = useRef(false);
  const streamingContentRef = useRef('');
  const unsubscribersRef = useRef([]);

  // Context
  const {
    isConnected,
    createConversation,
    invokeTool,
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

    console.log('[useViralPostAnalysis] Setting up event handlers for conversation:', conversationId);

    // Clear previous handlers
    unsubscribersRef.current.forEach(unsub => unsub());
    unsubscribersRef.current = [];

    // Register event handlers
    const handlers = [
      // Handle streaming chunks
      onConversationEvent(conversationId, 'chunk', (data) => {
        console.log('[useViralPostAnalysis] Received chunk:', {
          toolName: data.toolName,
          chunkLength: data.chunk?.length,
          chunkIndex: data.chunkIndex
        });

        // Handle chunks from both viral post tools
        if (data.toolName === 'linkedin_post_from_draft' || data.toolName === 'linkedin_strategy_from_topic_goal_audience') {
          setIsStreaming(true);
          isStreamingRef.current = true;

          const newContent = data.fullContent || '';
          setStreamingContent(newContent);
          streamingContentRef.current = newContent;

          if (callbacksRef.current.onStreamingChunk) {
            callbacksRef.current.onStreamingChunk({
              chunk: data.chunk,
              fullContent: newContent,
              chunkIndex: data.chunkIndex
            });
          }
        }
      }),

      // Handle completion
      onConversationEvent(conversationId, 'complete', (data) => {
        console.log('[useViralPostAnalysis] Analysis complete:', {
          toolName: data.toolName,
          hasStructured: !!data.structuredAnalysis,
          contentType: data.contentType
        });

        // Check if this is a viral post tool response
        if (data.toolName === 'linkedin_post_from_draft' || data.toolName === 'linkedin_strategy_from_topic_goal_audience') {
          setIsAnalyzing(false);
          isAnalyzingRef.current = false;
          setIsStreaming(false);
          isStreamingRef.current = false;

          // Set structured analysis if available
          let mappedStructuredAnalysis = null;

          if (data.structuredAnalysis) {
            mappedStructuredAnalysis = data.structuredAnalysis;
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
              contentType: data.contentType
            });
          }
        }
      }),

      // Handle tool errors
      onConversationEvent(conversationId, 'tool_error', (data) => {
        console.error('[useViralPostAnalysis] Tool error:', data);

        if (data.toolName === 'linkedin_post_from_draft' || data.toolName === 'linkedin_strategy_from_topic_goal_audience') {
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
              validationErrors: data.validationErrors
            });
          }
        }
      }),

      // Handle general errors
      onConversationEvent(conversationId, 'error', (data) => {
        console.error('[useViralPostAnalysis] General error:', data);

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
  }, [conversationId, conversationManager, onConversationEvent]);

  // Analyze from draft (Tab 1)
  const analyzeFromDraft = useCallback(async (draftPost) => {
    if (!isConnected) {
      setError('Not connected to server');
      return null;
    }

    if (isAnalyzing) {
      console.log('[useViralPostAnalysis] Already analyzing');
      return null;
    }

    // Reset analysis state
    console.log('[useViralPostAnalysis] Resetting analysis state for new analysis');
    setError(null);
    setAnalysis(null);
    setStructuredAnalysis(null);
    setMessageId(null);
    setMetrics(null);
    setIsStreaming(false);
    isStreamingRef.current = false;
    setStreamingContent('');
    streamingContentRef.current = '';
    setCurrentTool('linkedin_post_from_draft');

    try {
      console.log('[useViralPostAnalysis] Starting draft analysis...');
      setIsAnalyzing(true);
      isAnalyzingRef.current = true;

      // Step 1: Create conversation if needed
      let convId = conversationId;
      if (!convId) {
        console.log('[useViralPostAnalysis] Creating new conversation...');
        convId = await createConversation(characterId, panelId, {});
        setConversationId(convId);
        console.log('[useViralPostAnalysis] Conversation created:', convId);
      }

      // Step 2: Invoke the linkedin_post_from_draft tool
      console.log('[useViralPostAnalysis] Invoking linkedin_post_from_draft tool...');

      if (callbacksRef.current.onAnalysisStarted) {
        callbacksRef.current.onAnalysisStarted({ conversationId: convId });
      }

      // Wait a moment for event handlers to be set up if conversation was just created
      if (!conversationId) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await invokeTool(
        convId,
        characterId,
        'linkedin_post_from_draft',
        {
          draft_post: draftPost
        }
      );

      console.log('[useViralPostAnalysis] Tool invoked successfully');

      if (callbacksRef.current.onStreamingStarted) {
        callbacksRef.current.onStreamingStarted({ conversationId: convId });
      }

      return convId;
    } catch (error) {
      console.error('[useViralPostAnalysis] Failed to analyze draft:', error);
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
      setError(error.message || 'Failed to analyze draft post');

      if (callbacksRef.current.onError) {
        callbacksRef.current.onError({ error: error.message });
      }

      return null;
    }
  }, [isConnected, isAnalyzing, conversationId, characterId, panelId, createConversation, invokeTool]);

  // Analyze from strategy (Tab 2)
  const analyzeFromStrategy = useCallback(async (topic, goal, audience) => {
    if (!isConnected) {
      setError('Not connected to server');
      return null;
    }

    if (isAnalyzing) {
      console.log('[useViralPostAnalysis] Already analyzing');
      return null;
    }

    // Reset analysis state
    console.log('[useViralPostAnalysis] Resetting analysis state for new analysis');
    setError(null);
    setAnalysis(null);
    setStructuredAnalysis(null);
    setMessageId(null);
    setMetrics(null);
    setIsStreaming(false);
    isStreamingRef.current = false;
    setStreamingContent('');
    streamingContentRef.current = '';
    setCurrentTool('linkedin_strategy_from_topic_goal_audience');

    try {
      console.log('[useViralPostAnalysis] Starting strategy analysis...');
      setIsAnalyzing(true);
      isAnalyzingRef.current = true;

      // Step 1: Create conversation if needed
      let convId = conversationId;
      if (!convId) {
        console.log('[useViralPostAnalysis] Creating new conversation...');
        convId = await createConversation(characterId, panelId, {});
        setConversationId(convId);
        console.log('[useViralPostAnalysis] Conversation created:', convId);
      }

      // Step 2: Invoke the linkedin_strategy_from_topic_goal_audience tool
      console.log('[useViralPostAnalysis] Invoking linkedin_strategy_from_topic_goal_audience tool...');

      if (callbacksRef.current.onAnalysisStarted) {
        callbacksRef.current.onAnalysisStarted({ conversationId: convId });
      }

      // Wait a moment for event handlers to be set up if conversation was just created
      if (!conversationId) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      await invokeTool(
        convId,
        characterId,
        'linkedin_strategy_from_topic_goal_audience',
        {
          topic: topic,
          goal: goal,
          audience: audience
        }
      );

      console.log('[useViralPostAnalysis] Tool invoked successfully');

      if (callbacksRef.current.onStreamingStarted) {
        callbacksRef.current.onStreamingStarted({ conversationId: convId });
      }

      return convId;
    } catch (error) {
      console.error('[useViralPostAnalysis] Failed to analyze strategy:', error);
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
      setError(error.message || 'Failed to analyze strategy');

      if (callbacksRef.current.onError) {
        callbacksRef.current.onError({ error: error.message });
      }

      return null;
    }
  }, [isConnected, isAnalyzing, conversationId, characterId, panelId, createConversation, invokeTool]);

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
      console.log('[useViralPostAnalysis] Sending follow-up message...');
      await sendMessage(conversationId, characterId, message);
      return conversationId;
    } catch (error) {
      console.error('[useViralPostAnalysis] Failed to send message:', error);
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
    setCurrentTool(null);
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
    currentTool,
    isConnected,

    // Functions
    analyzeFromDraft,
    analyzeFromStrategy,
    sendFollowUpMessage,
    reset,
    clearConversation
  };
}
