import { useCallback } from 'react';
import { useBaseAIAnalysis, UseBaseAIAnalysisReturn } from './useBaseAIAnalysis';

interface HeadlineStructuredAnalysis {
  score: unknown;
  strengths: unknown[];
  weaknesses: unknown[];
  improvements: unknown[];
}

interface UseHeadlineAnalysisConfig {
  characterId: string;
  panelId?: string;
  onAnalysisStarted?: (data: { conversationId: string; toolName: string }) => void;
  onAnalysisComplete?: (data: unknown) => void;
  onStreamingStarted?: (data: { conversationId: string; toolName: string }) => void;
  onStreamingChunk?: (data: { chunk: string; fullContent: string; chunkIndex: number; toolName: string }) => void;
  onError?: (data: { error: string; validationErrors?: unknown[]; toolName?: string }) => void;
}

interface UseHeadlineAnalysisReturn extends Omit<UseBaseAIAnalysisReturn, 'invokeTool'> {
  analyzeHeadline: (headline: string, platform?: string, metadata?: Record<string, unknown>) => Promise<string | null>;
  generateHeadline: (headline: string, platform?: string, metadata?: Record<string, unknown>) => Promise<string | null>;
}

/**
 * Hook for headline analysis - wraps useBaseAIAnalysis with headline-specific configuration
 */
export function useHeadlineAnalysis({
  characterId,
  panelId = 'headline_analyzer',
  onAnalysisStarted,
  onAnalysisComplete,
  onStreamingStarted,
  onStreamingChunk,
  onError
}: UseHeadlineAnalysisConfig): UseHeadlineAnalysisReturn {
  // Configure base hook with headline-specific settings
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
    invokeTool,
    sendFollowUpMessage,
    reset,
    clearConversation,
    setConversationId
  } = useBaseAIAnalysis({
    characterId,
    panelId,
    supportedTools: ['analyze_headline', 'generate_headline'],
    structuredAnalysisMapper: (data: unknown): HeadlineStructuredAnalysis => {
      const d = data as Record<string, unknown>;
      // Extract only the fields we need: score, strengths, weaknesses, improvements
      return {
        score: d.score,
        strengths: (d.strengths as unknown[]) || [],
        weaknesses: (d.weaknesses as unknown[]) || [],
        improvements: (d.improvements as unknown[]) || []
      };
    },
    onAnalysisStarted,
    onAnalysisComplete,
    onStreamingStarted,
    onStreamingChunk,
    onError
  });

  // Headline-specific analysis function
  const analyzeHeadline = useCallback(async (headline: string, platform: string = 'linkedin', _metadata: Record<string, unknown> = {}): Promise<string | null> => {
    return await invokeTool('analyze_headline', {
      headline: headline,
      platform: platform
    });
  }, [invokeTool]);

  // Headline generation function
  const generateHeadline = useCallback(async (headline: string, platform: string = 'linkedin', _metadata: Record<string, unknown> = {}): Promise<string | null> => {
    return await invokeTool('generate_headline', {
      headline: headline,
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

    // Functions
    analyzeHeadline,
    generateHeadline,
    sendFollowUpMessage,
    reset,
    clearConversation,
    setConversationId
  };
}
