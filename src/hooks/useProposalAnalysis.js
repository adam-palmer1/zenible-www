import { useCallback } from 'react';
import { useBaseAIAnalysis } from './useBaseAIAnalysis';

/**
 * Hook for proposal analysis - wraps useBaseAIAnalysis with proposal-specific configuration
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
  // Configure base hook with proposal-specific settings
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
    supportedTools: ['analyze_proposal'],
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

  // Proposal-specific analysis function
  const analyzeProposal = useCallback(async (jobPost, proposal, platform = 'upwork', metadata = {}) => {
    return await invokeTool('analyze_proposal', {
      job_post: jobPost,
      user_proposal: proposal || null,
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
    analyzeProposal,
    sendFollowUpMessage,
    reset,
    clearConversation
  };
}
