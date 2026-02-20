import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { WebSocketContext } from '../contexts/WebSocketContext';

interface ChunkEventData {
  chunk: string;
  fullContent: string;
  chunkIndex: number;
  toolName: string;
  messageId: string;
}

interface CompleteEventData {
  fullResponse: string;
  messageId: string;
  toolName: string;
  contentType: string;
  structuredAnalysis: unknown;
  toolExecution: unknown;
  usage: {
    totalTokens: number;
    costCents: number;
    durationMs: number;
  };
}

interface ToolErrorEventData {
  toolName: string;
  error: string;
  validationErrors?: { field: string; message: string }[];
}

interface ErrorEventData {
  error: string;
}

interface ConversationManagerLike {
  clearConversation(conversationId: string): void;
}

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
  setConversationId: (id: string | null) => void;
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

  // Reusable function to register event handlers for a given conversation ID
  const registerEventHandlers = useCallback((convId: string) => {
    // Clear previous handlers
    unsubscribersRef.current.forEach(unsub => unsub());
    unsubscribersRef.current = [];

    // Register event handlers
    const handlers = [
      // Handle streaming chunks
      onConversationEvent(convId, 'chunk', (data: unknown) => {
        const chunkData = data as ChunkEventData;
        // Only handle chunks from supported tools
        if (supportedTools.includes(chunkData.toolName)) {
          setIsStreaming(true);

          const newContent = (chunkData.fullContent || '') as string;
          setStreamingContent(newContent);

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
      onConversationEvent(convId, 'complete', (data: unknown) => {
        const completeData = data as CompleteEventData;
        // Check if this is a response from one of our supported tools
        if (supportedTools.includes(completeData.toolName)) {
          setIsAnalyzing(false);
          setIsStreaming(false);

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
      onConversationEvent(convId, 'tool_error', (data: unknown) => {
        const errorData = data as ToolErrorEventData;
        console.error('[useBaseAIAnalysis] Tool error:', errorData);

        if (supportedTools.includes(errorData.toolName)) {
          setIsAnalyzing(false);
          setIsStreaming(false);

          const errorMessage = errorData.validationErrors && errorData.validationErrors.length > 0
            ? errorData.validationErrors.map((e: { field: string; message: string }) => `${e.field}: ${e.message}`).join(', ')
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
      onConversationEvent(convId, 'error', (data: unknown) => {
        const errorData = data as ErrorEventData;
        console.error('[useBaseAIAnalysis] General error:', errorData);

        setIsAnalyzing(false);
        setIsStreaming(false);
        setError(errorData.error);

        if (callbacksRef.current.onError) {
          callbacksRef.current.onError({ error: errorData.error });
        }
      })
    ];

    unsubscribersRef.current = handlers;
  }, [onConversationEvent, supportedTools, structuredAnalysisMapper]);

  // Setup event handlers when conversationId changes (e.g. from history restore)
  useEffect(() => {
    if (!conversationId || !conversationManager) return;

    registerEventHandlers(conversationId);

    return () => {
      unsubscribersRef.current.forEach(unsub => unsub());
      unsubscribersRef.current = [];
    };
  }, [conversationId, conversationManager, registerEventHandlers]);

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
    setStreamingContent('');

    try {
      setIsAnalyzing(true);

      // Step 1: Create conversation if needed
      let convId = conversationId;
      if (!convId) {
        convId = await createConversation(characterId, panelId, {});
        setConversationId(convId);

        // Register event handlers immediately with local convId
        // instead of waiting for React state to propagate via useEffect
        registerEventHandlers(convId);
      }

      // Step 2: Invoke the tool

      if (callbacksRef.current.onAnalysisStarted) {
        callbacksRef.current.onAnalysisStarted({ conversationId: convId, toolName });
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
      setError((err as Error).message || `Failed to invoke tool: ${toolName}`);

      if (callbacksRef.current.onError) {
        callbacksRef.current.onError({ error: (err as Error).message, toolName });
      }

      return null;
    }
  }, [isConnected, isAnalyzing, conversationId, characterId, panelId, supportedTools, createConversation, invokeToolContext, registerEventHandlers]);

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
    setIsStreaming(false);
    setStreamingContent('');
    setAnalysis(null);
    setStructuredAnalysis(null);
    setError(null);
    setMetrics(null);
    setMessageId(null);
    // Don't reset conversationId - keep it for follow-ups
  }, [conversationId, cancelRequest]);

  // Restore conversation ID (e.g. from history)
  const restoreConversationId = useCallback((id: string | null) => {
    setConversationId(id);
  }, []);

  // Clear conversation
  const clearConversation = useCallback((): void => {
    reset();
    setConversationId(null);
    if (conversationManager && conversationId) {
      (conversationManager as ConversationManagerLike).clearConversation(conversationId);
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
    clearConversation,
    setConversationId: restoreConversationId
  };
}
