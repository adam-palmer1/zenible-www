import { useCallback, useMemo } from 'react';
import { useBaseAIAnalysis, UseBaseAIAnalysisReturn } from './useBaseAIAnalysis';

interface UseHookGeneratorConfig {
  characterId: string;
  panelId?: string;
  onAnalysisStarted?: (data: { conversationId: string; toolName: string }) => void;
  onAnalysisComplete?: (data: unknown) => void;
  onStreamingStarted?: (data: { conversationId: string; toolName: string }) => void;
  onStreamingChunk?: (data: { chunk: string; fullContent: string; chunkIndex: number; toolName: string }) => void;
  onError?: (data: { error: string; validationErrors?: unknown[]; toolName?: string }) => void;
}

interface UseHookGeneratorReturn extends Omit<UseBaseAIAnalysisReturn, 'invokeTool'> {
  generateHooks: (description: string, audience?: string, goal?: string) => Promise<string | null>;
}

export function useHookGenerator({
  characterId,
  panelId = 'hook_generator',
  onAnalysisStarted,
  onAnalysisComplete,
  onStreamingStarted,
  onStreamingChunk,
  onError,
}: UseHookGeneratorConfig): UseHookGeneratorReturn {
  const supportedTools = useMemo(() => ['generate_hooks'], []);

  const {
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
    deletingMessageId,
    invokeTool,
    sendFollowUpMessage,
    deleteMessage,
    reset,
    clearConversation,
    setConversationId,
    setStructuredAnalysis,
  } = useBaseAIAnalysis({
    characterId,
    panelId,
    supportedTools,
    structuredAnalysisMapper: null,
    onAnalysisStarted,
    onAnalysisComplete,
    onStreamingStarted,
    onStreamingChunk,
    onError,
  });

  const generateHooks = useCallback(
    async (description: string, audience?: string, goal?: string): Promise<string | null> => {
      return await invokeTool('generate_hooks', {
        description,
        audience: audience || '',
        goal: goal || '',
      });
    },
    [invokeTool],
  );

  return {
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
    deletingMessageId,
    generateHooks,
    sendFollowUpMessage,
    deleteMessage,
    reset,
    clearConversation,
    setConversationId,
    setStructuredAnalysis,
  };
}
