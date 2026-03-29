import React, { useState, useEffect, useCallback, useContext } from 'react';
import AppLayout from '../layout/AppLayout';
import CharacterSelector from './CharacterSelector';
import ChatPanel from './ChatPanel';
import BoardroomHistoryModal from './BoardroomHistoryModal';
import PersonalizeAIBanner from '../shared/PersonalizeAIBanner';
import UsageLimitBadge from '../ui/UsageLimitBadge';
import { usePreferences } from '../../contexts/PreferencesContext';
import { useAuth } from '../../contexts/AuthContext';
import { WebSocketContext, WebSocketContextValue } from '../../contexts/WebSocketContext';
import { useBoardroomChat } from '../../hooks/useBoardroomChat';
import { useModalState } from '../../hooks/useModalState';
import aiCharacterAPI from '../../services/aiCharacterAPI';
import userAPI from '../../services/userAPI';
import type { FollowUpMessage } from '../shared/ai-feedback/types';

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
}

export default function Boardroom() {
  const { darkMode } = usePreferences();
  const { isAdmin } = useAuth();
  const { isConnected } = useContext(WebSocketContext) as WebSocketContextValue;

  const [characters, setCharacters] = useState<AICharacter[]>([]);
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [selectedCharacterName, setSelectedCharacterName] = useState('');
  const [selectedCharacterAvatar, setSelectedCharacterAvatar] = useState<string | null>(null);

  const historyModal = useModalState();

  const {
    conversationId,
    messages,
    isStreaming,
    streamingContent,
    isSending,
    error,
    sendMessage,
    loadConversation,
    clearChat,
  } = useBoardroomChat(selectedCharacterId);

  // Load characters on mount
  useEffect(() => {
    const load = async () => {
      try {
        setLoadingCharacters(true);

        const userFeatures = await userAPI.getCurrentUserFeatures() as UserFeatures;
        const allowedCharacterNames = userFeatures?.system_features?.the_boardroom_model || [];

        const allChars = await aiCharacterAPI.getUserCharacters({ per_page: '50' }) as AICharacter[];

        let chars = allChars;
        if (allowedCharacterNames.length > 0) {
          chars = allChars.filter((char: AICharacter) =>
            allowedCharacterNames.includes(char.internal_name) ||
            allowedCharacterNames.includes(char.name.toLowerCase())
          );
        }

        setCharacters(chars || []);

        // Auto-select first character
        if (chars.length > 0) {
          const first = chars[0];
          setSelectedCharacterId(first.id);
          setSelectedCharacterName(first.name);
          setSelectedCharacterAvatar(first.avatar_url || null);
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

  // Handle character switch
  const handleCharacterChange = useCallback((characterId: string) => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    // If there's an active conversation, confirm
    if (messages.length > 0) {
      const confirmed = window.confirm(
        'Switching characters will start a new conversation. Continue?'
      );
      if (!confirmed) return;
      clearChat();
    }

    setSelectedCharacterId(character.id);
    setSelectedCharacterName(character.name);
    setSelectedCharacterAvatar(character.avatar_url || null);
  }, [characters, messages, clearChat]);

  // Handle new chat
  const handleNewChat = useCallback(() => {
    if (messages.length > 0) {
      const confirmed = window.confirm(
        'Start a new conversation? The current conversation is saved in history.'
      );
      if (!confirmed) return;
    }
    clearChat();
  }, [messages, clearChat]);

  // Handle loading conversation from history
  const handleLoadConversation = useCallback((convId: string, existingMessages: FollowUpMessage[]) => {
    loadConversation(convId, existingMessages);
  }, [loadConversation]);

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
              variant="compact"
              showUpgradeLink={true}
              darkMode={darkMode}
            />

            <CharacterSelector
              characters={characters}
              selectedId={selectedCharacterId}
              onChange={handleCharacterChange}
              loading={loadingCharacters}
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
        <div className="px-4 sm:px-6 pt-4 flex-shrink-0">
          <PersonalizeAIBanner darkMode={darkMode} />
        </div>

        {/* Connection Warning */}
        {!isConnected && !loadingCharacters && (
          <div className={`mx-4 sm:mx-6 mt-2 px-3 py-2 rounded-lg text-sm ${
            darkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-50 text-yellow-700'
          }`}>
            Connecting to server...
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 min-h-0 flex flex-col">
          <ChatPanel
            darkMode={darkMode}
            characterAvatarUrl={selectedCharacterAvatar}
            characterName={selectedCharacterName}
            messages={messages}
            isStreaming={isStreaming}
            streamingContent={streamingContent}
            isSending={isSending}
            conversationId={conversationId}
            error={error}
            onSendMessage={sendMessage}
            isAdmin={isAdmin}
          />
        </div>
      </div>

      {/* History Modal */}
      <BoardroomHistoryModal
        darkMode={darkMode}
        isOpen={historyModal.isOpen}
        onClose={historyModal.close}
        onLoadConversation={handleLoadConversation}
      />
    </AppLayout>
  );
}
