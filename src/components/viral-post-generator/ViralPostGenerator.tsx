import React, { useState, useEffect, useContext } from 'react';
import AppLayout from '../layout/AppLayout';
import logger from '../../utils/logger';
import DraftPostSection from './DraftPostSection';
import StrategyInputSection from './StrategyInputSection';
import PlatformSelector from '../proposal-wizard/PlatformSelector';
import AIFeedbackSection from '../shared/AIFeedbackSection';
import type { MetricsData } from '../shared/ai-feedback/types';
import PersonalizeAIBanner from '../shared/PersonalizeAIBanner';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useViralPostAnalysis } from '../../hooks/useViralPostAnalysis';
import { WebSocketContext, WebSocketContextValue } from '../../contexts/WebSocketContext';
import { useAuth } from '../../contexts/AuthContext';
import aiCharacterAPI from '../../services/aiCharacterAPI';
import userAPI from '../../services/userAPI';
import { getCharacterTools } from '../../services/toolDiscoveryAPI';
import UsageLimitBadge from '../ui/UsageLimitBadge';

interface AICharacter {
  id: string;
  name: string;
  internal_name?: string;
  avatar_url: string | null;
  description?: string;
}

interface UserFeatures {
  viral_post_generator?: { enabled?: boolean };
  system_features?: { viral_post_generator_model?: string[] };
  [key: string]: unknown;
}

interface ViralPostFeedback {
  isProcessing: boolean;
  analysis?: { raw?: string; structured?: unknown } | null;
  structured?: unknown;
  raw?: string;
  messageId?: string;
  usage?: unknown;
  contentType?: unknown;
  error?: string;
}

interface AnalysisHistoryEntry {
  role: string;
  type: string;
  content: string;
  structured?: unknown;
  messageId?: string;
  usage?: unknown;
  timestamp: string;
}

interface FollowUpMessageEntry {
  role: string;
  content: string;
  timestamp: string;
  messageId?: string;
  usage?: unknown;
}

interface WebSocketChunkData {
  toolName?: string;
  fullContent?: string;
}

interface WebSocketCompleteData {
  toolName?: string;
  fullResponse?: string;
  messageId?: string;
  usage?: unknown;
}

interface WebSocketErrorData {
  error?: string;
  [key: string]: unknown;
}

export default function ViralPostGenerator() {
  const { darkMode } = usePreferences();
  useAuth();

  // Tab state
  const [activeTab, setActiveTab] = useState('polish'); // 'polish' or 'strategy'

  // State for Polish tab
  const [draftPost, setDraftPost] = useState('');

  // State for Strategy tab
  const [topic, setTopic] = useState('');
  const [goal, setGoal] = useState('');
  const [audience, setAudience] = useState('');

  // Common state
  const [platformFocus, setPlatformFocus] = useState('');
  const [feedback, setFeedback] = useState<ViralPostFeedback | null>(null);
  const [_availableCharacters, setAvailableCharacters] = useState<AICharacter[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [selectedCharacterName, setSelectedCharacterName] = useState('');
  const [selectedCharacterAvatar, setSelectedCharacterAvatar] = useState<string | null>(null);
  const [selectedCharacterDescription, setSelectedCharacterDescription] = useState('');
  const [, setLoadingCharacters] = useState(true);
  const [, setUserFeatures] = useState<UserFeatures | null>(null);
  const [, setFeatureEnabled] = useState(true);
  const [followUpMessages, setFollowUpMessages] = useState<FollowUpMessageEntry[]>([]);
  const [isFollowUpStreaming, setIsFollowUpStreaming] = useState(false);
  const [followUpStreamingContent, setFollowUpStreamingContent] = useState('');
  const [, setCharacterTools] = useState<Awaited<ReturnType<typeof getCharacterTools>> | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryEntry[]>([]);

  // Get WebSocket context
  const {
    isConnected,
    onConversationEvent
  } = useContext(WebSocketContext) as WebSocketContextValue;

  // Use Viral Post Analysis hook
  const {
    conversationId,
    isAnalyzing: analyzing,
    isStreaming,
    streamingContent,
    analysis,
    structuredAnalysis,
    error: _analysisError,
    messageId,
    analyzeFromDraft,
    analyzeFromStrategy,
    sendFollowUpMessage: sendFollowUp,
    clearConversation,
    reset: resetAnalysis,
    deleteMessage,
    deletingMessageId,
  } = useViralPostAnalysis({
    characterId: selectedCharacterId || '',
    panelId: 'viral_post_generator',
    onAnalysisStarted: (_data: { conversationId: string; toolName: string }) => {
      setFeedback({
        isProcessing: true,
        analysis: null
      });
    },
    onAnalysisComplete: (data: unknown) => {
      const result = data as { analysis?: { raw?: string; structured?: unknown }; messageId?: string; usage?: unknown; contentType?: unknown };
      // Set current feedback
      setFeedback({
        isProcessing: false,
        analysis: result.analysis,
        structured: result.analysis?.structured,
        raw: result.analysis?.raw,
        messageId: result.messageId,
        usage: result.usage,
        contentType: result.contentType
      });

      // Add to analysis history
      const newAnalysis: AnalysisHistoryEntry = {
        role: 'assistant',
        type: 'analysis',
        content: result.analysis?.raw || '',
        structured: result.analysis?.structured,
        messageId: result.messageId,
        usage: result.usage,
        timestamp: new Date().toISOString()
      };
      setAnalysisHistory(prev => [...prev, newAnalysis]);
    },
    onStreamingChunk: (_data: { chunk: string; fullContent: string; chunkIndex: number; toolName: string }) => {
      // Optional: handle streaming chunks if needed
    },
    onError: (error: { error: string; validationErrors?: unknown[]; toolName?: string }) => {
      logger.error('[ViralPostGenerator] Analysis error:', error);
      setFeedback({
        isProcessing: false,
        error: error.error || 'An error occurred during analysis'
      });
    }
  });

  // Setup follow-up message event handlers
  useEffect(() => {
    if (!conversationId || !onConversationEvent) return;

    const unsubscribers: Array<() => void> = [];

    // Handle follow-up message chunks
    unsubscribers.push(
      onConversationEvent(conversationId, 'chunk', (...args: unknown[]) => {
        const data = args[0] as WebSocketChunkData;
        // Only handle non-tool responses (regular messages)
        if (!data.toolName) {
          setIsFollowUpStreaming(true);
          setFollowUpStreamingContent(data.fullContent || '');
        }
      })
    );

    // Handle follow-up message completion
    unsubscribers.push(
      onConversationEvent(conversationId, 'complete', (...args: unknown[]) => {
        const data = args[0] as WebSocketCompleteData;
        // Only handle non-tool responses (regular messages)
        if (!data.toolName) {
          setIsFollowUpStreaming(false);
          setFollowUpStreamingContent('');

          // Add completed message to follow-up messages
          setFollowUpMessages(prev => [...prev, {
            role: 'assistant',
            content: data.fullResponse || '',
            timestamp: new Date().toISOString(),
            messageId: data.messageId,
            usage: data.usage
          }]);
        }
      })
    );

    // Handle errors
    unsubscribers.push(
      onConversationEvent(conversationId, 'error', (...args: unknown[]) => {
        const data = args[0] as WebSocketErrorData;
        logger.error('[ViralPostGenerator] Follow-up error:', data);
        setIsFollowUpStreaming(false);
        setFollowUpStreamingContent('');
      })
    );

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [conversationId, onConversationEvent]);

  // Load user features
  useEffect(() => {
    const loadUserFeatures = async () => {
      try {
        const features = await userAPI.getCurrentUserFeatures() as UserFeatures;
        setUserFeatures(features);
        const isEnabled = features?.viral_post_generator?.enabled ?? true;
        setFeatureEnabled(isEnabled);
      } catch (error) {
        logger.error('Failed to load user features:', error);
        setFeatureEnabled(true);
      }
    };

    loadUserFeatures();
  }, []);

  // Load AI characters
  useEffect(() => {
    const loadCharacters = async () => {
      try {
        setLoadingCharacters(true);

        // Get user features to see which characters are available
        const userFeatures = await userAPI.getCurrentUserFeatures() as UserFeatures;
        const allowedCharacterNames = userFeatures?.system_features?.viral_post_generator_model || [];

        // Get all characters
        const characters = await aiCharacterAPI.getUserCharacters() as AICharacter[];

        // Filter characters based on what's allowed
        let filteredCharacters = characters;
        if (allowedCharacterNames.length > 0) {
          filteredCharacters = characters.filter((char: AICharacter) =>
            allowedCharacterNames.includes(char.internal_name || '') ||
            allowedCharacterNames.includes(char.name.toLowerCase())
          );
        }

        setAvailableCharacters(filteredCharacters);

        if (filteredCharacters.length > 0 && !selectedCharacterId) {
          const defaultChar = filteredCharacters[0];
          setSelectedCharacterId(defaultChar.id);
          setSelectedCharacterName(defaultChar.name);
          setSelectedCharacterAvatar(defaultChar.avatar_url);
          setSelectedCharacterDescription(defaultChar.description || '');
        }
      } catch (error) {
        logger.error('Failed to load AI characters:', error);

        // Fallback: load all characters
        try {
          const characters = await aiCharacterAPI.getUserCharacters() as AICharacter[];
          setAvailableCharacters(characters);

          if (characters.length > 0 && !selectedCharacterId) {
            const defaultChar = characters[0];
            setSelectedCharacterId(defaultChar.id);
            setSelectedCharacterName(defaultChar.name);
            setSelectedCharacterAvatar(defaultChar.avatar_url);
            setSelectedCharacterDescription(defaultChar.description || '');
          }
        } catch (fallbackError) {
          logger.error('Failed to load characters even in fallback:', fallbackError);
          setAvailableCharacters([]);
        }
      } finally {
        setLoadingCharacters(false);
      }
    };

    loadCharacters();
  }, []);

  // Load character tools when character is selected
  useEffect(() => {
    const loadTools = async () => {
      if (!selectedCharacterId) return;

      try {
        const tools = await getCharacterTools(selectedCharacterId);
        setCharacterTools(tools);

        // Check if character has the required tools
        const hasPolishTool = tools.available_tools?.some(
          (tool) => tool.name === 'linkedin_post_from_draft' && tool.is_enabled
        );
        const hasStrategyTool = tools.available_tools?.some(
          (tool) => tool.name === 'linkedin_strategy_from_topic_goal_audience' && tool.is_enabled
        );

        if (!hasPolishTool) {
          logger.warn('[ViralPostGenerator] Character does not have linkedin_post_from_draft tool');
        }
        if (!hasStrategyTool) {
          logger.warn('[ViralPostGenerator] Character does not have linkedin_strategy_from_topic_goal_audience tool');
        }
      } catch (error) {
        logger.error('[ViralPostGenerator] Failed to load character tools:', error);
      }
    };

    loadTools();
  }, [selectedCharacterId]);

  // Handle character selection
  const _handleCharacterSelect = (character: AICharacter) => {
    setSelectedCharacterId(character.id);
    setSelectedCharacterName(character.name);
    setSelectedCharacterAvatar(character.avatar_url);
    setSelectedCharacterDescription(character.description || '');

    // Clear conversation when switching characters
    if (conversationId) {
      clearConversation();
      setFollowUpMessages([]);
      setFeedback(null);
      setAnalysisHistory([]);
    }
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Clear state when switching tabs
    setFeedback(null);
    setFollowUpStreamingContent('');
  };

  // Handle analysis
  const handleAnalyze = async () => {
    if (!selectedCharacterId) {
      return;
    }

    if (!isConnected) {
      setFeedback({
        isProcessing: false,
        error: 'Not connected to server. Please refresh the page.'
      });
      return;
    }

    try {
      // Save current feedback to history before clearing (if not already saved)
      if (feedback && feedback.messageId && !feedback.isProcessing) {
        const isAlreadyInHistory = analysisHistory.some((a) => a.messageId === feedback.messageId);
        if (!isAlreadyInHistory) {
          const previousAnalysis: AnalysisHistoryEntry = {
            role: 'assistant',
            type: 'analysis',
            content: feedback.raw || feedback.analysis?.raw || '',
            structured: feedback.structured || feedback.analysis?.structured,
            messageId: feedback.messageId,
            usage: feedback.usage,
            timestamp: new Date().toISOString()
          };
          setAnalysisHistory(prev => [...prev, previousAnalysis]);
        }
      }

      // Clear previous analysis
      setFeedback(null);
      setFollowUpStreamingContent('');

      if (activeTab === 'polish') {
        if (!draftPost) {
          return;
        }

        await analyzeFromDraft(draftPost);
      } else {
        if (!topic || !goal || !audience) {
          return;
        }

        await analyzeFromStrategy(topic, goal, audience);
      }
    } catch (_error) {
      setFeedback({
        isProcessing: false,
        error: 'Failed to analyze. Please try again.'
      });
    }
  };

  // Handle follow-up message sending
  const handleSendFollowUpMessage = async (message: string) => {
    if (!conversationId || !selectedCharacterId) {
      throw new Error('Cannot send message - missing required data');
    }

    if (!isConnected) {
      throw new Error('Not connected to server');
    }

    await sendFollowUp(message);
  };

  return (
    <AppLayout pageTitle="Content" rawContent>
      <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
        <div className={`border-b flex-shrink-0 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-neutral-200 bg-white'} px-4 py-3`}>
          <div className="flex items-center justify-between">
            <h1 className={`text-2xl font-semibold ${darkMode ? 'text-gray-100' : 'text-zinc-950'}`}>
              Viral Post Generator
            </h1>
            <UsageLimitBadge
              characterId={selectedCharacterId ?? undefined}
              aiUsage={true}
              variant="compact"
              showUpgradeLink={true}
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* Personalize AI Banner */}
        <div className="px-4 pt-4 flex-shrink-0">
          <PersonalizeAIBanner darkMode={darkMode} />
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 overflow-hidden p-4">
          <div className="flex gap-4 h-full">
            {/* Left Panel - Inputs */}
            <div className="w-[614px] flex flex-col gap-4 min-h-0">
              {/* Choose Your Platform */}
              <div className="flex-shrink-0">
                <PlatformSelector
                  darkMode={darkMode}
                  selectedPlatform={platformFocus}
                  setSelectedPlatform={setPlatformFocus}
                  characterId={selectedCharacterId}
                />
              </div>

              {/* Action Buttons — switch mode + analyze */}
              <div className={`rounded-xl border shadow-sm p-3 sm:p-4 flex-shrink-0 ${
                darkMode ? 'bg-[#1e1e1e] border-[#333333]' : 'bg-white border-neutral-200'
              }`}>
                <div className="flex flex-wrap gap-2">
                  {([
                    { mode: 'polish', label: 'Rewrite Post' },
                    { mode: 'strategy', label: 'Build Content Strategy' },
                  ] as const).map(({ mode, label }) => {
                    const isActive = activeTab === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => handleTabChange(mode)}
                        disabled={analyzing}
                        className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl transition-all text-sm sm:text-base ${
                          isActive
                            ? 'bg-white border-[1.5px] border-[#a684ff] shadow-[0px_0px_0px_2.5px_#ddd6ff]'
                            : darkMode
                              ? 'bg-[#2d2d2d] border border-[#4a4a4a] hover:bg-[#3a3a3a]'
                              : 'bg-white border border-neutral-200 hover:bg-gray-50'
                        } ${analyzing ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        <span className={`font-inter font-medium whitespace-nowrap ${
                          darkMode && !isActive ? 'text-white' : 'text-zinc-950'
                        }`}>
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Purple dashed container wrapping the active tab content */}
              <div className={`rounded-xl border border-dashed shadow-sm flex flex-col p-3 sm:p-4 gap-4 ${
                activeTab === 'polish' ? 'flex-1 min-h-0' : 'flex-shrink-0'
              } ${
                darkMode
                  ? 'bg-[#4c3d7a] border-[#6b5b95]'
                  : 'bg-violet-50 border-[#c4b4ff]'
              }`}>
                {activeTab === 'polish' ? (
                  <DraftPostSection
                    draftPost={draftPost}
                    setDraftPost={setDraftPost}
                    disabled={analyzing}
                  />
                ) : (
                  <StrategyInputSection
                    topic={topic}
                    setTopic={setTopic}
                    goal={goal}
                    setGoal={setGoal}
                    audience={audience}
                    setAudience={setAudience}
                    disabled={analyzing}
                  />
                )}

                <div className="pt-3 sm:pt-4 flex justify-end flex-shrink-0">
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing || !isConnected}
                    className={`px-4 sm:px-6 py-2.5 sm:py-3 bg-zenible-primary text-white rounded-xl font-inter font-medium text-sm sm:text-base transition-all ${
                      analyzing || !isConnected ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-600'
                    }`}
                  >
                    {analyzing
                      ? 'Analyzing...'
                      : activeTab === 'polish' ? 'Write Post' : 'Build Strategy'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Panel - AI Feedback */}
            <div className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
              <AIFeedbackSection
                isStreaming={isStreaming}
                streamingContent={streamingContent}
                rawAnalysis={analysis?.raw || ''}
                structuredAnalysis={structuredAnalysis}
                feedback={feedback ? { ...feedback, analysis: feedback.analysis ?? undefined } : null}
                analyzing={analyzing}
                isProcessing={feedback?.isProcessing || false}
                metrics={null}
                usage={(feedback?.usage as MetricsData) ?? null}
                conversationId={conversationId || ''}
                messageId={messageId || ''}
                onCancel={resetAnalysis}
                onSendMessage={handleSendFollowUpMessage}
                onDeleteMessage={deleteMessage}
                deletingMessageId={deletingMessageId}
                characterId={selectedCharacterId || ''}
                characterAvatarUrl={selectedCharacterAvatar ?? undefined}
                characterName={selectedCharacterName}
                characterDescription={selectedCharacterDescription}
                isFollowUpStreaming={isFollowUpStreaming}
                followUpStreamingContent={followUpStreamingContent}
                followUpMessages={followUpMessages}
                analysisHistory={analysisHistory}
                darkMode={darkMode}
              />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
