import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
// Removed SVG imports - will use inline SVG components instead
import { brandIcon } from '../../assets/logos';
import AICharacterTypingIndicator from '../ai/AICharacterTypingIndicator';
import { messageAPI } from '../../services/messageAPI';
import logger from '../../utils/logger';
import { markdownToPlainText } from './ai-feedback/utils';
import EmptyState from './ai-feedback/EmptyState';
import ConversationHistory from './ai-feedback/ConversationHistory';
import MetricsDisplay from './ai-feedback/MetricsDisplay';
import CompletionQuestions from './ai-feedback/CompletionQuestions';
import ChatInput from './ai-feedback/ChatInput';
import DeleteMessageModal from './ai-feedback/DeleteMessageModal';
import type { AIFeedbackSectionProps, StructuredAnalysisData } from './ai-feedback/types';

export type { AIFeedbackSectionProps } from './ai-feedback/types';

export default function AIFeedbackSection({
  darkMode,
  feedback,
  analyzing,
  isProcessing,
  isStreaming,
  streamingContent,
  structuredAnalysis,
  rawAnalysis,
  metrics,
  usage,
  conversationId,
  messageId,
  onCancel,
  onSendMessage,
  onDeleteMessage,
  deletingMessageId = null,
  characterName = 'AI Assistant',
  characterAvatarUrl = null,
  characterDescription = '',
  followUpMessages = [],
  isFollowUpStreaming = false,
  followUpStreamingContent = '',
  isAdmin = false,
  analysisHistory = []
}: AIFeedbackSectionProps) {
  const [question, setQuestion] = useState('');
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string; timestamp: string }>>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [questionsSent, setQuestionsSent] = useState(false);
  const [messageRatings, setMessageRatings] = useState<Record<string, string | null>>({}); // Track ratings for all messages: { messageId: 'positive'|'negative'|null }
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null); // Track which message was copied for clipboard feedback
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const contentEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  // Extract AI-generated follow-up questions from structured analysis
  const effectiveQuestions = useMemo(() => {
    const sa = structuredAnalysis as StructuredAnalysisData | null;
    if (sa?.suggested_questions && sa.suggested_questions.length > 0) {
      return sa.suggested_questions.map((q, i) => ({
        id: `ai-q-${i}`,
        question_text: q,
        order_index: i,
      }));
    }
    return [];
  }, [structuredAnalysis]);

  const displayContent = useMemo(() => {
    if (analyzing) return '';
    if (isStreaming && streamingContent) return streamingContent;
    if (streamingContent && !isStreaming) return streamingContent;
    if (rawAnalysis) return rawAnalysis;
    if (feedback?.raw) return feedback.raw;
    if (feedback?.analysis?.raw) return feedback.analysis.raw;
    return '';
  }, [analyzing, isStreaming, streamingContent, rawAnalysis, feedback]);

  // Reset questionsSent when new analysis starts
  useEffect(() => {
    setQuestionsSent(false);
  }, [conversationId, analyzing]);

  // Reset questionsSent when new suggestions arrive (from follow-up responses)
  useEffect(() => {
    if (effectiveQuestions.length > 0) {
      setQuestionsSent(false);
    }
  }, [effectiveQuestions]);

  // Clear stale state when conversation changes
  useEffect(() => {
    setMessageRatings({});
    setConversationHistory([]);
  }, [conversationId]);

  // Check if user is scrolled to bottom (within threshold)
  const isScrolledToBottom = useCallback(() => {
    if (!scrollContainerRef.current) return true;

    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const threshold = 100; // pixels from bottom
    return scrollHeight - scrollTop - clientHeight < threshold;
  }, []);

  // Handle scroll events to detect manual scrolling
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current) return;

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Check if user scrolled away from bottom
    const atBottom = isScrolledToBottom();

    if (!atBottom) {
      setIsUserScrolling(true);
    }

    // Reset user scrolling flag after user stops scrolling and is at bottom
    scrollTimeoutRef.current = setTimeout(() => {
      if (isScrolledToBottom()) {
        setIsUserScrolling(false);
      }
    }, 150);
  }, [isScrolledToBottom]);

  // Auto-scroll to bottom when content updates (only if user hasn't scrolled up)
  useEffect(() => {
    if (!scrollContainerRef.current) return;

    // Only auto-scroll if:
    // 1. User hasn't manually scrolled up, OR
    // 2. User is already at the bottom
    if (!isUserScrolling || isScrolledToBottom()) {
      const isActivelyStreaming = isStreaming || isFollowUpStreaming;
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: isActivelyStreaming ? 'instant' : 'smooth'
      });
    }
  }, [displayContent, followUpStreamingContent, followUpMessages, isUserScrolling, isScrolledToBottom, isStreaming, isFollowUpStreaming]);

  // Cleanup scroll timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  const handleCancelAnalysis = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const handleSendQuestion = async () => {
    if (!question.trim() || !onSendMessage || isSendingMessage) {
      return;
    }

    const userMessage = question.trim();
    setQuestion('');
    setIsSendingMessage(true);
    setQuestionsSent(true);

    // Add user message to conversation history
    setConversationHistory(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }]);

    try {
      // Send message through parent component
      await onSendMessage(userMessage);
    } catch (error) {
      logger.error('[AIFeedbackSection] Error sending message:', error);
      // Error handling - could add error message to conversation
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendQuestion();
    }
  };

  const handleSuggestionClick = async (questionText: string) => {
    if (!onSendMessage || isSendingMessage) return;

    const cleanText = questionText.replace(/\?$/, '');

    // Hide buttons immediately
    setQuestionsSent(true);

    // Send message directly (don't just fill input)
    setIsSendingMessage(true);

    // Add user message to conversation history
    setConversationHistory(prev => [...prev, {
      role: 'user',
      content: cleanText,
      timestamp: new Date().toISOString()
    }]);

    try {
      await onSendMessage(cleanText);
    } catch (error) {
      logger.error('[AIFeedbackSection] Error sending completion question:', error);
      setQuestionsSent(false); // Re-show buttons on error
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Shared toggle rating logic
  const toggleRating = useCallback(async (
    msgId: string,
    currentRating: string | null,
    newRating: string,
    onSuccess: (rating: string | null) => void
  ) => {
    if (!conversationId) return;
    const finalRating = currentRating === newRating ? null : newRating;
    await messageAPI.rateMessage(conversationId, msgId, finalRating as 'good' | 'bad' | null);
    onSuccess(finalRating);
  }, [conversationId]);

  const handleMessageRating = async (msgId: string, rating: string) => {
    if (!conversationId || !msgId) {
      return;
    }

    try {
      await toggleRating(msgId, messageRatings[msgId] ?? null, rating, (finalRating) => {
        setMessageRatings(prev => ({ ...prev, [msgId]: finalRating }));
      });
    } catch {
      // Silent failure - rating not critical
    }
  };

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

  // Copy message content to clipboard
  const handleCopyMessage = async (msgId: string, content: string) => {
    try {
      const plainText = markdownToPlainText(content);
      await navigator.clipboard.writeText(plainText);
      setCopiedMessageId(msgId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      logger.error('[AIFeedbackSection] Failed to copy message:', err);
    }
  };

  return (
    <div className={`rounded-xl border shadow-sm h-full flex-1 flex flex-col min-h-[300px] sm:min-h-[400px] overflow-hidden ${
      darkMode
        ? 'bg-[#1e1e1e] border-[#333333]'
        : 'bg-white border-neutral-200'
    }`}>
      {/* Header */}
      <div className={`p-3 sm:p-4 border-b flex items-center justify-between flex-shrink-0 ${
        darkMode ? 'border-[#333333]' : 'border-neutral-200'
      }`}>
        <h3 className={`font-inter font-semibold text-base sm:text-lg ${
          darkMode ? 'text-white' : 'text-zinc-950'
        }`}>Expert Analysis</h3>

        <div className="flex items-center gap-2">
          {(isProcessing || analyzing) && (
            <button
              onClick={handleCancelAnalysis}
              className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                darkMode
                  ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-3 sm:p-4 overflow-y-auto overflow-x-hidden min-h-0 scrollbar-hover"
      >
        {!feedback && !analyzing && !isProcessing && !rawAnalysis && (
          <EmptyState
            darkMode={darkMode}
            characterName={characterName}
            characterAvatarUrl={characterAvatarUrl}
            characterDescription={characterDescription}
          />
        )}

        {(feedback || analyzing || isProcessing || rawAnalysis || structuredAnalysis || isStreaming || followUpMessages.length > 0 || isFollowUpStreaming) && (
          <div className="flex gap-1.5 sm:gap-2">
            {/* AI Avatar */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-violet-100 rounded-full border border-[#c4b4ff] flex items-center justify-center overflow-hidden">
                {characterAvatarUrl ? (
                  <img
                    src={characterAvatarUrl}
                    alt={characterName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img src={brandIcon} alt="" className="w-4 h-4 sm:w-6 sm:h-6" />
                )}
              </div>
              {/* Character Name */}
              <span className={`text-xs font-medium ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                {characterName}
              </span>
            </div>

            {/* Feedback Content */}
            <div className="flex-1 flex flex-col gap-3 sm:gap-4 min-w-0">
              {/* Typing Indicator - only show when processing/analyzing but not yet streaming */}
              {(isProcessing || (analyzing && !isStreaming)) && (
                <AICharacterTypingIndicator
                  isProcessing={isProcessing}
                  isStreaming={false}
                  characterName={characterName}
                  darkMode={darkMode}
                />
              )}

              {/* 3. Metrics - Small info text */}
              {!analyzing && !isProcessing && !isStreaming && (
                <MetricsDisplay
                  darkMode={darkMode}
                  metrics={metrics}
                  usage={usage}
                  isAdmin={isAdmin}
                />
              )}

              {/* Error display */}
              {feedback?.error && (
                <div className={`p-2 rounded-lg text-sm ${
                  darkMode
                    ? 'bg-red-900/30 text-red-300'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {feedback.error}
                </div>
              )}

              {/* Conversation History - Chat bubbles (ratings are inline per message) */}
              <ConversationHistory
                darkMode={darkMode}
                characterAvatarUrl={characterAvatarUrl}
                isAdmin={isAdmin}
                analysisHistory={analysisHistory}
                conversationHistory={conversationHistory}
                followUpMessages={followUpMessages}
                isStreaming={isStreaming}
                streamingContent={streamingContent}
                displayContent={displayContent}
                rawAnalysis={rawAnalysis}
                structuredAnalysis={structuredAnalysis}
                messageId={messageId}
                feedback={feedback}
                isFollowUpStreaming={isFollowUpStreaming}
                followUpStreamingContent={followUpStreamingContent}
                messageRatings={messageRatings}
                copiedMessageId={copiedMessageId}
                onMessageRate={handleMessageRating}
                onCopyMessage={handleCopyMessage}
                onDeleteMessage={onDeleteMessage ? handleRequestDelete : undefined}
                deletingMessageId={deletingMessageId}
              />

              {/* Completion Question Buttons - Show after conversation history */}
              {(() => {
                const hasCompletedAnalysis = messageId || analysisHistory.length > 0;
                const shouldShow = hasCompletedAnalysis &&
                  !analyzing &&
                  !isProcessing &&
                  !isStreaming &&
                  !feedback?.error &&
                  !questionsSent &&
                  effectiveQuestions.length > 0;

                return shouldShow && (
                  <CompletionQuestions
                    darkMode={darkMode}
                    completionQuestions={effectiveQuestions}
                    isSendingMessage={isSendingMessage}
                    onSuggestionClick={handleSuggestionClick}
                  />
                );
              })()}

              <div ref={contentEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Input Section */}
      <ChatInput
        darkMode={darkMode}
        question={question}
        analyzing={analyzing}
        isProcessing={isProcessing}
        isSendingMessage={isSendingMessage}
        onQuestionChange={setQuestion}
        onKeyDown={handleKeyDown}
        onSend={handleSendQuestion}
        isStreaming={isProcessing || analyzing || isStreaming || isFollowUpStreaming}
        onStop={handleCancelAnalysis}
      />

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
