import React, { useState, useCallback, useRef, useEffect } from 'react';
import ConversationHistory from '../shared/ai-feedback/ConversationHistory';
import ChatInput from '../shared/ai-feedback/ChatInput';
import type { FollowUpMessage } from '../shared/ai-feedback/types';
import messageAPI from '../../services/messageAPI';

interface ChatPanelProps {
  darkMode: boolean;
  characterAvatarUrl: string | null;
  characterName: string;
  messages: FollowUpMessage[];
  isStreaming: boolean;
  streamingContent: string;
  isSending: boolean;
  conversationId: string | null;
  error: string | null;
  onSendMessage: (text: string) => Promise<void>;
  isAdmin?: boolean;
}

export default function ChatPanel({
  darkMode,
  characterAvatarUrl,
  characterName,
  messages,
  isStreaming,
  streamingContent,
  isSending,
  conversationId,
  error,
  onSendMessage,
  isAdmin = false,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [messageRatings, setMessageRatings] = useState<Record<string, string | null>>({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  // Auto-scroll to bottom on new messages or streaming
  useEffect(() => {
    if (!userScrolledRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent, isStreaming]);

  // Detect user scroll
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    userScrolledRef.current = scrollHeight - scrollTop - clientHeight > 100;
  }, []);

  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text) return;
    setInputValue('');
    userScrolledRef.current = false;
    await onSendMessage(text);
  }, [inputValue, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleMessageRate = useCallback(async (msgId: string, rating: string) => {
    if (!conversationId) return;
    try {
      const newRating = messageRatings[msgId] === rating ? null : rating;
      setMessageRatings(prev => ({ ...prev, [msgId]: newRating }));
      await messageAPI.rateMessage(
        conversationId,
        msgId,
        newRating as 'good' | 'bad' | null
      );
    } catch (err) {
      console.error('[Boardroom] Failed to rate message:', err);
    }
  }, [conversationId, messageRatings]);

  const handleCopyMessage = useCallback((msgId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMessageId(msgId);
    setTimeout(() => setCopiedMessageId(null), 2000);
  }, []);

  const hasMessages = messages.length > 0 || isStreaming;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Chat Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 sm:px-6"
      >
        {hasMessages ? (
          <ConversationHistory
            darkMode={darkMode}
            characterAvatarUrl={characterAvatarUrl}
            isAdmin={isAdmin}
            analysisHistory={[]}
            conversationHistory={[]}
            followUpMessages={messages}
            isStreaming={false}
            streamingContent=""
            displayContent=""
            rawAnalysis=""
            structuredAnalysis={null}
            messageId=""
            feedback={null}
            isFollowUpStreaming={isStreaming}
            followUpStreamingContent={streamingContent}
            messageRatings={messageRatings}
            copiedMessageId={copiedMessageId}
            onMessageRate={handleMessageRate}
            onCopyMessage={handleCopyMessage}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center h-full min-h-[300px]">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                darkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                {characterAvatarUrl ? (
                  <img src={characterAvatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <svg className={`w-8 h-8 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                )}
              </div>
              <h3 className={`text-lg font-semibold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Chat with {characterName || 'AI'}
              </h3>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Send a message to start your conversation
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className={`mx-4 sm:mx-6 mb-2 px-3 py-2 rounded-lg text-sm ${
          darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'
        }`}>
          {error}
        </div>
      )}

      {/* Chat Input */}
      <div className="px-2 sm:px-4 pb-4">
        <ChatInput
          darkMode={darkMode}
          question={inputValue}
          analyzing={false}
          isProcessing={isSending || isStreaming}
          isSendingMessage={isSending}
          onQuestionChange={setInputValue}
          onKeyDown={handleKeyDown}
          onSend={handleSend}
        />
      </div>
    </div>
  );
}
