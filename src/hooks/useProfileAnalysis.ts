import { useCallback, useMemo } from 'react';
import { useBaseAIAnalysis, UseBaseAIAnalysisReturn } from './useBaseAIAnalysis';

interface ProfileStructuredAnalysis {
  score: unknown;
  strengths: unknown[];
  weaknesses: unknown[];
  improvements: unknown[];
}

interface UseProfileAnalysisConfig {
  characterId: string;
  panelId?: string;
  onAnalysisStarted?: (data: { conversationId: string; toolName: string }) => void;
  onAnalysisComplete?: (data: unknown) => void;
  onStreamingStarted?: (data: { conversationId: string; toolName: string }) => void;
  onStreamingChunk?: (data: { chunk: string; fullContent: string; chunkIndex: number; toolName: string }) => void;
  onError?: (data: { error: string; validationErrors?: unknown[]; toolName?: string }) => void;
}

interface UseProfileAnalysisReturn extends Omit<UseBaseAIAnalysisReturn, 'invokeTool'> {
  analyzeProfile: (profile: string, platform?: string, metadata?: Record<string, unknown>) => Promise<string | null>;
  generateProfile: (profile: string, platform?: string, metadata?: Record<string, unknown>) => Promise<string | null>;
}

/**
 * Hook for profile analysis - wraps useBaseAIAnalysis with profile-specific configuration
 */
export function useProfileAnalysis({
  characterId,
  panelId = 'profile_analyzer',
  onAnalysisStarted,
  onAnalysisComplete,
  onStreamingStarted,
  onStreamingChunk,
  onError
}: UseProfileAnalysisConfig): UseProfileAnalysisReturn {
  // Stable references to avoid recreating registerEventHandlers on every render
  const supportedTools = useMemo(() => ['analyze_profile', 'generate_profile'], []);
  const structuredAnalysisMapper = useCallback((data: unknown): ProfileStructuredAnalysis => {
    const d = data as Record<string, unknown>;
    return {
      score: d.score,
      strengths: (d.strengths as unknown[]) || [],
      weaknesses: (d.weaknesses as unknown[]) || [],
      improvements: (d.improvements as unknown[]) || []
    };
  }, []);

  // Configure base hook with profile-specific settings
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
    setStructuredAnalysis
  } = useBaseAIAnalysis({
    characterId,
    panelId,
    supportedTools,
    structuredAnalysisMapper,
    onAnalysisStarted,
    onAnalysisComplete,
    onStreamingStarted,
    onStreamingChunk,
    onError
  });

  // Profile-specific analysis function
  const analyzeProfile = useCallback(async (profile: string, platform: string = 'linkedin', _metadata: Record<string, unknown> = {}): Promise<string | null> => {
    return await invokeTool('analyze_profile', {
      profile: profile,
      platform: platform
    });
  }, [invokeTool]);

  // Profile generation function
  const generateProfile = useCallback(async (profile: string, platform: string = 'linkedin', _metadata: Record<string, unknown> = {}): Promise<string | null> => {
    return await invokeTool('generate_profile', {
      profile: profile,
      platform: platform
    });
  }, [invokeTool]);

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
    deletingMessageId,

    // Functions
    analyzeProfile,
    generateProfile,
    sendFollowUpMessage,
    deleteMessage,
    reset,
    clearConversation,
    setConversationId,
    setStructuredAnalysis
  };
}
