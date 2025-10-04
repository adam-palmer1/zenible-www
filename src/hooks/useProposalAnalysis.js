import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { WebSocketContext } from '../contexts/WebSocketContext';

/**
 * Hook for proposal analysis using the new AI tools system
 * Handles the two-step flow: create conversation, then invoke tool
 */
export function useProposalAnalysis({
  characterId,
  panelId = 'proposal_wizard',
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
    invokeTool,
    sendMessage,
    cancelRequest,
    mapPanelToConversation,
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

    console.log('[useProposalAnalysis] Setting up event handlers for conversation:', conversationId);

    // Clear previous handlers
    unsubscribersRef.current.forEach(unsub => unsub());
    unsubscribersRef.current = [];

    // Register event handlers
    const handlers = [
      // Handle streaming chunks
      onConversationEvent(conversationId, 'chunk', (data) => {
        console.log('[useProposalAnalysis] Received chunk:', {
          toolName: data.toolName,
          chunkLength: data.chunk?.length,
          chunkIndex: data.chunkIndex
        });

        // Only handle proposal analysis chunks
        if (data.toolName === 'analyze_proposal' || !data.toolName) {
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
        console.log('[useProposalAnalysis] Analysis complete:', {
          toolName: data.toolName,
          hasStructured: !!data.structuredAnalysis,
          contentType: data.contentType
        });

        setIsAnalyzing(false);
        isAnalyzingRef.current = false;
        setIsStreaming(false);
        isStreamingRef.current = false;

        // Check if this is a proposal analysis response
        if (data.toolName === 'analyze_proposal') {
          // Set structured analysis if available
          let mappedStructuredAnalysis = null;

          if (data.structuredAnalysis) {
            // Map backend field names to frontend expected names
            mappedStructuredAnalysis = {
              ...data.structuredAnalysis,
              // Map 'weaknesses' from backend to 'improvements' expected by frontend
              improvements: data.structuredAnalysis.weaknesses || data.structuredAnalysis.improvements || [],
              // Map 'recommendations' from backend to 'suggestions' expected by frontend
              suggestions: data.structuredAnalysis.recommendations || data.structuredAnalysis.suggestions || []
            };

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
        console.error('[useProposalAnalysis] Tool error:', data);

        if (data.toolName === 'analyze_proposal') {
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
        console.error('[useProposalAnalysis] General error:', data);

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

    // Map panel to conversation for UI routing
    if (panelId) {
      mapPanelToConversation(panelId, conversationId);
    }

    return () => {
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };
  }, [conversationId, conversationManager, onConversationEvent, mapPanelToConversation, panelId]);

  // Analyze proposal function
  const analyzeProposal = useCallback(async (jobPost, proposal, platform = 'upwork', metadata = {}) => {
    if (!isConnected) {
      setError('Not connected to server');
      return null;
    }

    if (isAnalyzing) {
      console.log('[useProposalAnalysis] Already analyzing');
      return null;
    }

    // Reset state
    setError(null);
    setAnalysis(null);
    setStructuredAnalysis(null);
    setMetrics(null);
    setMessageId(null);
    setIsStreaming(false);
    isStreamingRef.current = false;
    setStreamingContent('');
    streamingContentRef.current = '';

    try {
      console.log('[useProposalAnalysis] Starting analysis...');
      setIsAnalyzing(true);
      isAnalyzingRef.current = true;

      // Step 1: Create conversation if needed
      let convId = conversationId;
      if (!convId) {
        console.log('[useProposalAnalysis] Creating new conversation...');
        convId = await createConversation(characterId, 'proposal_wizard', {});
        setConversationId(convId);
        console.log('[useProposalAnalysis] Conversation created:', convId);

        // Map panel to conversation
        if (panelId) {
          mapPanelToConversation(panelId, convId);
        }
      }

      // Step 2: Invoke the analyze_proposal tool
      console.log('[useProposalAnalysis] Invoking analyze_proposal tool...');

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
        'analyze_proposal',
        {
          job_post: jobPost,
          user_proposal: proposal || null,
          platform: platform
        }
      );

      console.log('[useProposalAnalysis] Tool invoked successfully');

      if (callbacksRef.current.onStreamingStarted) {
        callbacksRef.current.onStreamingStarted({ conversationId: convId });
      }

      return convId;
    } catch (error) {
      console.error('[useProposalAnalysis] Failed to analyze proposal:', error);
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
      setError(error.message || 'Failed to analyze proposal');

      if (callbacksRef.current.onError) {
        callbacksRef.current.onError({ error: error.message });
      }

      return null;
    }
  }, [isConnected, isAnalyzing, conversationId, characterId, createConversation, invokeTool, mapPanelToConversation, panelId]);

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
      console.log('[useProposalAnalysis] Sending follow-up message...');
      await sendMessage(conversationId, characterId, message);
      return conversationId;
    } catch (error) {
      console.error('[useProposalAnalysis] Failed to send message:', error);
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
    analyzeProposal,
    sendFollowUpMessage,
    reset,
    clearConversation
  };
}