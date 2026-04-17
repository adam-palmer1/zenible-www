import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { usePublicChat } from '../hooks/usePublicChat';
import { usePublicCharacters } from '../hooks/usePublicCharacters';
import ChatPanel from '../../../components/boardroom/ChatPanel';
import type { FollowUpMessage } from '../../../components/shared/ai-feedback/types';
import { APP_URL } from '../../../utils/hostname';

export default function PublicChat() {
  const {
    messages,
    isStreaming,
    streamingContent,
    characterInfo,
    messagesRemaining,
    maxMessages,
    limitType,
    isLoading,
    error,
    sendMessage,
    selectCharacter,
  } = usePublicChat();

  const { characters, loading: charsLoading } = usePublicCharacters();
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);
  const [changePrompt, setChangePrompt] = useState<{ characterId: string; characterName: string } | null>(null);

  // Auto-select first character once loaded
  useEffect(() => {
    if (characters.length > 0 && !selectedCharId) {
      const first = characters.find(c => c.is_accessible);
      if (!first) return;
      setSelectedCharId(first.id);
      selectCharacter(first.id, first.name, first.avatar_url);
    }
  }, [characters]);

  const handleCharacterChange = useCallback((charId: string) => {
    if (charId === selectedCharId) return;
    const char = characters.find(c => c.id === charId);
    if (!char || !char.is_accessible) return;

    if (messages.length > 0) {
      setChangePrompt({ characterId: char.id, characterName: char.name });
      return;
    }

    setSelectedCharId(charId);
    selectCharacter(char.id, char.name, char.avatar_url);
  }, [selectedCharId, characters, selectCharacter, messages]);

  const handleConfirmChange = useCallback(() => {
    if (!changePrompt) return;
    const char = characters.find(c => c.id === changePrompt.characterId);
    if (!char) return;
    setSelectedCharId(char.id);
    selectCharacter(char.id, char.name, char.avatar_url);
    setChangePrompt(null);
  }, [changePrompt, characters, selectCharacter]);

  const handleCancelChange = useCallback(() => {
    setChangePrompt(null);
  }, []);

  const selectedChar = characters.find(c => c.id === selectedCharId);

  // Map public chat messages to FollowUpMessage format for ChatPanel
  const followUpMessages: FollowUpMessage[] = useMemo(() =>
    messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'assistant',
      content: msg.content,
      messageId: msg.id,
      timestamp: msg.createdAt,
      characterAvatarUrl: msg.role === 'assistant' ? (selectedChar?.avatar_url || null) : null,
    })),
    [messages, selectedChar]
  );

  const isLimitReached = messagesRemaining !== null && messagesRemaining <= 0;

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* Light mode container — matches boardroom layout */}
      <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
        {/* Main Content: Sidebar + Chat — identical to Boardroom.tsx line 275 */}
        <div className="flex flex-col lg:flex-row" style={{ height: '600px' }}>
          {/* Expert Sidebar — scrollable, copied from Boardroom.tsx lines 277-324, light mode */}
          {!charsLoading && characters.length > 0 && (
            <div className="w-full lg:w-[260px] flex-shrink-0 flex lg:flex-col gap-3 p-3 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-neutral-200">
              {characters.map((char) => {
                const gated = !char.is_accessible;
                return (
                  <button
                    key={char.id}
                    onClick={() => !gated && handleCharacterChange(char.id)}
                    className={`flex items-start gap-3 px-4 py-4 rounded-xl border transition-colors text-left min-w-[220px] lg:min-w-0 lg:w-full ${
                      gated
                        ? 'bg-gray-50 border-neutral-200 cursor-default opacity-60'
                        : selectedCharId === char.id
                          ? 'bg-white border-zenible-primary shadow-sm'
                          : 'bg-white border-neutral-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      {char.avatar_url ? (
                        <img
                          src={char.avatar_url}
                          alt=""
                          className={`w-10 h-10 rounded-full object-cover ${gated ? 'grayscale' : ''}`}
                        />
                      ) : (
                        <div className={`w-10 h-10 rounded-full bg-violet-50 border border-[#ddd6ff] flex items-center justify-center ${gated ? 'grayscale' : ''}`}>
                          <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                      {gated && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
                          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold ${
                        gated ? 'text-gray-400' : selectedCharId === char.id ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {char.name}
                      </div>
                      {char.description && (
                        <p className={`text-xs mt-0.5 line-clamp-2 ${gated ? 'text-gray-300' : 'text-gray-400'}`}>
                          {char.description}
                        </p>
                      )}
                      {gated && char.required_plan_name && (
                        <p className="text-[10px] mt-1 text-zenible-primary font-medium">
                          Upgrade to {char.required_plan_name}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Loading state for sidebar */}
          {charsLoading && (
            <div className="w-full lg:w-[260px] flex-shrink-0 flex lg:flex-col gap-3 p-3 border-b lg:border-b-0 lg:border-r border-neutral-200">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 rounded-xl bg-gray-50 border border-neutral-200 animate-pulse" />
              ))}
            </div>
          )}

          {/* Chat Area */}
          <div className="flex-1 min-h-0 flex flex-col">
            {/* Usage limit badge */}
            {maxMessages !== null && messagesRemaining !== null && (
              <div className="flex-shrink-0 px-3 pt-3 pb-1">
                <div className="bg-white rounded-lg border border-neutral-200 px-3 py-2 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {limitType === 'daily'
                      ? 'Daily messages remaining'
                      : limitType === 'monthly'
                        ? 'Monthly messages remaining'
                        : 'Messages remaining'}
                  </span>
                  <span className={`text-xs font-semibold ${
                    messagesRemaining <= 0
                      ? 'text-red-500'
                      : messagesRemaining <= Math.ceil(maxMessages * 0.2)
                        ? 'text-amber-500'
                        : 'text-gray-700'
                  }`}>
                    {messagesRemaining} / {maxMessages}
                  </span>
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600" />
              </div>
            ) : (
              <div className="relative flex-1 flex flex-col min-h-0">
                <ChatPanel
                  darkMode={false}
                  characterAvatarUrl={selectedChar?.avatar_url || null}
                  characterName={selectedChar?.name || 'AI Expert'}
                  characterDescription={selectedChar?.description || ''}
                  messages={followUpMessages}
                  isStreaming={isStreaming}
                  streamingContent={streamingContent}
                  isSending={false}
                  conversationId={null}
                  error={error}
                  onSendMessage={isLimitReached ? async () => {} : sendMessage}
                  conversationStarters={selectedChar?.metadata?.conversation_starters || []}
                />

                {/* Limit reached overlay */}
                {isLimitReached && (
                  <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-3">
                    <a
                      href={`${APP_URL}/register`}
                      className="block w-full text-center px-4 py-2.5 bg-zenible-primary text-white text-sm font-medium rounded-xl hover:bg-purple-600 transition-colors"
                    >
                      Sign up for unlimited access &rarr;
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Character Switch Confirmation Modal */}
      {changePrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-xl shadow-xl p-6 bg-white">
            <h3 className="text-lg font-semibold mb-2 text-gray-900">
              Switch Character
            </h3>
            <p className="text-sm mb-6 text-gray-600">
              Continue this conversation with <span className="font-medium">{changePrompt.characterName}</span>?
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={handleCancelChange}
                className="px-4 py-2 text-sm rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200"
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
    </div>
  );
}
