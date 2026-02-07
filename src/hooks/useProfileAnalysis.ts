import { useCallback } from 'react';
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
    invokeTool,
    sendFollowUpMessage,
    reset,
    clearConversation
  } = useBaseAIAnalysis({
    characterId,
    panelId,
    supportedTools: ['analyze_profile', 'generate_profile'],
    structuredAnalysisMapper: (data: unknown): ProfileStructuredAnalysis => {
      const d = data as any;
      // Extract only the fields we need: score, strengths, weaknesses, improvements
      return {
        score: d.score,
        strengths: d.strengths || [],
        weaknesses: d.weaknesses || [],
        improvements: d.improvements || []
      };
    },
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

    // Functions
    analyzeProfile,
    generateProfile,
    sendFollowUpMessage,
    reset,
    clearConversation
  };
}
