import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import infoIcon from '../../assets/icons/info.svg';
// Removed SVG imports - will use inline SVG components instead
import brandIcon from '../../assets/icons/brand-icon.svg';
import AICharacterTypingIndicator, { TypingDots } from '../ai/AICharacterTypingIndicator';
import { messageAPI } from '../../services/messageAPI';
import { markdownToPlainText } from './ai-feedback/utils';
import { getMarkdownComponents } from './ai-feedback/markdownComponents';
import EmptyState from './ai-feedback/EmptyState';
import ConversationHistory from './ai-feedback/ConversationHistory';
import StructuredAnalysis from './ai-feedback/StructuredAnalysis';
import MetricsDisplay from './ai-feedback/MetricsDisplay';
import FeedbackActions from './ai-feedback/FeedbackActions';
import CompletionQuestions from './ai-feedback/CompletionQuestions';
import ChatInput from './ai-feedback/ChatInput';
import type { AIFeedbackSectionProps } from './ai-feedback/types';

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
  characterId: _characterId,
  characterName = 'AI Assistant',
  characterAvatarUrl = null,
  characterDescription = '',
  followUpMessages = [],
  isFollowUpStreaming = false,
  followUpStreamingContent = '',
  completionQuestions = [],
  isAdmin = false,
  analysisHistory = []
}: AIFeedbackSectionProps) {
  const [question, setQuestion] = useState('');
  const [displayContent, setDisplayContent] = useState('');
  const [messageRating, setMessageRating] = useState<string | null>(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; content: string; timestamp: string }>>([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [questionsSent, setQuestionsSent] = useState(false);
  const [messageRatings, setMessageRatings] = useState<Record<string, string | null>>({}); // Track ratings for all messages: { messageId: 'positive'|'negative'|null }
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null); // Track which message was copied for clipboard feedback
  const contentEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  // Update display content when analysis or streaming is available
  useEffect(() => {
    if (isStreaming && streamingContent) {
      setDisplayContent(streamingContent);
    } else if (streamingContent && !isStreaming) {
      setDisplayContent(streamingContent);
    } else if (rawAnalysis) {
      setDisplayContent(rawAnalysis);
    } else if (feedback?.raw) {
      setDisplayContent(feedback.raw);
    } else if (feedback?.analysis?.raw) {
      setDisplayContent(feedback.analysis.raw);
    } else if (!isStreaming && !streamingContent && !rawAnalysis && !feedback?.raw && !feedback?.analysis?.raw) {
      setDisplayContent('');
    }

  }, [isStreaming, streamingContent, rawAnalysis, feedback]);

  // Clear display content when new analysis starts
  useEffect(() => {
    if (analyzing) {
      setDisplayContent('');
    }
  }, [analyzing]);

  // Reset rating when message changes
  useEffect(() => {
    setMessageRating(null);
  }, [messageId]);

  // Reset questionsSent when new analysis starts
  useEffect(() => {
    setQuestionsSent(false);
  }, [conversationId, analyzing]);

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
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [displayContent, followUpStreamingContent, followUpMessages, isUserScrolling, isScrolledToBottom]);

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
      console.error('[AIFeedbackSection] Error sending message:', error);
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

    // Hide buttons immediately
    setQuestionsSent(true);

    // Send message directly (don't just fill input)
    setIsSendingMessage(true);

    // Add user message to conversation history
    setConversationHistory(prev => [...prev, {
      role: 'user',
      content: questionText,
      timestamp: new Date().toISOString()
    }]);

    try {
      await onSendMessage(questionText);
    } catch (error) {
      console.error('[AIFeedbackSection] Error sending completion question:', error);
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

  const handleRating = async (rating: string) => {
    if (!conversationId || !messageId || ratingLoading) {
      return;
    }

    setRatingLoading(true);
    try {
      await toggleRating(messageId, messageRating, rating, setMessageRating);
    } catch {
      // Silent failure - rating not critical
    } finally {
      setRatingLoading(false);
    }
  };

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

  // Copy message content to clipboard
  const handleCopyMessage = async (msgId: string, content: string) => {
    try {
      const plainText = markdownToPlainText(content);
      await navigator.clipboard.writeText(plainText);
      setCopiedMessageId(msgId);
      setTimeout(() => setCopiedMessageId(null), 2000);
    } catch (err) {
      console.error('[AIFeedbackSection] Failed to copy message:', err);
    }
  };

  return (
    <div className={`rounded-xl border shadow-sm h-full flex flex-col min-h-[300px] sm:min-h-[400px] max-h-full ${
      darkMode
        ? 'bg-[#1e1e1e] border-[#333333]'
        : 'bg-white border-neutral-200'
    }`}>
      {/* Header */}
      <div className={`p-3 sm:p-4 border-b flex items-center justify-between ${
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
          <img src={infoIcon} alt="" className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>

      {/* Content */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-3 sm:p-4 overflow-auto overflow-y-auto overflow-x-visible"
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

              {/* Main AI Analysis Response - NOW SHOWN IN CONVERSATION HISTORY BELOW */}
              {/* eslint-disable-next-line no-constant-binary-expression -- dead code kept for reference */}
              {false && Boolean(displayContent || isStreaming || analyzing) && (
                <div className={`rounded-xl p-2.5 sm:p-3 ${
                  darkMode ? 'bg-[#2d2d2d]' : 'bg-zinc-100'
                }`}>
                  {/* Raw markdown content */}
                  {(displayContent || isStreaming || analyzing) && (
                    <>
                      <div className={`prose prose-sm max-w-none ${
                        darkMode
                          ? 'prose-invert prose-pre:bg-gray-800 prose-pre:text-gray-200'
                          : 'prose-pre:bg-gray-100 prose-pre:text-gray-800'
                      } font-inter font-normal text-xs sm:text-sm leading-[20px] sm:leading-[22px] ${
                        darkMode ? 'text-white' : 'text-zinc-950'
                      }`}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={getMarkdownComponents(darkMode, 'analysis')}
                        >
                          {displayContent}
                        </ReactMarkdown>
                        {(isStreaming || (analyzing && !isProcessing && !displayContent)) && (
                          <span className="inline-flex ml-1">
                            <TypingDots darkMode={darkMode} size="sm" />
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 2. Structured Analysis - Outside as separate section */}
              {(structuredAnalysis != null || feedback?.structured != null) && !analyzing && !isProcessing && !isStreaming && (
                <div className="mt-1">
                  <StructuredAnalysis
                    darkMode={darkMode}
                    structuredAnalysis={structuredAnalysis}
                    feedbackStructured={feedback?.structured}
                    feedbackAnalysisStructured={feedback?.analysis?.structured}
                  />
                </div>
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

              {/* Feedback Actions */}
              {(displayContent || structuredAnalysis != null) && !analyzing && !isProcessing && !isStreaming && messageId && (
                <FeedbackActions
                  darkMode={darkMode}
                  messageRating={messageRating}
                  ratingLoading={ratingLoading}
                  onRate={handleRating}
                />
              )}

              {/* Completion Question Buttons - Show after any completed analysis */}
              {(() => {
                const hasCompletedAnalysis = messageId || analysisHistory.length > 0;
                const shouldShow = hasCompletedAnalysis &&
                  !analyzing &&
                  !isProcessing &&
                  !isStreaming &&
                  !feedback?.error &&
                  !questionsSent &&
                  completionQuestions.length > 0;

                return shouldShow && (
                  <CompletionQuestions
                    darkMode={darkMode}
                    completionQuestions={completionQuestions}
                    isSendingMessage={isSendingMessage}
                    onSuggestionClick={handleSuggestionClick}
                  />
                );
              })()}

              {/* 4. Conversation History - Chat bubbles */}
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
              />

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
      />
    </div>
  );
}
