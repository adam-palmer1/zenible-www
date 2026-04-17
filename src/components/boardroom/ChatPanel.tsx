import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import ConversationHistory from '../shared/ai-feedback/ConversationHistory';
import ChatInput from '../shared/ai-feedback/ChatInput';
import DeleteMessageModal from '../shared/ai-feedback/DeleteMessageModal';
import MeetingPickerModal from './MeetingPickerModal';
import type { FollowUpMessage, MessageAttachment, LinkedMeeting } from '../shared/ai-feedback/types';
import messageAPI from '../../services/messageAPI';

interface MeetingContext {
  summary?: string;
  key_points?: string[];
  action_items?: string[];
  transcript?: string;
}

interface ChatPanelProps {
  darkMode: boolean;
  characterAvatarUrl: string | null;
  characterName: string;
  characterDescription: string;
  messages: FollowUpMessage[];
  isStreaming: boolean;
  streamingContent: string;
  isSending: boolean;
  conversationId: string | null;
  error: string | null;
  onSendMessage: (text: string) => Promise<void>;
  onCancelStreaming?: () => void;
  onDeleteMessage?: (messageId: string) => Promise<void> | void;
  deletingMessageId?: string | null;
  isAdmin?: boolean;
  conversationStarters?: string[];
  pendingAttachments?: MessageAttachment[];
  pendingMeeting?: LinkedMeeting | null;
  uploadingFiles?: boolean;
  onFileSelect?: (files: FileList) => void;
  onRemoveAttachment?: (documentId: string) => void;
  onRemoveMeeting?: () => void;
  onLinkMeeting?: (meeting: LinkedMeeting, context: MeetingContext) => void;
}

import { parseSuggestedQuestions } from '../../utils/parseSuggestedQuestions';

export default function ChatPanel({
  darkMode,
  characterAvatarUrl,
  characterName,
  characterDescription,
  messages,
  isStreaming,
  streamingContent,
  isSending,
  conversationId,
  error,
  onSendMessage,
  onCancelStreaming,
  onDeleteMessage,
  deletingMessageId = null,
  isAdmin = false,
  conversationStarters = [],
  pendingAttachments = [],
  pendingMeeting,
  uploadingFiles = false,
  onFileSelect,
  onRemoveAttachment,
  onRemoveMeeting,
  onLinkMeeting,
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('');
  const [messageRatings, setMessageRatings] = useState<Record<string, string | null>>({});
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showMeetingPicker, setShowMeetingPicker] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const userScrolledRef = useRef(false);

  // Auto-scroll to bottom on new messages or streaming,
  // but only if the user hasn't scrolled up to read history
  useEffect(() => {
    if (!userScrolledRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent, isStreaming]);

  // Detect user scroll — only re-enable auto-scroll when user
  // scrolls back to the bottom themselves
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    if (distanceFromBottom > 100) {
      userScrolledRef.current = true;
    } else if (distanceFromBottom <= 20) {
      userScrolledRef.current = false;
    }
  }, []);

  const handleSend = useCallback(async (text?: string) => {
    const messageText = (text || inputValue).trim();
    if (!messageText && pendingAttachments.length === 0 && !pendingMeeting) return;
    if (!text) setInputValue('');
    userScrolledRef.current = false;
    await onSendMessage(messageText || '(attached content)');
  }, [inputValue, onSendMessage, pendingAttachments, pendingMeeting]);

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

  const handleRequestDelete = useCallback((msgId: string) => {
    setPendingDeleteId(msgId);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!pendingDeleteId || !onDeleteMessage) return;
    try {
      await onDeleteMessage(pendingDeleteId);
    } finally {
      setPendingDeleteId(null);
    }
  }, [pendingDeleteId, onDeleteMessage]);

  const handleLinkMeeting = useCallback(() => {
    setShowMeetingPicker(true);
  }, []);

  const handleMeetingSelected = useCallback((meeting: LinkedMeeting, context: MeetingContext) => {
    setShowMeetingPicker(false);
    onLinkMeeting?.(meeting, context);
  }, [onLinkMeeting]);

  // Strip suggested_questions from messages and extract from last assistant message
  const { cleanedMessages, suggestedQuestions } = useMemo(() => {
    let questions: string[] = [];
    const cleaned = messages.map((msg, idx) => {
      if (msg.role !== 'assistant') return msg;

      const { cleanContent, questions: parsed } = parseSuggestedQuestions(msg.content);

      // Only use questions from the last assistant message
      const isLastAssistant = !messages.slice(idx + 1).some(m => m.role === 'assistant');
      if (isLastAssistant && parsed.length > 0) {
        questions = parsed;
      }

      if (cleanContent !== msg.content) {
        return { ...msg, content: cleanContent };
      }
      return msg;
    });

    // Hide questions if the last message is from the user (they already typed something)
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === 'user') {
      questions = [];
    }

    return { cleanedMessages: cleaned, suggestedQuestions: questions };
  }, [messages]);

  const hasMessages = cleanedMessages.length > 0 || isStreaming;

  return (
    <div className={`rounded-xl border shadow-sm flex-1 flex flex-col min-h-[300px] sm:min-h-[400px] overflow-hidden ${
      darkMode
        ? 'bg-[#1e1e1e] border-[#333333]'
        : 'bg-white border-neutral-200'
    }`}>
      {/* Header */}
      <div className={`p-3 sm:p-4 border-b flex-shrink-0 ${
        darkMode ? 'border-[#333333]' : 'border-neutral-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-violet-50 rounded-full border-[1.167px] border-[#ddd6ff] flex items-center justify-center overflow-hidden flex-shrink-0">
            {characterAvatarUrl ? (
              <img src={characterAvatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-base sm:text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {characterName || 'AI Expert'}
            </h3>
            {characterDescription && (
              <p className={`text-xs sm:text-sm line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {characterDescription}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 p-3 sm:p-4 overflow-y-auto"
      >
        {hasMessages ? (
          <>
            <ConversationHistory
              darkMode={darkMode}
              characterAvatarUrl={characterAvatarUrl}
              isAdmin={isAdmin}
              analysisHistory={[]}
              conversationHistory={[]}
              followUpMessages={cleanedMessages}
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
              onDeleteMessage={onDeleteMessage ? handleRequestDelete : undefined}
              deletingMessageId={deletingMessageId}
            />

            {/* Suggested Questions */}
            {suggestedQuestions.length > 0 && !isStreaming && !isSending && (
              <div className="mt-3 flex flex-wrap gap-1.5 sm:gap-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(q)}
                    className={`px-3 py-2 rounded-[10px] border font-inter font-medium text-xs sm:text-sm transition-colors ${
                      darkMode
                        ? 'bg-[#3a3a3a] border-[#4a4a4a] text-white hover:bg-[#444444]'
                        : 'bg-white border-zinc-200 text-zinc-950 hover:bg-gray-50'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-violet-50 rounded-full border-[1.167px] border-[#ddd6ff] flex items-center justify-center overflow-hidden">
                    {characterAvatarUrl ? (
                      <img src={characterAvatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <svg className="w-6 h-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>
                  <span className={`text-xs font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {characterName || 'AI Expert'}
                  </span>
                </div>
                {characterDescription && (
                  <div className={`px-4 py-3 rounded-lg text-xs max-w-[280px] min-h-[60px] flex items-center ${
                    darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {characterDescription}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-center gap-0.5 mt-2 px-4">
                <h4 className={`font-semibold text-base sm:text-lg ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Expert Ready
                </h4>
                <p className={`font-normal text-xs sm:text-sm text-center max-w-[320px] ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Send a message to start your conversation
                </p>
              </div>

              {conversationStarters.length > 0 && (
                <div className="grid grid-cols-2 gap-2 mt-4 w-full max-w-[480px]">
                  {conversationStarters.map((starter, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(starter)}
                      className={`px-3 py-2 rounded-[10px] border font-inter font-medium text-xs sm:text-sm text-left transition-colors ${
                        darkMode
                          ? 'bg-[#3a3a3a] border-[#4a4a4a] text-white hover:bg-[#444444]'
                          : 'bg-white border-zinc-200 text-zinc-950 hover:bg-gray-50'
                      }`}
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className={`mx-3 sm:mx-4 mb-2 px-3 py-2 rounded-lg text-sm ${
          darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-50 text-red-600'
        }`}>
          {error}
        </div>
      )}

      {/* Chat Input */}
      <ChatInput
        darkMode={darkMode}
        question={inputValue}
        analyzing={false}
        isProcessing={isSending || isStreaming}
        isSendingMessage={isSending}
        onQuestionChange={setInputValue}
        onKeyDown={handleKeyDown}
        onSend={() => handleSend()}
        onFileSelect={onFileSelect}
        pendingAttachments={pendingAttachments}
        onRemoveAttachment={onRemoveAttachment}
        pendingMeeting={pendingMeeting}
        onRemoveMeeting={onRemoveMeeting}
        onLinkMeeting={onLinkMeeting ? handleLinkMeeting : undefined}
        uploadingFiles={uploadingFiles}
        isStreaming={isStreaming || isSending}
        onStop={onCancelStreaming}
      />

      {/* Meeting Picker Modal */}
      {showMeetingPicker && (
        <MeetingPickerModal
          darkMode={darkMode}
          onSelect={handleMeetingSelected}
          onClose={() => setShowMeetingPicker(false)}
        />
      )}

      {/* Delete Message Modal */}
      <DeleteMessageModal
        darkMode={darkMode}
        open={!!pendingDeleteId}
        onClose={() => setPendingDeleteId(null)}
        onConfirm={handleConfirmDelete}
        loading={!!pendingDeleteId && deletingMessageId === pendingDeleteId}
      />
    </div>
  );
}
