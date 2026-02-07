import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { WebSocketContext } from '../contexts/WebSocketContext';

export interface AIAnalysisMetrics {
  totalTokens?: number;
  costCents?: number;
  durationMs?: number;
}

export interface AIAnalysisResult {
  raw: string;
  structured: unknown;
}

export interface BaseAIAnalysisConfig {
  characterId: string;
  panelId: string;
  supportedTools?: string[];
  structuredAnalysisMapper?: ((data: unknown) => unknown) | null;
  onAnalysisStarted?: ((data: { conversationId: string; toolName: string }) => void);
  onAnalysisComplete?: ((data: {
    analysis: AIAnalysisResult;
    messageId: string | null;
    usage: unknown;
    contentType: unknown;
    toolName: string;
  }) => void);
  onStreamingStarted?: ((data: { conversationId: string; toolName: string }) => void);
  onStreamingChunk?: ((data: {
    chunk: string;
    fullContent: string;
    chunkIndex: number;
    toolName: string;
  }) => void);
  onError?: ((data: { error: string; validationErrors?: unknown[]; toolName?: string }) => void);
}

export interface UseBaseAIAnalysisReturn {
  // State
  conversationId: string | null;
  isAnalyzing: boolean;
  isStreaming: boolean;
  streamingContent: string;
  analysis: AIAnalysisResult | null;
  structuredAnalysis: unknown;
  error: string | null;
  metrics: AIAnalysisMetrics | null;
  messageId: string | null;
  isConnected: boolean;

  // Functions
  invokeTool: (toolName: string, toolArguments: Record<string, unknown>) => Promise<string | null>;
  sendFollowUpMessage: (message: string) => Promise<string | null | undefined>;
  reset: () => void;
  clearConversation: () => void;
}

/**
 * Base hook for AI analysis using the new AI tools system
 * Handles the common two-step flow: create conversation, then invoke tool
 *
 * This hook can be wrapped by feature-specific hooks (useProposalAnalysis, useViralPostAnalysis, etc.)
 * to provide a consistent interface for AI tool invocation
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
}: BaseAIAnalysisConfig): UseBaseAIAnalysisReturn {
  // State
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
  const [structuredAnalysis, setStructuredAnalysis] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AIAnalysisMetrics | null>(null);
  const [messageId, setMessageId] = useState<string | null>(null);

  // Refs
  const isAnalyzingRef = useRef<boolean>(false);
  const isStreamingRef = useRef<boolean>(false);
  const streamingContentRef = useRef<string>('');
  const unsubscribersRef = useRef<Array<() => void>>([]);

  // Context
  const {
    isConnected,
    createConversation,
    invokeTool: invokeToolContext,
    sendMessage,
    cancelRequest,
    onConversationEvent,
    conversationManager
  } = useContext(WebSocketContext)!;

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

    // Clear previous handlers
    unsubscribersRef.current.forEach(unsub => unsub());
    unsubscribersRef.current = [];

    // Register event handlers
    const handlers = [
      // Handle streaming chunks
      onConversationEvent(conversationId, 'chunk', (data: unknown) => {
        const chunkData = data as any;
        // Only handle chunks from supported tools
        if (supportedTools.includes(chunkData.toolName)) {
          setIsStreaming(true);
          isStreamingRef.current = true;

          const newContent = (chunkData.fullContent || '') as string;
          setStreamingContent(newContent);
          streamingContentRef.current = newContent;

          if (callbacksRef.current.onStreamingChunk) {
            callbacksRef.current.onStreamingChunk({
              chunk: chunkData.chunk,
              fullContent: newContent,
              chunkIndex: chunkData.chunkIndex,
              toolName: chunkData.toolName
            });
          }
        }
      }),

      // Handle completion
      onConversationEvent(conversationId, 'complete', (data: unknown) => {
        const completeData = data as any;
        // Check if this is a response from one of our supported tools
        if (supportedTools.includes(completeData.toolName)) {
          setIsAnalyzing(false);
          isAnalyzingRef.current = false;
          setIsStreaming(false);
          isStreamingRef.current = false;

          // Set structured analysis if available
          let mappedStructuredAnalysis: unknown = null;

          if (completeData.structuredAnalysis) {
            // Use custom mapper if provided, otherwise use raw data
            mappedStructuredAnalysis = structuredAnalysisMapper
              ? structuredAnalysisMapper(completeData.structuredAnalysis)
              : completeData.structuredAnalysis;

            setStructuredAnalysis(mappedStructuredAnalysis);
            setAnalysis({
              raw: completeData.fullResponse,
              structured: mappedStructuredAnalysis
            });
          } else {
            setAnalysis({
              raw: completeData.fullResponse,
              structured: null
            });
          }

          // Set metrics
          if (completeData.usage) {
            setMetrics({
              totalTokens: completeData.usage.totalTokens,
              costCents: completeData.usage.costCents,
              durationMs: completeData.usage.durationMs
            });
          }

          // Set message ID for rating
          setMessageId(completeData.messageId);

          if (callbacksRef.current.onAnalysisComplete) {
            callbacksRef.current.onAnalysisComplete({
              analysis: {
                raw: completeData.fullResponse,
                structured: mappedStructuredAnalysis
              },
              messageId: completeData.messageId,
              usage: completeData.usage,
              contentType: completeData.contentType,
              toolName: completeData.toolName
            });
          }
        }
      }),

      // Handle tool errors
      onConversationEvent(conversationId, 'tool_error', (data: unknown) => {
        const errorData = data as any;
        console.error('[useBaseAIAnalysis] Tool error:', errorData);

        if (supportedTools.includes(errorData.toolName)) {
          setIsAnalyzing(false);
          isAnalyzingRef.current = false;
          setIsStreaming(false);
          isStreamingRef.current = false;

          const errorMessage = errorData.validationErrors?.length > 0
            ? errorData.validationErrors.map((e: any) => `${e.field}: ${e.message}`).join(', ')
            : errorData.error;

          setError(errorMessage);

          if (callbacksRef.current.onError) {
            callbacksRef.current.onError({
              error: errorMessage,
              validationErrors: errorData.validationErrors,
              toolName: errorData.toolName
            });
          }
        }
      }),

      // Handle general errors
      onConversationEvent(conversationId, 'error', (data: unknown) => {
        const errorData = data as any;
        console.error('[useBaseAIAnalysis] General error:', errorData);

        setIsAnalyzing(false);
        isAnalyzingRef.current = false;
        setIsStreaming(false);
        isStreamingRef.current = false;
        setError(errorData.error);

        if (callbacksRef.current.onError) {
          callbacksRef.current.onError({ error: errorData.error });
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
   */
  const invokeTool = useCallback(async (toolName: string, toolArguments: Record<string, unknown>): Promise<string | null> => {
    if (!isConnected) {
      setError('Not connected to server');
      return null;
    }

    if (isAnalyzing) {
      return null;
    }

    if (!supportedTools.includes(toolName)) {
      console.error('[useBaseAIAnalysis] Unsupported tool:', toolName);
      setError(`Tool '${toolName}' is not supported by this hook`);
      return null;
    }

    // Reset analysis state
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
      setIsAnalyzing(true);
      isAnalyzingRef.current = true;

      // Step 1: Create conversation if needed
      let convId = conversationId;
      if (!convId) {
        convId = await createConversation(characterId, panelId, {});
        setConversationId(convId);
      }

      // Step 2: Invoke the tool

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

      if (callbacksRef.current.onStreamingStarted) {
        callbacksRef.current.onStreamingStarted({ conversationId: convId, toolName });
      }

      return convId;
    } catch (err: unknown) {
      console.error('[useBaseAIAnalysis] Failed to invoke tool:', err);
      setIsAnalyzing(false);
      isAnalyzingRef.current = false;
      setError((err as Error).message || `Failed to invoke tool: ${toolName}`);

      if (callbacksRef.current.onError) {
        callbacksRef.current.onError({ error: (err as Error).message, toolName });
      }

      return null;
    }
  }, [isConnected, isAnalyzing, conversationId, characterId, panelId, supportedTools, createConversation, invokeToolContext]);

  // Send follow-up message
  const sendFollowUpMessage = useCallback(async (message: string): Promise<string | null | undefined> => {
    if (!conversationId) {
      setError('No active conversation');
      return;
    }

    if (!isConnected) {
      setError('Not connected to server');
      return;
    }

    try {
      await sendMessage(conversationId, characterId, message);
      return conversationId;
    } catch (err: unknown) {
      setError((err as Error).message || 'Failed to send message');
      return null;
    }
  }, [conversationId, isConnected, characterId, sendMessage]);

  // Reset function with cancellation
  const reset = useCallback((): void => {
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
  const clearConversation = useCallback((): void => {
    reset();
    setConversationId(null);
    if (conversationManager && conversationId) {
      (conversationManager as any).clearConversation(conversationId);
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
