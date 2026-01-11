import { useCallback } from 'react';
import { useBaseAIAnalysis } from './useBaseAIAnalysis';

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
}) {
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
    structuredAnalysisMapper: (data) => {
      // Extract only the fields we need: score, strengths, weaknesses, improvements
      return {
        score: data.score,
        strengths: data.strengths || [],
        weaknesses: data.weaknesses || [],
        improvements: data.improvements || []
      };
    },
    onAnalysisStarted,
    onAnalysisComplete,
    onStreamingStarted,
    onStreamingChunk,
    onError
  });

  // Profile-specific analysis function
  const analyzeProfile = useCallback(async (profile, platform = 'linkedin', metadata = {}) => {
    return await invokeTool('analyze_profile', {
      profile: profile,
      platform: platform
    });
  }, [invokeTool]);

  // Profile generation function
  const generateProfile = useCallback(async (profile, platform = 'linkedin', metadata = {}) => {
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
