import { useCallback } from 'react';
import { useBaseAIAnalysis } from './useBaseAIAnalysis';

/**
 * Hook for viral post analysis - wraps useBaseAIAnalysis with viral post-specific configuration
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
  // Configure base hook with viral post-specific settings
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
    supportedTools: ['linkedin_post_from_draft', 'linkedin_strategy_from_topic_goal_audience'],
    structuredAnalysisMapper: null, // No mapping needed - pass through raw structured data
    onAnalysisStarted,
    onAnalysisComplete,
    onStreamingStarted,
    onStreamingChunk,
    onError
  });

  // Analyze from draft (Tab 1 - Polish)
  const analyzeFromDraft = useCallback(async (draftPost) => {
    return await invokeTool('linkedin_post_from_draft', {
      draft_post: draftPost
    });
  }, [invokeTool]);

  // Analyze from strategy (Tab 2 - Strategy)
  const analyzeFromStrategy = useCallback(async (topic, goal, audience) => {
    return await invokeTool('linkedin_strategy_from_topic_goal_audience', {
      topic: topic,
      goal: goal,
      audience: audience
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
    analyzeFromDraft,
    analyzeFromStrategy,
    sendFollowUpMessage,
    reset,
    clearConversation
  };
}
