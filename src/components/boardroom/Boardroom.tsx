import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import AppLayout from '../layout/AppLayout';
import ChatPanel from './ChatPanel';
import ConversationHistoryModal from '../shared/ConversationHistoryModal';
import PersonalizeAIBanner from '../shared/PersonalizeAIBanner';
import UsageLimitBadge from '../ui/UsageLimitBadge';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useAuth } from '../../contexts/AuthContext';
import { WebSocketContext, WebSocketContextValue } from '../../contexts/WebSocketContext';
import { useBoardroomChat } from '../../hooks/useBoardroomChat';
import { useModalState } from '../../hooks/useModalState';
import aiCharacterAPI from '../../services/aiCharacterAPI';
import meetingIntelligenceAPI from '../../services/api/crm/meetingIntelligence';
import userAPI from '../../services/userAPI';
import type { FollowUpMessage } from '../shared/ai-feedback/types';
import type { MeetingDetail } from '../../types/meetingIntelligence';

interface UserFeatures {
  system_features?: { the_boardroom_model?: string[] };
  [key: string]: unknown;
}

interface AICharacter {
  id: string;
  name: string;
  internal_name: string;
  description?: string | null;
  avatar_url?: string | null;
  metadata?: { conversation_starters?: string[] };
  is_accessible?: boolean | null;
  required_plan_name?: string | null;
}

export default function Boardroom() {
  const { darkMode } = usePreferences();
  const { isAdmin } = useAuth();
  const { isConnected } = useContext(WebSocketContext) as WebSocketContextValue;
  const [searchParams, setSearchParams] = useSearchParams();
  const meetingAutoAttached = useRef(false);

  const [characters, setCharacters] = useState<AICharacter[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [selectedCharacterName, setSelectedCharacterName] = useState('');
  const [selectedCharacterAvatar, setSelectedCharacterAvatar] = useState<string | null>(null);
  const [selectedCharacterDescription, setSelectedCharacterDescription] = useState('');
  const [selectedCharacterStarters, setSelectedCharacterStarters] = useState<string[]>([]);

  const historyModal = useModalState();

  // Character switch prompt state (history load)
  const [switchPrompt, setSwitchPrompt] = useState<{
    convId: string;
    messages: FollowUpMessage[];
    originalName: string;
    originalId: string;
    currentName: string;
  } | null>(null);

  // Character change prompt state (sidebar switch)
  const [changePrompt, setChangePrompt] = useState<{
    characterId: string;
    characterName: string;
  } | null>(null);

  const {
    conversationId,
    messages,
    isStreaming,
    streamingContent,
    isSending,
    error,
    sendMessage,
    cancelStreaming,
    deleteMessage,
    deletingMessageId,
    loadConversation,
    clearChat,
    pendingAttachments,
    pendingMeeting,
    uploadingFiles,
    handleFileUpload,
    removeAttachment,
    setLinkedMeeting,
  } = useBoardroomChat(selectedCharacterId, selectedCharacterAvatar);

  // Load characters on mount
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingCharacters(true);

        const userFeatures = await userAPI.getCurrentUserFeatures() as UserFeatures;
        const allowedCharacterNames = userFeatures?.system_features?.the_boardroom_model || [];

        const allChars = await aiCharacterAPI.getUserCharacters({ per_page: '50', include_gated: 'true', feature: 'boardroom' }) as AICharacter[];

        let chars = allChars;
        if (allowedCharacterNames.length > 0) {
          chars = allChars.filter((char: AICharacter) =>
            allowedCharacterNames.includes(char.internal_name) ||
            allowedCharacterNames.includes(char.name.toLowerCase()) ||
            char.is_accessible === false
          );
        }

        // Sort: accessible characters first, then gated
        chars.sort((a, b) => {
          const aAccessible = a.is_accessible !== false ? 1 : 0;
          const bAccessible = b.is_accessible !== false ? 1 : 0;
          return bAccessible - aAccessible;
        });

        setCharacters(chars || []);

        // Auto-select first accessible character
        const accessibleChars = chars.filter(c => c.is_accessible !== false);
        if (accessibleChars.length > 0) {
          const first = accessibleChars[0];
          setSelectedCharacterId(first.id);
          setSelectedCharacterName(first.name);
          setSelectedCharacterAvatar(first.avatar_url || null);
          setSelectedCharacterDescription(first.description || '');
          setSelectedCharacterStarters(first.metadata?.conversation_starters || []);
        }
      } catch (err) {
        console.error('[Boardroom] Failed to load characters:', err);
        setCharacters([]);
      } finally {
        setLoadingCharacters(false);
      }
    };
    load();
  }, []);

  // Auto-attach meeting when navigated from meetings page via query params
  useEffect(() => {
    if (loadingCharacters || meetingAutoAttached.current) return;
    const meetingId = searchParams.get('meetingId');
    const characterId = searchParams.get('characterId');
    if (!meetingId || !characterId) return;

    meetingAutoAttached.current = true;
    // Clear query params so refreshing doesn't re-trigger
    setSearchParams({}, { replace: true });

    // Select the requested character
    const character = characters.find(c => c.id === characterId);
    if (character && character.is_accessible !== false) {
      setSelectedCharacterId(character.id);
      setSelectedCharacterName(character.name);
      setSelectedCharacterAvatar(character.avatar_url || null);
      setSelectedCharacterDescription(character.description || '');
      setSelectedCharacterStarters(character.metadata?.conversation_starters || []);
    }

    // Clear any existing conversation and attach the meeting
    clearChat();

    // Fetch meeting detail and link it
    (async () => {
      try {
        const detail = await meetingIntelligenceAPI.getMeeting(meetingId) as MeetingDetail;
        const linkedMeeting = {
          meeting_id: detail.id,
          title: detail.title || 'Untitled Meeting',
          start_time: detail.start_time,
          duration_ms: detail.duration_ms,
        };
        const context: { summary?: string; key_points?: string[]; action_items?: string[]; transcript?: string } = {};
        if (detail.summary_json) {
          if (detail.summary_json.overview) context.summary = detail.summary_json.overview;
          if (detail.summary_json.keyPoints) context.key_points = detail.summary_json.keyPoints;
          if (detail.summary_json.actionItems) context.action_items = detail.summary_json.actionItems;
        }
        if (detail.transcripts?.length) {
          context.transcript = detail.transcripts
            .map(t => `[${t.speaker_display_name || t.speaker}]: ${t.content}`)
            .join('\n');
        }
        setLinkedMeeting(linkedMeeting, context);
      } catch (err) {
        console.error('[Boardroom] Failed to auto-attach meeting:', err);
      }
    })();
  }, [loadingCharacters, characters, searchParams, setSearchParams, clearChat, setLinkedMeeting]);

  // Handle character switch
  const handleCharacterChange = useCallback((characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    // Block gated characters
    if (character.is_accessible === false) return;

    // If there's an active conversation, show styled prompt
    if (messages.length > 0) {
      setChangePrompt({ characterId: character.id, characterName: character.name });
      return;
    }

    setSelectedCharacterId(character.id);
    setSelectedCharacterName(character.name);
    setSelectedCharacterAvatar(character.avatar_url || null);
    setSelectedCharacterDescription(character.description || '');
    setSelectedCharacterStarters(character.metadata?.conversation_starters || []);
  }, [characters, messages]);

  const handleConfirmChange = useCallback(() => {
    if (!changePrompt) return;
    const character = characters.find(c => c.id === changePrompt.characterId);
    if (!character) return;
    setSelectedCharacterId(character.id);
    setSelectedCharacterName(character.name);
    setSelectedCharacterAvatar(character.avatar_url || null);
    setSelectedCharacterDescription(character.description || '');
    setSelectedCharacterStarters(character.metadata?.conversation_starters || []);
    setChangePrompt(null);
  }, [changePrompt, characters]);

  const handleCancelChange = useCallback(() => {
    setChangePrompt(null);
  }, []);

  // New chat prompt state
  const [showNewChatPrompt, setShowNewChatPrompt] = useState(false);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    if (messages.length > 0) {
      setShowNewChatPrompt(true);
      return;
    }
    clearChat();
  }, [messages, clearChat]);

  const handleConfirmNewChat = useCallback(() => {
    setShowNewChatPrompt(false);
    clearChat();
  }, [clearChat]);

  const handleCancelNewChat = useCallback(() => {
    setShowNewChatPrompt(false);
  }, []);

  // Handle loading conversation from history
  const handleLoadConversation = useCallback((convId: string, existingMessages: FollowUpMessage[], participant?: { character_id: string; character_name?: string; character_avatar_url?: string }) => {
    // If conversation was with a different character, show the switch prompt
    if (participant?.character_id && participant.character_id !== selectedCharacterId) {
      const originalName = participant.character_name || characters.find(c => c.id === participant.character_id)?.name || 'another character';
      setSwitchPrompt({
        convId,
        messages: existingMessages,
        originalName,
        originalId: participant.character_id,
        currentName: selectedCharacterName,
      });
      return;
    }

    loadConversation(convId, existingMessages);
  }, [loadConversation, selectedCharacterId, selectedCharacterName, characters]);

  // Switch prompt handlers
  const handleSwitchToOriginal = useCallback(() => {
    if (!switchPrompt) return;
    const originalChar = characters.find(c => c.id === switchPrompt.originalId);
    if (originalChar) {
      setSelectedCharacterId(originalChar.id);
      setSelectedCharacterName(originalChar.name);
      setSelectedCharacterAvatar(originalChar.avatar_url || null);
      setSelectedCharacterDescription(originalChar.description || '');
      setSelectedCharacterStarters(originalChar.metadata?.conversation_starters || []);
    }
    loadConversation(switchPrompt.convId, switchPrompt.messages);
    setSwitchPrompt(null);
  }, [switchPrompt, characters, loadConversation]);

  const handleKeepCurrent = useCallback(() => {
    if (!switchPrompt) return;
    loadConversation(switchPrompt.convId, switchPrompt.messages);
    setSwitchPrompt(null);
  }, [switchPrompt, loadConversation]);

  const handleCancelSwitch = useCallback(() => {
    setSwitchPrompt(null);
  }, []);

  return (
    <AppLayout pageTitle="Boardroom" rawContent>
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
            The Boardroom
          </h1>

          <div className="flex items-center gap-2">
            <UsageLimitBadge
              characterId={selectedCharacterId ?? undefined}
              aiUsage={true}
              variant="compact"
              showUpgradeLink={true}
              darkMode={darkMode}
            />

            {conversationId && (
              <button
                onClick={handleNewChat}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  darkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                New Chat
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
        <div className="px-4 sm:px-6 pt-2 flex-shrink-0">
          <PersonalizeAIBanner darkMode={darkMode} />
        </div>

        {/* Connection Warning */}
        {!isConnected && !loadingCharacters && (
          <div className={`mx-4 sm:mx-6 mt-1 px-3 py-2 rounded-lg text-sm ${
            darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-50 text-yellow-700'
          }`}>
            Connecting to server...
          </div>
        )}

        {/* Main Content: Sidebar + Chat */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3 px-4 pb-4 pt-2 sm:px-6 sm:pb-6 sm:pt-2">
          {/* Expert Sidebar */}
          {!loadingCharacters && characters.length > 0 && (
            <div className="boardroom-sidebar-scroll w-full lg:w-[260px] flex-shrink-0 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto">
              {characters.map((char) => {
                const isGated = char.is_accessible === false;
                return (
                  <button
                    key={char.id}
                    onClick={() => handleCharacterChange(char.id)}
                    className={`flex items-start gap-3 px-4 py-4 rounded-xl border transition-colors text-left min-w-[220px] lg:min-w-0 lg:w-full ${
                      isGated
                        ? darkMode
                          ? 'bg-[#1a1a1a] border-[#333333] cursor-default opacity-60'
                          : 'bg-gray-50 border-neutral-200 cursor-default opacity-60'
                        : selectedCharacterId === char.id
                          ? darkMode
                            ? 'bg-[#2d2d2d] border-zenible-primary shadow-sm'
                            : 'bg-white border-zenible-primary shadow-sm'
                          : darkMode
                            ? 'bg-[#2d2d2d] border-[#444444] hover:border-gray-500'
                            : 'bg-white border-neutral-200 hover:border-gray-300'
                    }`}
                  >
                    {char.avatar_url ? (
                      <img
                        src={char.avatar_url}
                        alt=""
                        className={`w-10 h-10 rounded-full object-cover flex-shrink-0${isGated ? ' grayscale' : ''}`}
                      />
                    ) : (
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isGated
                          ? 'bg-gray-100 border border-gray-300'
                          : 'bg-violet-50 border border-[#ddd6ff]'
                      }`}>
                        <svg className={`w-5 h-5 ${isGated ? 'text-gray-400' : 'text-violet-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${
                        isGated
                          ? darkMode ? 'text-gray-500' : 'text-gray-400'
                          : selectedCharacterId === char.id
                            ? darkMode ? 'text-white' : 'text-gray-900'
                            : darkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {char.name}
                      </div>
                      {isGated && char.required_plan_name ? (
                        <p className={`text-xs mt-0.5 font-medium ${
                          darkMode ? 'text-amber-500/70' : 'text-amber-600'
                        }`}>
                          Upgrade to {char.required_plan_name} to access
                        </p>
                      ) : char.description ? (
                        <p className={`text-xs mt-0.5 line-clamp-3 ${
                          darkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}>
                          {char.description}
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Chat Area */}
          <div className="flex-1 min-h-0 flex flex-col">
            <ChatPanel
              darkMode={darkMode}
              characterAvatarUrl={selectedCharacterAvatar}
              characterName={selectedCharacterName}
              characterDescription={selectedCharacterDescription}
              messages={messages}
              isStreaming={isStreaming}
              streamingContent={streamingContent}
              isSending={isSending}
              conversationId={conversationId}
              error={error}
              onSendMessage={sendMessage}
              onCancelStreaming={cancelStreaming}
              onDeleteMessage={deleteMessage}
              deletingMessageId={deletingMessageId}
              isAdmin={isAdmin}
              conversationStarters={selectedCharacterStarters}
              pendingAttachments={pendingAttachments}
              pendingMeeting={pendingMeeting}
              uploadingFiles={uploadingFiles}
              onFileSelect={handleFileUpload}
              onRemoveAttachment={removeAttachment}
              onRemoveMeeting={() => setLinkedMeeting(null)}
              onLinkMeeting={(meeting, context) => setLinkedMeeting(meeting, context)}
            />
          </div>
        </div>
      </div>

      {/* Character Switch Prompt */}
      {switchPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className={`w-full max-w-md rounded-xl shadow-xl p-6 ${
            darkMode ? 'bg-[#1e1e1e]' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Switch Character?
            </h3>
            <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              You were last speaking to <span className="font-medium">{switchPrompt.originalName}</span>.
              Do you want to switch this conversation to <span className="font-medium">{switchPrompt.currentName}</span>?
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
              <button
                onClick={handleCancelSwitch}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleSwitchToOriginal}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  darkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                }`}
              >
                Switch to {switchPrompt.originalName}
              </button>
              <button
                onClick={handleKeepCurrent}
                className="px-4 py-2 text-sm rounded-lg bg-zenible-primary text-white hover:bg-purple-600 transition-colors"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Character Change Prompt */}
      {changePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className={`w-full max-w-md rounded-xl shadow-xl p-6 ${
            darkMode ? 'bg-[#1e1e1e]' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Switch Character
            </h3>
            <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Continue this conversation with <span className="font-medium">{changePrompt.characterName}</span>?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelChange}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmChange}
                className="px-4 py-2 text-sm rounded-lg bg-zenible-primary text-white hover:bg-purple-600 transition-colors"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Chat Prompt */}
      {showNewChatPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className={`w-full max-w-md rounded-xl shadow-xl p-6 ${
            darkMode ? 'bg-[#1e1e1e]' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Start New Conversation
            </h3>
            <p className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Start a new conversation? The current conversation is saved in history.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelNewChat}
                className={`px-4 py-2 text-sm rounded-lg transition-colors ${
                  darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmNewChat}
                className="px-4 py-2 text-sm rounded-lg bg-zenible-primary text-white hover:bg-purple-600 transition-colors"
              >
                New Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      <ConversationHistoryModal
        darkMode={darkMode}
        isOpen={historyModal.isOpen}
        onClose={historyModal.close}
        onLoadConversation={handleLoadConversation}
        toolType="boardroom"
        showToggle
      />
    </AppLayout>
  );
}
