import { useCallback } from 'react';
import { useBaseAIAnalysis, UseBaseAIAnalysisReturn } from './useBaseAIAnalysis';

interface ProposalStructuredAnalysis {
  score: unknown;
  strengths: unknown[];
  weaknesses: unknown[];
  improvements: unknown[];
}

interface UseProposalAnalysisConfig {
  characterId: string;
  panelId?: string;
  onAnalysisStarted?: (data: { conversationId: string; toolName: string }) => void;
  onAnalysisComplete?: (data: unknown) => void;
  onStreamingStarted?: (data: { conversationId: string; toolName: string }) => void;
  onStreamingChunk?: (data: { chunk: string; fullContent: string; chunkIndex: number; toolName: string }) => void;
  onError?: (data: { error: string; validationErrors?: unknown[]; toolName?: string }) => void;
}

interface UseProposalAnalysisReturn extends Omit<UseBaseAIAnalysisReturn, 'invokeTool'> {
  analyzeProposal: (jobPost: string, proposal: string, platform?: string, metadata?: Record<string, unknown>) => Promise<string | null>;
  generateProposal: (jobPost: string, platform?: string, metadata?: Record<string, unknown>) => Promise<string | null>;
}

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
}: UseProposalAnalysisConfig): UseProposalAnalysisReturn {
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
    supportedTools: ['analyze_proposal', 'generate_proposal'],
    structuredAnalysisMapper: (data: unknown): ProposalStructuredAnalysis => {
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

  // Proposal-specific analysis function
  const analyzeProposal = useCallback(async (jobPost: string, proposal: string, platform: string = 'upwork', _metadata: Record<string, unknown> = {}): Promise<string | null> => {
    return await invokeTool('analyze_proposal', {
      job_post: jobPost,
      user_proposal: proposal,
      platform: platform
    });
  }, [invokeTool]);

  // Proposal generation function
  const generateProposal = useCallback(async (jobPost: string, platform: string = 'upwork', _metadata: Record<string, unknown> = {}): Promise<string | null> => {
    return await invokeTool('generate_proposal', {
      job_post: jobPost,
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
    generateProposal,
    sendFollowUpMessage,
    reset,
    clearConversation
  };
}
