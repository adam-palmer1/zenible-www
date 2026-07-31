import { useState, useEffect, useContext } from 'react';
import AppLayout from '../layout/AppLayout';
import logger from '../../utils/logger';
import HookInputSection from './HookInputSection';
import PlatformSelector from '../proposal-wizard/PlatformSelector';
import AIFeedbackSection from '../shared/AIFeedbackSection';
import type { MetricsData } from '../shared/ai-feedback/types';
import PersonalizeAIBanner from '../shared/PersonalizeAIBanner';
import ConversationHistoryModal from '../shared/ConversationHistoryModal';
import type { RawConversationMessage } from '../shared/ConversationHistoryModal';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useHookGenerator } from '../../hooks/useHookGenerator';
import { useModalState } from '../../hooks/useModalState';
import { WebSocketContext, WebSocketContextValue } from '../../contexts/WebSocketContext';
import { useAuth } from '../../contexts/AuthContext';
import aiCharacterAPI from '../../services/aiCharacterAPI';
import userAPI from '../../services/userAPI';
import { getCharacterTools } from '../../services/toolDiscoveryAPI';
import { senderTypeToRole } from '../../utils/messageUtils';
import UsageLimitBadge from '../ui/UsageLimitBadge';

interface AICharacter {
  id: string;
  name: string;
  internal_name?: string;
  avatar_url: string | null;
  description?: string;
}

interface UserFeatures {
  hook_generator?: { enabled?: boolean };
  system_features?: { hook_generator_model?: string[] };
  [key: string]: unknown;
}

interface HookFeedback {
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

export default function HookGenerator() {
  const { darkMode } = usePreferences();
  useAuth();

  // Inputs
  const [description, setDescription] = useState('');
  const [audience, setAudience] = useState('');
  const [goal, setGoal] = useState('');

  // Shared state
  const [platformFocus, setPlatformFocus] = useState('');
  const [feedback, setFeedback] = useState<HookFeedback | null>(null);
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

  const {
    isConnected,
    onConversationEvent,
  } = useContext(WebSocketContext) as WebSocketContextValue;

  const historyModal = useModalState();

  const {
    conversationId,
    isAnalyzing: analyzing,
    isStreaming,
    streamingContent,
    analysis,
    structuredAnalysis,
    error: _analysisError,
    messageId,
    generateHooks,
    sendFollowUpMessage: sendFollowUp,
    clearConversation,
    reset: resetAnalysis,
    deleteMessage,
    deletingMessageId,
    setConversationId,
  } = useHookGenerator({
    characterId: selectedCharacterId || '',
    panelId: 'hook_generator',
    onAnalysisStarted: () => {
      setFeedback({ isProcessing: true, analysis: null });
    },
    onAnalysisComplete: (data: unknown) => {
      const result = data as {
        analysis?: { raw?: string; structured?: unknown };
        messageId?: string;
        usage?: unknown;
        contentType?: unknown;
      };
      setFeedback({
        isProcessing: false,
        analysis: result.analysis,
        structured: result.analysis?.structured,
        raw: result.analysis?.raw,
        messageId: result.messageId,
        usage: result.usage,
        contentType: result.contentType,
      });

      setAnalysisHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          type: 'analysis',
          content: result.analysis?.raw || '',
          structured: result.analysis?.structured,
          messageId: result.messageId,
          usage: result.usage,
          timestamp: new Date().toISOString(),
        },
      ]);
    },
    onError: (error) => {
      logger.error('[HookGenerator] Analysis error:', error);
      setFeedback({
        isProcessing: false,
        error: error.error || 'An error occurred generating hooks',
      });
    },
  });

  // Follow-up message event handlers
  useEffect(() => {
    if (!conversationId || !onConversationEvent) return;

    const unsubscribers: Array<() => void> = [];

    unsubscribers.push(
      onConversationEvent(conversationId, 'chunk', (...args: unknown[]) => {
        const data = args[0] as WebSocketChunkData;
        if (!data.toolName) {
          setIsFollowUpStreaming(true);
          setFollowUpStreamingContent(data.fullContent || '');
        }
      }),
    );

    unsubscribers.push(
      onConversationEvent(conversationId, 'complete', (...args: unknown[]) => {
        const data = args[0] as WebSocketCompleteData;
        if (!data.toolName) {
          setIsFollowUpStreaming(false);
          setFollowUpStreamingContent('');
          setFollowUpMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: data.fullResponse || '',
              timestamp: new Date().toISOString(),
              messageId: data.messageId,
              usage: data.usage,
            },
          ]);
        }
      }),
    );

    unsubscribers.push(
      onConversationEvent(conversationId, 'error', (...args: unknown[]) => {
        const data = args[0] as WebSocketErrorData;
        logger.error('[HookGenerator] Follow-up error:', data);
        setIsFollowUpStreaming(false);
        setFollowUpStreamingContent('');
      }),
    );

    return () => {
      unsubscribers.forEach((u) => u());
    };
  }, [conversationId, onConversationEvent]);

  // Load user features
  useEffect(() => {
    const load = async () => {
      try {
        const features = (await userAPI.getCurrentUserFeatures()) as UserFeatures;
        setUserFeatures(features);
        const isEnabled = features?.hook_generator?.enabled ?? true;
        setFeatureEnabled(isEnabled);
      } catch (err) {
        logger.error('[HookGenerator] Failed to load user features:', err);
        setFeatureEnabled(true);
      }
    };
    load();
  }, []);

  // Load AI characters (filtered by hook_generator_model)
  useEffect(() => {
    const loadCharacters = async () => {
      try {
        setLoadingCharacters(true);

        const userFeatures = (await userAPI.getCurrentUserFeatures()) as UserFeatures;
        const allowedCharacterNames = userFeatures?.system_features?.hook_generator_model || [];

        const characters = (await aiCharacterAPI.getUserCharacters()) as AICharacter[];

        let filteredCharacters = characters;
        if (allowedCharacterNames.length > 0) {
          filteredCharacters = characters.filter(
            (char) =>
              allowedCharacterNames.includes(char.internal_name || '') ||
              allowedCharacterNames.includes(char.name.toLowerCase()),
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
      } catch (err) {
        logger.error('[HookGenerator] Failed to load AI characters:', err);
        try {
          const characters = (await aiCharacterAPI.getUserCharacters()) as AICharacter[];
          setAvailableCharacters(characters);
          if (characters.length > 0 && !selectedCharacterId) {
            const defaultChar = characters[0];
            setSelectedCharacterId(defaultChar.id);
            setSelectedCharacterName(defaultChar.name);
            setSelectedCharacterAvatar(defaultChar.avatar_url);
            setSelectedCharacterDescription(defaultChar.description || '');
          }
        } catch (fallbackErr) {
          logger.error('[HookGenerator] Failed to load characters even in fallback:', fallbackErr);
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
        const hasGenerateHooks = tools.available_tools?.some(
          (t) => t.name === 'generate_hooks' && t.is_enabled,
        );
        if (!hasGenerateHooks) {
          logger.warn('[HookGenerator] Character does not have generate_hooks tool');
        }
      } catch (err) {
        logger.error('[HookGenerator] Failed to load character tools:', err);
      }
    };
    loadTools();
  }, [selectedCharacterId]);

  const handleLoadConversation = (convId: string, rawMessages: RawConversationMessage[]) => {
    if (rawMessages.length === 0) return;

    setConversationId(convId);

    const firstUserMessage = rawMessages.find(
      (msg) => msg.sender_type?.toUpperCase() === 'USER',
    );

    if (firstUserMessage?.metadata) {
      const meta = firstUserMessage.metadata;
      const toolArgs = meta.tool_arguments as Record<string, unknown> | undefined;

      if (toolArgs?.description) setDescription(toolArgs.description as string);
      if (toolArgs?.audience) setAudience(toolArgs.audience as string);
      if (toolArgs?.goal) setGoal(toolArgs.goal as string);
    }

    let foundFirstAIResponse = false;
    const newAnalysisHistory: AnalysisHistoryEntry[] = [];
    const newFollowUpMessages: FollowUpMessageEntry[] = [];

    for (const msg of rawMessages) {
      const role = senderTypeToRole(msg.sender_type);
      const cleanedContent =
        msg.content === '[No response generated]' ? '' : msg.content;

      if (!foundFirstAIResponse && role === 'assistant') {
        foundFirstAIResponse = true;
        const structured =
          ((msg.metadata as Record<string, unknown>)?.structured_analysis as Record<string, unknown> | undefined) ??
          null;
        newAnalysisHistory.push({
          role: 'assistant',
          type: 'analysis',
          content: cleanedContent,
          messageId: msg.id,
          timestamp: msg.created_at,
          structured,
        });
        setFeedback({
          isProcessing: false,
          raw: cleanedContent,
          analysis: { raw: cleanedContent, structured },
          messageId: msg.id,
        });
      } else if (role === 'user' && msg === firstUserMessage) {
        continue;
      } else {
        newFollowUpMessages.push({
          role,
          content: cleanedContent,
          timestamp: msg.created_at,
          messageId: msg.id,
        });
      }
    }

    setAnalysisHistory(newAnalysisHistory);
    setFollowUpMessages(newFollowUpMessages);
  };

  const handleGenerate = async () => {
    if (!selectedCharacterId) return;

    if (!isConnected) {
      setFeedback({
        isProcessing: false,
        error: 'Not connected to server. Please refresh the page.',
      });
      return;
    }

    if (!description.trim()) return;

    try {
      // Snapshot current feedback into history before clearing
      if (feedback && feedback.messageId && !feedback.isProcessing) {
        const alreadyInHistory = analysisHistory.some((a) => a.messageId === feedback.messageId);
        if (!alreadyInHistory) {
          setAnalysisHistory((prev) => [
            ...prev,
            {
              role: 'assistant',
              type: 'analysis',
              content: feedback.raw || feedback.analysis?.raw || '',
              structured: feedback.structured || feedback.analysis?.structured,
              messageId: feedback.messageId,
              usage: feedback.usage,
              timestamp: new Date().toISOString(),
            },
          ]);
        }
      }

      setFeedback(null);
      setFollowUpStreamingContent('');

      await generateHooks(description, audience, goal);
    } catch (_err) {
      setFeedback({
        isProcessing: false,
        error: 'Failed to generate hooks. Please try again.',
      });
    }
  };

  const handleSendFollowUpMessage = async (message: string) => {
    if (!conversationId || !selectedCharacterId) {
      throw new Error('Cannot send message - missing required data');
    }
    if (!isConnected) {
      throw new Error('Not connected to server');
    }
    await sendFollowUp(message);
  };

  // Suppress unused-variable warning for clearConversation (kept for future character-switching parity)
  void clearConversation;

  return (
    <AppLayout pageTitle="Content" rawContent>
      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          className={`border-b flex-shrink-0 ${
            darkMode ? 'border-gray-700 bg-gray-800' : 'border-neutral-200 bg-white'
          } px-4 py-3`}
        >
          <div className="flex items-center justify-between">
            <h1 className={`text-2xl font-semibold ${darkMode ? 'text-gray-100' : 'text-zinc-950'}`}>
              Hook Generator
            </h1>
            <div className="flex items-center gap-2">
              {selectedCharacterId && (
                <UsageLimitBadge
                  characterId={selectedCharacterId}
                  aiUsage={true}
                  variant="compact"
                  showUpgradeLink={true}
                  darkMode={darkMode}
                />
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
        </div>

        <div className="px-4 pt-4 flex-shrink-0">
          <PersonalizeAIBanner darkMode={darkMode} />
        </div>

        <div className="flex-1 min-h-0 overflow-hidden p-4">
          <div className="flex gap-4 h-full">
            {/* Left panel — inputs */}
            <div className="w-[614px] flex flex-col gap-4 min-h-0">
              <div className="flex-shrink-0">
                <PlatformSelector
                  darkMode={darkMode}
                  selectedPlatform={platformFocus}
                  setSelectedPlatform={setPlatformFocus}
                  characterId={selectedCharacterId}
                />
              </div>

              <div
                className={`rounded-xl border border-dashed shadow-sm flex flex-col p-3 sm:p-4 gap-4 flex-1 min-h-0 ${
                  darkMode
                    ? 'bg-[#4c3d7a] border-[#6b5b95]'
                    : 'bg-violet-50 border-[#c4b4ff]'
                }`}
              >
                <HookInputSection
                  description={description}
                  setDescription={setDescription}
                  audience={audience}
                  setAudience={setAudience}
                  goal={goal}
                  setGoal={setGoal}
                  disabled={analyzing}
                />

                <div className="pt-3 sm:pt-4 flex justify-end flex-shrink-0">
                  <button
                    onClick={handleGenerate}
                    disabled={analyzing || !isConnected || !description.trim()}
                    className={`px-4 sm:px-6 py-2.5 sm:py-3 bg-zenible-primary text-white rounded-xl font-inter font-medium text-sm sm:text-base transition-all ${
                      analyzing || !isConnected || !description.trim()
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:bg-purple-600'
                    }`}
                  >
                    {analyzing ? 'Generating...' : 'Generate Hooks'}
                  </button>
                </div>
              </div>
            </div>

            {/* Right panel — AI feedback */}
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

      <ConversationHistoryModal
        darkMode={darkMode}
        isOpen={historyModal.isOpen}
        onClose={historyModal.close}
        onLoadRawConversation={handleLoadConversation}
        toolType="hook_generator"
      />
    </AppLayout>
  );
}
