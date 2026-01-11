import { useCallback } from 'react';
import { useBaseAIAnalysis } from './useBaseAIAnalysis';

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
}) {
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
    clearConversation
  } = useBaseAIAnalysis({
    characterId,
    panelId,
    supportedTools: ['analyze_headline', 'generate_headline'],
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

  // Headline-specific analysis function
  const analyzeHeadline = useCallback(async (headline, platform = 'linkedin', metadata = {}) => {
    return await invokeTool('analyze_headline', {
      headline: headline,
      platform: platform
    });
  }, [invokeTool]);

  // Headline generation function
  const generateHeadline = useCallback(async (headline, platform = 'linkedin', metadata = {}) => {
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
    clearConversation
  };
}
