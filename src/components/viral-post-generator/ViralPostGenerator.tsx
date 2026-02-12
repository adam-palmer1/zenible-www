import React, { useState, useEffect, useContext } from 'react';
import AppLayout from '../layout/AppLayout';
import DraftPostSection from './DraftPostSection';
import StrategyInputSection from './StrategyInputSection';
import PlatformContentOptions from './PlatformContentOptions';
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
  const [platformFocus, setPlatformFocus] = useState('linkedin');
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
    clearConversation
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
      console.error('[ViralPostGenerator] Analysis error:', error);
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
        console.error('[ViralPostGenerator] Follow-up error:', data);
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
        console.error('Failed to load user features:', error);
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
        console.error('Failed to load AI characters:', error);

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
          console.error('Failed to load characters even in fallback:', fallbackError);
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
          console.warn('[ViralPostGenerator] Character does not have linkedin_post_from_draft tool');
        }
        if (!hasStrategyTool) {
          console.warn('[ViralPostGenerator] Character does not have linkedin_strategy_from_topic_goal_audience tool');
        }
      } catch (error) {
        console.error('[ViralPostGenerator] Failed to load character tools:', error);
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
    <AppLayout pageTitle="Content">
      {/* Header */}
        <div className={`border-b ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-neutral-200 bg-white'} px-4 py-3`}>
          <div className="flex items-center justify-between">
            <h1 className={`text-2xl font-semibold ${darkMode ? 'text-gray-100' : 'text-zinc-950'}`}>
              Viral Post Generator
            </h1>
            <UsageLimitBadge
              characterId={selectedCharacterId ?? undefined}
              variant="compact"
              showUpgradeLink={true}
              darkMode={darkMode}
            />
          </div>
        </div>

        {/* Personalize AI Banner */}
        <div className="px-4 pt-4">
          <PersonalizeAIBanner darkMode={darkMode} />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex gap-4 h-full">
            {/* Left Panel - Inputs */}
            <div className="w-[614px] flex flex-col gap-4">
              {/* Tab Buttons */}
              <div className={`flex gap-0.5 bg-white border border-neutral-200 rounded-lg overflow-hidden w-fit ${darkMode ? 'bg-gray-800 border-gray-700' : ''}`}>
                <button
                  onClick={() => handleTabChange('polish')}
                  className={`px-3 py-2 text-sm font-semibold transition-colors ${
                    activeTab === 'polish'
                      ? darkMode
                        ? 'bg-violet-600 text-white'
                        : 'bg-white text-zinc-950 border border-neutral-200'
                      : darkMode
                      ? 'bg-gray-800 text-gray-400 hover:text-gray-200'
                      : 'bg-transparent text-zinc-500 hover:text-zinc-950'
                  }`}
                >
                  Polish my draft post
                </button>
                <button
                  onClick={() => handleTabChange('strategy')}
                  className={`px-3 py-2 text-sm font-semibold transition-colors ${
                    activeTab === 'strategy'
                      ? darkMode
                        ? 'bg-violet-600 text-white'
                        : 'bg-white text-zinc-950 border border-neutral-200'
                      : darkMode
                      ? 'bg-gray-800 text-gray-400 hover:text-gray-200'
                      : 'bg-transparent text-zinc-500 hover:text-zinc-950'
                  }`}
                >
                  Build my content strategy
                </button>
              </div>

              {/* Tab Content */}
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

              {/* Additional Options */}
              <PlatformContentOptions
                platformFocus={platformFocus}
                setPlatformFocus={setPlatformFocus}
                disabled={analyzing}
              />

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={analyzing || !isConnected}
                className={`w-full py-3 rounded-xl text-base font-medium transition-colors ${
                  analyzing || !isConnected
                    ? 'bg-gray-400 cursor-not-allowed'
                    : darkMode
                    ? 'bg-violet-600 hover:bg-violet-700'
                    : 'bg-[#8e51ff] hover:bg-violet-600'
                } text-white`}
              >
                {analyzing ? 'Analyzing...' : 'Make It Viral'}
              </button>
            </div>

            {/* Right Panel - AI Feedback */}
            <div className="flex-1 min-w-0">
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
                onCancel={() => {}}
                onSendMessage={handleSendFollowUpMessage}
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
    </AppLayout>
  );
}
