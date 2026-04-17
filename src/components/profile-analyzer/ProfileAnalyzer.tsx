import React, { useState, useEffect, useContext } from 'react';
import AppLayout from '../layout/AppLayout';
import PlatformSelector from '../proposal-wizard/PlatformSelector';
import ProfileInput from './ProfileInput';
import AIFeedbackSection from '../shared/AIFeedbackSection';
import type { FeedbackData, MetricsData } from '../shared/ai-feedback/types';
import PersonalizeAIBanner from '../shared/PersonalizeAIBanner';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useProfileAnalysis } from '../../hooks/useProfileAnalysis';
import { WebSocketContext, WebSocketContextValue } from '../../contexts/WebSocketContext';
import { useAuth } from '../../contexts/AuthContext';
import aiCharacterAPI from '../../services/aiCharacterAPI';
import userAPI from '../../services/userAPI';
import { getCharacterTools } from '../../services/toolDiscoveryAPI';
import UsageLimitBadge from '../ui/UsageLimitBadge';
import CharacterCardSelector from '../ui/CharacterCardSelector';
import { useModalState } from '../../hooks/useModalState';
import ConversationHistoryModal from '../shared/ConversationHistoryModal';
import type { RawConversationMessage } from '../shared/ConversationHistoryModal';

interface AICharacter {
  id: string;
  name: string;
  internal_name: string;
  description?: string | null;
  avatar_url?: string | null;
}

interface UserFeatures {
  profile_analyzer?: { enabled?: boolean };
  system_features?: { profile_analyzer_model?: string[] };
  [key: string]: unknown;
}


interface AnalysisFeedback {
  isProcessing: boolean;
  score?: number | null;
  analysis?: unknown;
  structured?: unknown;
  raw?: string;
  messageId?: string | null;
  usage?: unknown;
  contentType?: unknown;
  error?: string;
}

interface FollowUpMessage {
  role: string;
  content: string;
  timestamp: string;
  messageId?: string | null;
  usage?: unknown;
}

interface AnalysisHistoryEntry {
  role: string;
  type?: string;
  content: string;
  structured?: unknown;
  messageId?: string;
  usage?: unknown;
  timestamp: string;
  isStreaming?: boolean;
}

export default function ProfileAnalyzer() {
  const { darkMode } = usePreferences();
  const { isAdmin } = useAuth();

  // State
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [profile, setProfile] = useState('');
  const [profileUrl, setProfileUrl] = useState(''); // Reserved for future URL input feature
  const [feedback, setFeedback] = useState<AnalysisFeedback | null>(null);
  const [availableCharacters, setAvailableCharacters] = useState<AICharacter[]>([]);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [selectedCharacterName, setSelectedCharacterName] = useState('');
  const [selectedCharacterAvatar, setSelectedCharacterAvatar] = useState<string | null>(null);
  const [selectedCharacterDescription, setSelectedCharacterDescription] = useState('');
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [, setUserFeatures] = useState<UserFeatures | null>(null);
  const [, setFeatureEnabled] = useState(true);
  const [followUpMessages, setFollowUpMessages] = useState<FollowUpMessage[]>([]);
  const [isFollowUpStreaming, setIsFollowUpStreaming] = useState(false);
  const [followUpStreamingContent, setFollowUpStreamingContent] = useState('');
  const [characterTools, setCharacterTools] = useState<{ available_tools?: { name: string; is_enabled: boolean }[] } | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisHistoryEntry[]>([]);

  // History modal state
  const historyModal = useModalState();

  // Get WebSocket context
  const {
    isConnected,
    onConversationEvent,
  } = useContext(WebSocketContext) as WebSocketContextValue;

  // Use Profile Analysis hook
  const {
    conversationId,
    isAnalyzing: analyzing,
    isStreaming,
    streamingContent,
    analysis,
    structuredAnalysis,
    metrics,
    messageId,
    analyzeProfile: sendAnalysis,
    generateProfile: sendGeneration,
    sendFollowUpMessage: sendFollowUp,
    reset: resetAnalysis,
    clearConversation,
    deleteMessage,
    deletingMessageId,
  } = useProfileAnalysis({
    characterId: selectedCharacterId || '',
    panelId: 'profile_analyzer',
    onAnalysisStarted: (_data: { conversationId: string; toolName: string }) => {
      setFeedback({
        isProcessing: true,
        score: null,
        analysis: null
      });
    },
    onAnalysisComplete: (data: unknown) => {
      const typed = data as { analysis: { raw: string; structured: unknown }; messageId: string | null; usage: unknown; contentType: unknown; toolName: string };
      // Set current feedback
      setFeedback({
        isProcessing: false,
        analysis: typed.analysis,
        structured: typed.analysis?.structured,
        raw: typed.analysis?.raw,
        messageId: typed.messageId,
        usage: typed.usage,
        contentType: typed.contentType
      });

      // Add to analysis history
      const newAnalysis: AnalysisHistoryEntry = {
        role: 'assistant',
        type: 'analysis',
        content: typed.analysis?.raw || '',
        structured: typed.analysis?.structured,
        messageId: typed.messageId || undefined,
        usage: typed.usage,
        timestamp: new Date().toISOString()
      };
      setAnalysisHistory(prev => {
        const newHistory = [...prev, newAnalysis];
        return newHistory;
      });
    },
    onStreamingChunk: (_data: { chunk: string; fullContent: string; chunkIndex: number; toolName: string }) => {
      // Optional: handle streaming chunks if needed
    },
    onError: (error: { error: string; validationErrors?: unknown[]; toolName?: string }) => {
      console.error('[ProfileAnalyzer] Analysis error:', error);
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
        const data = args[0] as { toolName?: string; fullContent?: string };
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
        const data = args[0] as { toolName?: string; fullResponse?: string; messageId?: string; usage?: unknown };
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
        const data = args[0];
        console.error('[ProfileAnalyzer] Follow-up error:', data);
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
        const isEnabled = features?.profile_analyzer?.enabled ?? true;
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

        // Get user features to see which characters are available for profile analyzer
        const userFeatures = await userAPI.getCurrentUserFeatures() as UserFeatures;
        const allowedCharacterNames = userFeatures?.system_features?.profile_analyzer_model || [];

        // Get all characters
        const characters = await aiCharacterAPI.getUserCharacters() as AICharacter[];

        // Filter characters based on what's allowed for profile analyzer
        // If no specific characters are defined, show all characters
        let profileCharacters = characters;
        if (allowedCharacterNames.length > 0) {
          profileCharacters = characters.filter((char: AICharacter) =>
            allowedCharacterNames.includes(char.internal_name) ||
            allowedCharacterNames.includes(char.name.toLowerCase())
          );
        }

        setAvailableCharacters(profileCharacters);

        if (profileCharacters.length > 0 && !selectedCharacterId) {
          const defaultChar = profileCharacters[0];
          setSelectedCharacterId(defaultChar.id);
          setSelectedCharacterName(defaultChar.name);
          setSelectedCharacterAvatar(defaultChar.avatar_url || null);
          setSelectedCharacterDescription(defaultChar.description || '');
        }
      } catch (error) {
        console.error('Failed to load AI characters:', error);

        // Fallback: if features endpoint fails, just load all characters
        try {
          const characters = await aiCharacterAPI.getUserCharacters() as AICharacter[];
          setAvailableCharacters(characters);

          if (characters.length > 0 && !selectedCharacterId) {
            const defaultChar = characters[0];
            setSelectedCharacterId(defaultChar.id);
            setSelectedCharacterName(defaultChar.name);
            setSelectedCharacterAvatar(defaultChar.avatar_url || null);
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

        // Check if character has both required tools
        const hasAnalyzeTool = tools.available_tools?.some(
          (tool) => tool.name === 'analyze_profile' && tool.is_enabled
        );
        const hasGenerateTool = tools.available_tools?.some(
          (tool) => tool.name === 'generate_profile' && tool.is_enabled
        );

        if (!hasAnalyzeTool) {
          console.warn('[ProfileAnalyzer] Character does not have analyze_profile tool');
        }
        if (!hasGenerateTool) {
          console.warn('[ProfileAnalyzer] Character does not have generate_profile tool');
        }
      } catch (error) {
        console.error('[ProfileAnalyzer] Failed to load character tools:', error);
      }
    };

    loadTools();
  }, [selectedCharacterId]);

  // Handle character selection
  const handleCharacterSelect = (character: AICharacter | string) => {
    if (typeof character === 'string') {
      const found = availableCharacters.find(c => c.id === character);
      if (!found) return;
      character = found;
    }
    setSelectedCharacterId(character.id);
    setSelectedCharacterName(character.name);
    setSelectedCharacterAvatar(character.avatar_url || null);
    setSelectedCharacterDescription(character.description || '');

    // Clear conversation when switching characters
    if (conversationId) {
      clearConversation();
      setFollowUpMessages([]);
      setFeedback(null);
      setAnalysisHistory([]);
    }
  };

  // Handle profile analysis
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
      // Clear previous analysis (keep follow-up messages - they're part of conversation)
      setFeedback(null);
      setFollowUpStreamingContent('');

      // Conditional tool selection based on profile content
      if (profile && profile.trim()) {
        // Analyze existing profile
        await sendAnalysis(
          profile,
          selectedPlatform || 'linkedin'
        );
      } else {
        // Generate profile suggestions
        await sendGeneration(
          '',
          selectedPlatform || 'linkedin'
        );
      }
    } catch (_error) {
      setFeedback({
        isProcessing: false,
        error: 'Failed to process request. Please try again.'
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

    // Send message using the hook
    // Note: User message is added to conversationHistory in AIFeedbackSection
    await sendFollowUp(message);
  };

  // Handle loading conversation from history
  const handleLoadConversation = (convId: string, rawMessages: RawConversationMessage[]) => {
    if (rawMessages.length > 0) {
      // Find the initial profile data from the messages
      const firstUserMessage = rawMessages.find((msg: RawConversationMessage) => msg.sender_type === 'USER');
      const metadata = firstUserMessage?.metadata as Record<string, string> | undefined;
      if (metadata?.profile) {
        setProfile(metadata.profile);
      }
      if (metadata?.profile_url) {
        setProfileUrl(metadata.profile_url);
      }
      if (metadata?.platform) {
        setSelectedPlatform(metadata.platform);
      }

      // Load the conversation messages as follow-ups
      const formattedMessages = rawMessages.map((msg: RawConversationMessage) => ({
        role: msg.sender_type === 'USER' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.created_at,
        messageId: msg.id
      }));
      setFollowUpMessages(formattedMessages);

      // Close modal
      historyModal.close();
    }
  };

  // Export conversation
  const handleExportConversation = async () => {
    if (!conversationId) return;

    try {
      const blob = await userAPI.exportUserConversation(conversationId, 'markdown') as Blob;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `profile-analysis-${conversationId}.md`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error exporting conversation:', error);
    }
  };

  return (
    <AppLayout pageTitle="Profile Analyzer" rawContent>
      <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
        <div className={`h-16 border-b flex items-center justify-between px-4 sm:px-6 flex-shrink-0 ${
          darkMode
            ? 'bg-[#1e1e1e] border-[#333333]'
            : 'bg-white border-neutral-200'
        }`}>
          <h1 className={`text-lg sm:text-xl font-semibold ${
            darkMode ? 'text-white' : 'text-gray-900'
          }`}>
            Profile Analyzer
          </h1>

          <div className="flex items-center gap-2">
            {/* Usage Limit Badge */}
            <UsageLimitBadge
              characterId={selectedCharacterId ?? undefined}
              aiUsage={true}
              variant="compact"
              showUpgradeLink={true}
              darkMode={darkMode}
            />

            {conversationId && (
              <button
                onClick={handleExportConversation}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  darkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Export
              </button>
            )}
            <button
              onClick={() => historyModal.open()}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                darkMode
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              History
            </button>
          </div>
        </div>

        {/* Personalize AI Banner */}
        <div className="px-4 sm:px-6 pt-4 flex-shrink-0">
          <PersonalizeAIBanner darkMode={darkMode} />
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full flex flex-col lg:flex-row gap-4 p-4 sm:p-6">
            {/* Left Column - Input */}
            <div className="w-full lg:w-1/2 flex flex-col gap-4 min-h-0 overflow-y-auto">
              <PlatformSelector
                darkMode={darkMode}
                selectedPlatform={selectedPlatform}
                setSelectedPlatform={setSelectedPlatform}
                characterId={selectedCharacterId}
              />

              <ProfileInput
                darkMode={darkMode}
                profile={profile}
                setProfile={setProfile}
                profileUrl={profileUrl}
                setProfileUrl={setProfileUrl}
                analyzing={analyzing}
                onAnalyze={handleAnalyze}
                isPanelReady={isConnected}
                isConnected={isConnected}
              />
            </div>

            {/* Right Column - AI Feedback */}
            <div className="w-full lg:w-1/2 flex flex-col min-h-[400px] lg:min-h-0 lg:flex-1 lg:overflow-hidden gap-3">
              <CharacterCardSelector
                characters={availableCharacters}
                selectedCharacterId={selectedCharacterId}
                onSelect={handleCharacterSelect}
                darkMode={darkMode}
                loading={loadingCharacters}
              />
              <AIFeedbackSection
                darkMode={darkMode}
                feedback={feedback ? { ...feedback, analysis: feedback.analysis as FeedbackData['analysis'] } as FeedbackData : null}
                analyzing={analyzing}
                isProcessing={feedback?.isProcessing ?? false}
                isStreaming={isStreaming}
                streamingContent={streamingContent}
                structuredAnalysis={structuredAnalysis}
                rawAnalysis={analysis?.raw ?? ''}
                metrics={metrics as MetricsData | null}
                usage={(feedback?.usage as MetricsData) ?? null}
                conversationId={conversationId ?? ''}
                messageId={messageId ?? ''}
                onCancel={resetAnalysis}
                onSendMessage={handleSendFollowUpMessage}
                onDeleteMessage={deleteMessage}
                deletingMessageId={deletingMessageId}
                characterId={selectedCharacterId ?? ''}
                characterName={selectedCharacterName}
                characterAvatarUrl={selectedCharacterAvatar}
                characterDescription={selectedCharacterDescription}
                followUpMessages={followUpMessages.map(m => ({ ...m, messageId: m.messageId ?? undefined }))}
                isFollowUpStreaming={isFollowUpStreaming}
                followUpStreamingContent={followUpStreamingContent}
                isAdmin={isAdmin}
                analysisHistory={analysisHistory}
              />
            </div>
          </div>
        </div>

      </div>
      <ConversationHistoryModal
        darkMode={darkMode}
        isOpen={historyModal.isOpen}
        onClose={historyModal.close}
        onLoadRawConversation={handleLoadConversation}
        toolType="profile_analyzer"
      />
    </AppLayout>
  );
}
