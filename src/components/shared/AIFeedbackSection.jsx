import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import infoIcon from '../../assets/icons/info.svg';
// Removed SVG imports - will use inline SVG components instead
import sendIcon from '../../assets/icons/send.svg';
import brandIcon from '../../assets/icons/brand-icon.svg';
import aiAssistantIcon from '../../assets/icons/ai-assistant.svg';
import AICharacterTypingIndicator, { TypingDots } from '../ai/AICharacterTypingIndicator';
import CircularScoreIndicator from './CircularScoreIndicator';
import { messageAPI } from '../../services/messageAPI';

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
  characterId,
  characterName = 'AI Assistant',
  characterAvatarUrl = null,
  characterDescription = '',
  followUpMessages = [],
  isFollowUpStreaming = false,
  followUpStreamingContent = '',
  completionQuestions = [],
  isAdmin = false,
  analysisHistory = []
}) {
  const [question, setQuestion] = useState('');
  const [displayContent, setDisplayContent] = useState('');
  const [messageRating, setMessageRating] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [questionsSent, setQuestionsSent] = useState(false);
  const [messageRatings, setMessageRatings] = useState({}); // Track ratings for all messages: { messageId: 'positive'|'negative'|null }
  const contentEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const scrollTimeoutRef = useRef(null);


  // Update display content when analysis or streaming is available
  useEffect(() => {
    let source = 'none';
    let content = '';

    if (isStreaming && streamingContent) {
      content = streamingContent;
      source = 'streaming';
      setDisplayContent(streamingContent);
    } else if (streamingContent && !isStreaming) {
      content = streamingContent;
      source = 'streamingContent (not streaming)';
      setDisplayContent(streamingContent);
    } else if (rawAnalysis) {
      content = rawAnalysis;
      source = 'rawAnalysis';
      setDisplayContent(rawAnalysis);
    } else if (feedback?.raw) {
      content = feedback.raw;
      source = 'feedback.raw';
      setDisplayContent(feedback.raw);
    } else if (feedback?.analysis?.raw) {
      content = feedback.analysis.raw;
      source = 'feedback.analysis.raw';
      setDisplayContent(feedback.analysis.raw);
    }

    console.log('[AIFeedbackSection] Display content updated:', {
      source,
      contentLength: content?.length || 0,
      isStreaming,
      hasRawAnalysis: !!rawAnalysis,
      hasFeedback: !!feedback,
      hasStreamingContent: !!streamingContent
    });
  }, [isStreaming, streamingContent, rawAnalysis, feedback]);

  // Reset rating when message changes
  useEffect(() => {
    setMessageRating(null);
  }, [messageId]);

  // Reset questionsSent when new analysis starts
  useEffect(() => {
    setQuestionsSent(false);
  }, [conversationId, analyzing]);

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
    console.log('[AIFeedbackSection] handleSendQuestion called', {
      hasQuestion: !!question.trim(),
      hasOnSendMessage: !!onSendMessage,
      isSendingMessage
    });

    if (!question.trim() || !onSendMessage || isSendingMessage) {
      console.log('[AIFeedbackSection] Not sending - validation failed');
      return;
    }

    const userMessage = question.trim();
    setQuestion('');
    setIsSendingMessage(true);

    console.log('[AIFeedbackSection] Sending message:', userMessage);

    // Add user message to conversation history
    setConversationHistory(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    }]);

    try {
      // Send message through parent component
      await onSendMessage(userMessage);
      console.log('[AIFeedbackSection] Message sent successfully');
    } catch (error) {
      console.error('[AIFeedbackSection] Error sending message:', error);
      // Error handling - could add error message to conversation
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendQuestion();
    }
  };

  const handleSuggestionClick = async (questionText) => {
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
      console.log('[AIFeedbackSection] Completion question sent:', questionText);
    } catch (error) {
      console.error('[AIFeedbackSection] Error sending completion question:', error);
      setQuestionsSent(false); // Re-show buttons on error
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleRating = async (rating) => {
    if (!conversationId || !messageId || ratingLoading) {
      return;
    }

    setRatingLoading(true);
    try {
      let newRating;

      // If clicking the same rating, unset it (toggle off)
      if (messageRating === rating) {
        newRating = null;
      } else {
        // Set the new rating
        newRating = rating;
      }

      await messageAPI.rateMessage(conversationId, messageId, newRating);
      setMessageRating(newRating);
    } catch (error) {
      // Silent failure - rating not critical
    } finally {
      setRatingLoading(false);
    }
  };

  const handleMessageRating = async (msgId, rating) => {
    if (!conversationId || !msgId) {
      return;
    }

    try {
      const currentRating = messageRatings[msgId];
      let newRating;

      // If clicking the same rating, unset it (toggle off)
      if (currentRating === rating) {
        newRating = null;
      } else {
        // Set the new rating
        newRating = rating;
      }

      await messageAPI.rateMessage(conversationId, msgId, newRating);

      // Update state
      setMessageRatings(prev => ({
        ...prev,
        [msgId]: newRating
      }));
    } catch (error) {
      // Silent failure - rating not critical
      console.error('[AIFeedbackSection] Error rating message:', error);
    }
  };

  const formatMetrics = () => {
    const metricsData = metrics || usage;
    if (!metricsData || !isAdmin) return null;

    return (
      <div className={`text-xs mt-2 pt-2 border-t ${
        darkMode ? 'border-[#444444] text-gray-400' : 'border-gray-200 text-gray-500'
      }`}>
        {metricsData.totalTokens && <span>Tokens: {metricsData.totalTokens}</span>}
        {metricsData.tokens_used && <span>Tokens: {metricsData.tokens_used}</span>}
        {metricsData.messages_used && <span className="ml-3">Messages: {metricsData.messages_used}/{metricsData.messages_limit}</span>}
        {metricsData.durationMs && <span className="ml-3">Time: {(metricsData.durationMs / 1000).toFixed(1)}s</span>}
        {metricsData.costCents && <span className="ml-3">Cost: ${(metricsData.costCents / 100).toFixed(3)}</span>}
      </div>
    );
  };

  const renderMessageRating = (msgId) => {
    if (!msgId) return null;

    const rating = messageRatings[msgId];

    return (
      <div className="flex gap-1.5 mt-1.5">
        <button
          onClick={() => handleMessageRating(msgId, 'positive')}
          className={`hover:opacity-70 transition-all ${
            rating === 'positive' ? 'scale-110 opacity-100' : 'opacity-60'
          }`}
          title="Good response"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill={rating === 'positive' ? 'currentColor' : 'none'}
            className={`w-3.5 h-3.5 ${
              rating === 'positive'
                ? darkMode ? 'text-green-400' : 'text-green-600'
                : darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            <path
              d="M6.25 18.75H3.75C3.05964 18.75 2.5 18.1904 2.5 17.5V10C2.5 9.30964 3.05964 8.75 3.75 8.75H6.25M11.25 7.5V3.75C11.25 2.36929 10.1307 1.25 8.75 1.25L6.25 8.75V18.75H14.65C15.2688 18.7563 15.7926 18.2926 15.85 17.675L16.85 9.175C16.9269 8.35894 16.3106 7.64687 15.495 7.57C15.4467 7.56566 15.3983 7.56332 15.35 7.5625H11.25Z"
              stroke="currentColor"
              strokeWidth={rating === 'positive' ? "2" : "1.5"}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          onClick={() => handleMessageRating(msgId, 'negative')}
          className={`hover:opacity-70 transition-all ${
            rating === 'negative' ? 'scale-110 opacity-100' : 'opacity-60'
          }`}
          title="Bad response"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill={rating === 'negative' ? 'currentColor' : 'none'}
            className={`w-3.5 h-3.5 ${
              rating === 'negative'
                ? darkMode ? 'text-red-400' : 'text-red-600'
                : darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            <path
              d="M13.75 1.25H16.25C16.9404 1.25 17.5 1.80964 17.5 2.5V10C17.5 10.6904 16.9404 11.25 16.25 11.25H13.75M8.75 12.5V16.25C8.75 17.6307 9.86929 18.75 11.25 18.75L13.75 11.25V1.25H5.35C4.73117 1.24375 4.20738 1.70738 4.15 2.325L3.15 10.825C3.07312 11.6411 3.68944 12.3531 4.505 12.43C4.55334 12.4343 4.60168 12.4367 4.65 12.4375H8.75Z"
              stroke="currentColor"
              strokeWidth={rating === 'negative' ? "2" : "1.5"}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    );
  };

  const renderConversationHistory = () => {
    // Include ALL completed analyses from history
    const allCompletedAnalyses = analysisHistory;

    // Add current streaming/completed analysis if it exists and has content
    const currentAnalysis = (isStreaming && streamingContent) || (displayContent && messageId)
      ? {
          role: 'assistant',
          type: 'analysis',
          content: isStreaming ? streamingContent : (rawAnalysis || displayContent),
          structured: structuredAnalysis,
          messageId: messageId,
          usage: feedback?.usage,
          timestamp: new Date().toISOString(),
          isStreaming: isStreaming
        }
      : null;

    console.log('[AIFeedbackSection] Rendering conversation history:', {
      totalAnalysisHistory: analysisHistory.length,
      completedAnalyses: allCompletedAnalyses.length,
      conversationHistory: conversationHistory.length,
      followUpMessages: followUpMessages.length,
      hasCurrentAnalysis: !!currentAnalysis,
      currentIsStreaming: currentAnalysis?.isStreaming,
      analysisHistoryIds: analysisHistory.map(a => a.messageId),
      currentMessageId: messageId
    });

    // Combine all messages in chronological order
    const allMessages = [
      ...allCompletedAnalyses.map(msg => ({ ...msg, type: 'analysis' })),
      ...conversationHistory.map(msg => ({ ...msg, type: 'user' })),
      ...followUpMessages.map(msg => ({ ...msg, type: 'assistant' }))
    ];

    // Add current analysis if it exists and is not already in the history
    if (currentAnalysis && !allCompletedAnalyses.find(a => a.messageId === currentAnalysis.messageId)) {
      allMessages.push(currentAnalysis);
    }

    // Sort by timestamp
    const sortedMessages = allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    console.log('[AIFeedbackSection] Sorted messages:', sortedMessages.map(m => ({
      type: m.type,
      timestamp: m.timestamp,
      messageId: m.messageId,
      isStreaming: m.isStreaming,
      contentPreview: m.content?.substring(0, 50) || m.structured ? 'structured' : 'no content'
    })));

    return (
      <div className="mt-6 space-y-3">
        <div className={`border-t pt-4 ${darkMode ? 'border-[#444444]' : 'border-gray-200'}`}>
          <h4 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Conversation
          </h4>

          {sortedMessages.map((msg, idx) => {
            // For analysis type messages, render structured analysis or raw content
            if (msg.type === 'analysis') {
              return (
                <div key={msg.messageId || `analysis-${msg.timestamp}-${idx}`} className="mb-4">
                  <div className="flex gap-2 justify-start">
                    <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {characterAvatarUrl ? (
                        <img src={characterAvatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <img src={brandIcon} alt="" className="w-3 h-3" />
                      )}
                    </div>
                    <div className="flex-1">
                      {/* Show content (markdown) */}
                      {msg.content && (
                        <div className={`rounded-xl p-2.5 sm:p-3 ${
                          darkMode ? 'bg-[#2d2d2d]' : 'bg-zinc-100'
                        }`}>
                          <div className={`prose prose-sm max-w-none ${
                            darkMode
                              ? 'prose-invert prose-pre:bg-gray-800 prose-pre:text-gray-200'
                              : 'prose-pre:bg-gray-100 prose-pre:text-gray-800'
                          } font-inter font-normal text-xs sm:text-sm leading-[20px] sm:leading-[22px] ${
                            darkMode ? 'text-white' : 'text-zinc-950'
                          }`}>
                            <ReactMarkdown
                              remarkPlugins={[remarkGfm]}
                              components={{
                                h1: ({children}) => <h1 className={`text-lg sm:text-xl font-semibold mt-4 mb-2 ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</h1>,
                                h2: ({children}) => <h2 className={`text-base sm:text-lg font-semibold mt-3 mb-2 ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</h2>,
                                h3: ({children}) => <h3 className={`text-sm sm:text-base font-semibold mt-2 mb-1 ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</h3>,
                                h4: ({children}) => <h4 className={`text-xs sm:text-sm font-semibold mt-2 mb-1 ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</h4>,
                                p: ({children}) => <p className={`mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</p>,
                                ul: ({children}) => <ul className={`list-disc ml-5 mb-3 space-y-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</ul>,
                                ol: ({children}) => <ol className={`list-decimal ml-5 mb-3 space-y-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</ol>,
                                li: ({children}) => <li className={`${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</li>,
                                blockquote: ({children}) => (
                                  <blockquote className={`border-l-4 pl-4 my-3 ${
                                    darkMode
                                      ? 'border-gray-600 text-gray-300'
                                      : 'border-gray-300 text-gray-700'
                                  }`}>
                                    {children}
                                  </blockquote>
                                ),
                                code: ({inline, children}) => {
                                  if (inline) {
                                    return (
                                      <code className={`px-1 py-0.5 rounded text-xs ${
                                        darkMode
                                          ? 'bg-gray-800 text-purple-300'
                                          : 'bg-gray-100 text-purple-700'
                                      }`}>
                                        {children}
                                      </code>
                                    );
                                  }
                                  return (
                                    <code className={`block p-3 rounded-lg overflow-x-auto text-xs ${
                                      darkMode
                                        ? 'bg-gray-900 text-gray-200'
                                        : 'bg-gray-50 text-gray-800'
                                    }`}>
                                      {children}
                                    </code>
                                  );
                                },
                                pre: ({children}) => (
                                  <pre className={`rounded-lg overflow-x-auto my-3 ${
                                    darkMode
                                      ? 'bg-gray-900'
                                      : 'bg-gray-50'
                                  }`}>
                                    {children}
                                  </pre>
                                ),
                                strong: ({children}) => <strong className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</strong>,
                                em: ({children}) => <em className={`italic ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</em>,
                                hr: () => <hr className={`my-4 ${darkMode ? 'border-gray-700' : 'border-gray-300'}`} />,
                                a: ({href, children}) => (
                                  <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`underline hover:no-underline ${
                                      darkMode
                                        ? 'text-purple-400 hover:text-purple-300'
                                        : 'text-purple-600 hover:text-purple-700'
                                    }`}
                                  >
                                    {children}
                                  </a>
                                ),
                                table: ({children}) => (
                                  <table className={`min-w-full divide-y my-3 ${
                                    darkMode
                                      ? 'divide-gray-700'
                                      : 'divide-gray-300'
                                  }`}>
                                    {children}
                                  </table>
                                ),
                                th: ({children}) => (
                                  <th className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                                    darkMode
                                      ? 'bg-gray-800 text-gray-300'
                                      : 'bg-gray-100 text-gray-700'
                                  }`}>
                                    {children}
                                  </th>
                                ),
                                td: ({children}) => (
                                  <td className={`px-3 py-2 text-xs ${
                                    darkMode
                                      ? 'text-gray-200 border-gray-700'
                                      : 'text-gray-800 border-gray-200'
                                  }`}>
                                    {children}
                                  </td>
                                ),
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>
                            {msg.isStreaming && (
                              <span className="inline-flex ml-1">
                                <TypingDots darkMode={darkMode} size="sm" />
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Show structured analysis if available */}
                      {msg.structured && (
                        <div className={`rounded-lg px-3 py-2 text-sm mt-2 ${
                          darkMode ? 'bg-[#2d2d2d] text-gray-200' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {renderStructuredAnalysis(msg.structured)}
                        </div>
                      )}
                      {msg.messageId && !msg.isStreaming && (
                        <div className="mt-1.5">
                          {renderMessageRating(msg.messageId)}
                        </div>
                      )}
                      {isAdmin && msg.usage && !msg.isStreaming && (
                        <div className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {msg.usage.totalTokens && <span>Tokens: {msg.usage.totalTokens}</span>}
                          {msg.usage.durationMs && <span className="ml-3">Time: {(msg.usage.durationMs / 1000).toFixed(1)}s</span>}
                          {msg.usage.costCents && <span className="ml-3">Cost: ${(msg.usage.costCents / 100).toFixed(3)}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            // Regular user/assistant messages
            return (
              <div key={msg.messageId || `message-${msg.timestamp}-${idx}`} className={`mb-3 ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
                <div className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {characterAvatarUrl ? (
                        <img src={characterAvatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <img src={brandIcon} alt="" className="w-3 h-3" />
                      )}
                    </div>
                  )}

                  <div>
                    <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? darkMode
                          ? 'bg-zenible-primary text-white'
                          : 'bg-zenible-primary text-white'
                        : darkMode
                          ? 'bg-[#2d2d2d] text-gray-200'
                          : 'bg-gray-100 text-gray-800'
                    }`}>
                      {msg.role === 'assistant' ? (
                        <div className={`prose prose-sm max-w-none ${
                          darkMode
                            ? 'prose-invert prose-pre:bg-gray-800 prose-pre:text-gray-200'
                            : 'prose-pre:bg-gray-100 prose-pre:text-gray-800'
                        }`}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({children}) => <h1 className={`text-base font-semibold mt-2 mb-1 ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</h1>,
                              h2: ({children}) => <h2 className={`text-sm font-semibold mt-2 mb-1 ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</h2>,
                              h3: ({children}) => <h3 className={`text-sm font-semibold mt-1 mb-1 ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</h3>,
                              h4: ({children}) => <h4 className={`text-xs font-semibold mt-1 mb-1 ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</h4>,
                              p: ({children}) => <p className={`mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</p>,
                              ul: ({children}) => <ul className={`list-disc ml-4 mb-2 space-y-0.5 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</ul>,
                              ol: ({children}) => <ol className={`list-decimal ml-4 mb-2 space-y-0.5 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</ol>,
                              li: ({children}) => <li className={`${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</li>,
                              blockquote: ({children}) => (
                                <blockquote className={`border-l-2 pl-2 my-2 ${
                                  darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
                                }`}>
                                  {children}
                                </blockquote>
                              ),
                              code: ({inline, children}) => {
                                if (inline) {
                                  return (
                                    <code className={`px-1 py-0.5 rounded text-xs ${
                                      darkMode ? 'bg-gray-800 text-purple-300' : 'bg-gray-100 text-purple-700'
                                    }`}>
                                      {children}
                                    </code>
                                  );
                                }
                                return (
                                  <code className={`block p-2 rounded-lg overflow-x-auto text-xs ${
                                    darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-800'
                                  }`}>
                                    {children}
                                  </code>
                                );
                              },
                              pre: ({children}) => (
                                <pre className={`rounded-lg overflow-x-auto my-2 ${
                                  darkMode ? 'bg-gray-900' : 'bg-gray-50'
                                }`}>
                                  {children}
                                </pre>
                              ),
                              strong: ({children}) => <strong className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</strong>,
                              em: ({children}) => <em className={`italic ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</em>,
                              hr: () => <hr className={`my-2 ${darkMode ? 'border-gray-700' : 'border-gray-300'}`} />,
                              a: ({href, children}) => (
                                <a
                                  href={href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className={`underline hover:no-underline ${
                                    darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                                  }`}
                                >
                                  {children}
                                </a>
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        msg.content
                      )}
                    </div>

                    {/* Rating buttons for assistant messages */}
                    {msg.role === 'assistant' && msg.messageId && renderMessageRating(msg.messageId)}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Show streaming message */}
          {isFollowUpStreaming && (
            <div className="flex gap-2 mb-3 justify-start">
              <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {characterAvatarUrl ? (
                  <img src={characterAvatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <img src={brandIcon} alt="" className="w-3 h-3" />
                )}
              </div>

              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                darkMode ? 'bg-[#2d2d2d] text-gray-200' : 'bg-gray-100 text-gray-800'
              }`}>
                {followUpStreamingContent ? (
                  <div className={`prose prose-sm max-w-none ${
                    darkMode
                      ? 'prose-invert prose-pre:bg-gray-800 prose-pre:text-gray-200'
                      : 'prose-pre:bg-gray-100 prose-pre:text-gray-800'
                  }`}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        h1: ({children}) => <h1 className={`text-base font-semibold mt-2 mb-1 ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</h1>,
                        h2: ({children}) => <h2 className={`text-sm font-semibold mt-2 mb-1 ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</h2>,
                        h3: ({children}) => <h3 className={`text-sm font-semibold mt-1 mb-1 ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</h3>,
                        h4: ({children}) => <h4 className={`text-xs font-semibold mt-1 mb-1 ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</h4>,
                        p: ({children}) => <p className={`mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</p>,
                        ul: ({children}) => <ul className={`list-disc ml-4 mb-2 space-y-0.5 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</ul>,
                        ol: ({children}) => <ol className={`list-decimal ml-4 mb-2 space-y-0.5 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</ol>,
                        li: ({children}) => <li className={`${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</li>,
                        blockquote: ({children}) => (
                          <blockquote className={`border-l-2 pl-2 my-2 ${
                            darkMode ? 'border-gray-600 text-gray-300' : 'border-gray-300 text-gray-700'
                          }`}>
                            {children}
                          </blockquote>
                        ),
                        code: ({inline, children}) => {
                          if (inline) {
                            return (
                              <code className={`px-1 py-0.5 rounded text-xs ${
                                darkMode ? 'bg-gray-800 text-purple-300' : 'bg-gray-100 text-purple-700'
                              }`}>
                                {children}
                              </code>
                            );
                          }
                          return (
                            <code className={`block p-2 rounded-lg overflow-x-auto text-xs ${
                              darkMode ? 'bg-gray-900 text-gray-200' : 'bg-gray-50 text-gray-800'
                            }`}>
                              {children}
                            </code>
                          );
                        },
                        pre: ({children}) => (
                          <pre className={`rounded-lg overflow-x-auto my-2 ${
                            darkMode ? 'bg-gray-900' : 'bg-gray-50'
                          }`}>
                            {children}
                          </pre>
                        ),
                        strong: ({children}) => <strong className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</strong>,
                        em: ({children}) => <em className={`italic ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</em>,
                        hr: () => <hr className={`my-2 ${darkMode ? 'border-gray-700' : 'border-gray-300'}`} />,
                        a: ({href, children}) => (
                          <a
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`underline hover:no-underline ${
                              darkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                            }`}
                          >
                            {children}
                          </a>
                        ),
                      }}
                    >
                      {followUpStreamingContent}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <span className="inline-flex">
                    <TypingDots darkMode={darkMode} size="sm" />
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStructuredAnalysis = (structuredData = null) => {
    // If structuredData is explicitly passed (even if undefined), use only that
    // Don't fall back to global state when rendering individual messages
    const structured = structuredData !== null && structuredData !== undefined
      ? structuredData
      : (structuredAnalysis || feedback?.structured || feedback?.analysis?.structured);
    if (!structured) return null;

    return (
      <div className="space-y-6 mt-4">
        {/* Circular Score Indicator */}
        {structured.score !== undefined && structured.score !== null && (
          <>
            <div className="flex justify-center">
              <CircularScoreIndicator
                score={structured.score}
                darkMode={darkMode}
                size={140}
                strokeWidth={10}
              />
            </div>
            {/* Divider */}
            <div className={`border-t ${darkMode ? 'border-[#444444]' : 'border-gray-200'}`} />
          </>
        )}

        {/* Strengths */}
        {structured.strengths && structured.strengths.length > 0 && (
          <div>
            <h4 className={`font-semibold text-sm mb-2 flex items-center gap-2 ${
              darkMode ? 'text-green-400' : 'text-green-700'
            }`}>
              ✅ Strengths
            </h4>
            <ul className="space-y-1">
              {structured.strengths.map((strength, i) => (
                <li key={i} className={`text-xs pl-4 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  • {strength}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses */}
        {structured.weaknesses && structured.weaknesses.length > 0 && (
          <div>
            <h4 className={`font-semibold text-sm mb-2 flex items-center gap-2 ${
              darkMode ? 'text-red-400' : 'text-red-600'
            }`}>
              ❌ Weaknesses
            </h4>
            <ul className="space-y-1">
              {structured.weaknesses.map((weakness, i) => (
                <li key={i} className={`text-xs pl-4 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  • {weakness}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements */}
        {structured.improvements && structured.improvements.length > 0 && (
          <div>
            <h4 className={`font-semibold text-sm mb-2 flex items-center gap-2 ${
              darkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>
              💡 Improvements
            </h4>
            <ul className="space-y-1">
              {structured.improvements.map((improvement, i) => (
                <li key={i} className={`text-xs pl-4 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  • {improvement}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
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
          <div className="flex flex-col items-center justify-center h-full gap-1.5">
            {/* AI Avatar and Info */}
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-violet-50 rounded-full border-[1.167px] border-[#ddd6ff] flex items-center justify-center overflow-hidden">
                  {characterAvatarUrl ? (
                    <img
                      src={characterAvatarUrl}
                      alt={characterName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img src={aiAssistantIcon} alt="" className="w-5 h-5 sm:w-6 sm:h-6" />
                  )}
                </div>
                {/* Character Name */}
                <span className={`text-xs font-medium ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {characterName}
                </span>
              </div>

              {/* Character Description Box */}
              {characterDescription && (
                <div className={`px-4 py-3 rounded-lg text-xs max-w-[280px] min-h-[60px] flex items-center ${
                  darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'
                }`}>
                  {characterDescription}
                </div>
              )}
            </div>

            {/* Title and Description */}
            <div className="flex flex-col items-center gap-0.5 mt-2 px-4">
              <h4 className={`font-inter font-semibold text-base sm:text-lg text-center ${
                darkMode ? 'text-white' : 'text-zinc-950'
              }`}>
                Expert Ready
              </h4>
              <p className={`font-inter font-normal text-xs sm:text-sm text-center max-w-[320px] leading-relaxed ${
                darkMode ? 'text-[#a0a0a0]' : 'text-zinc-500'
              }`}>
                Paste your proposal and click "Analyze" to get personalized feedback and improvement suggestions.
              </p>
            </div>
          </div>
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
              {false && (displayContent || isStreaming || analyzing) && (
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
                          components={{
                            // Custom component overrides for better styling
                            h1: ({children}) => <h1 className={`text-lg sm:text-xl font-semibold mt-4 mb-2 ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</h1>,
                            h2: ({children}) => <h2 className={`text-base sm:text-lg font-semibold mt-3 mb-2 ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</h2>,
                            h3: ({children}) => <h3 className={`text-sm sm:text-base font-semibold mt-2 mb-1 ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</h3>,
                            h4: ({children}) => <h4 className={`text-xs sm:text-sm font-semibold mt-2 mb-1 ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</h4>,
                            p: ({children}) => <p className={`mb-3 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</p>,
                            ul: ({children}) => <ul className={`list-disc ml-5 mb-3 space-y-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</ul>,
                            ol: ({children}) => <ol className={`list-decimal ml-5 mb-3 space-y-1 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</ol>,
                            li: ({children}) => <li className={`${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</li>,
                            blockquote: ({children}) => (
                              <blockquote className={`border-l-4 pl-4 my-3 ${
                                darkMode
                                  ? 'border-gray-600 text-gray-300'
                                  : 'border-gray-300 text-gray-700'
                              }`}>
                                {children}
                              </blockquote>
                            ),
                            code: ({inline, children}) => {
                              if (inline) {
                                return (
                                  <code className={`px-1 py-0.5 rounded text-xs ${
                                    darkMode
                                      ? 'bg-gray-800 text-purple-300'
                                      : 'bg-gray-100 text-purple-700'
                                  }`}>
                                    {children}
                                  </code>
                                );
                              }
                              return (
                                <code className={`block p-3 rounded-lg overflow-x-auto text-xs ${
                                  darkMode
                                    ? 'bg-gray-900 text-gray-200'
                                    : 'bg-gray-50 text-gray-800'
                                }`}>
                                  {children}
                                </code>
                              );
                            },
                            pre: ({children}) => (
                              <pre className={`rounded-lg overflow-x-auto my-3 ${
                                darkMode
                                  ? 'bg-gray-900'
                                  : 'bg-gray-50'
                              }`}>
                                {children}
                              </pre>
                            ),
                            strong: ({children}) => <strong className={`font-semibold ${darkMode ? 'text-white' : 'text-zinc-950'}`}>{children}</strong>,
                            em: ({children}) => <em className={`italic ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{children}</em>,
                            hr: () => <hr className={`my-4 ${darkMode ? 'border-gray-700' : 'border-gray-300'}`} />,
                            a: ({href, children}) => (
                              <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`underline hover:no-underline ${
                                  darkMode
                                    ? 'text-purple-400 hover:text-purple-300'
                                    : 'text-purple-600 hover:text-purple-700'
                                }`}
                              >
                                {children}
                              </a>
                            ),
                            table: ({children}) => (
                              <table className={`min-w-full divide-y my-3 ${
                                darkMode
                                  ? 'divide-gray-700'
                                  : 'divide-gray-300'
                              }`}>
                                {children}
                              </table>
                            ),
                            th: ({children}) => (
                              <th className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                                darkMode
                                  ? 'bg-gray-800 text-gray-300'
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {children}
                              </th>
                            ),
                            td: ({children}) => (
                              <td className={`px-3 py-2 text-xs ${
                                darkMode
                                  ? 'text-gray-200 border-gray-700'
                                  : 'text-gray-800 border-gray-200'
                              }`}>
                                {children}
                              </td>
                            ),
                          }}
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
              {(structuredAnalysis || feedback?.structured) && !analyzing && !isProcessing && !isStreaming && (
                <div className="mt-1">
                  {renderStructuredAnalysis()}
                </div>
              )}

              {/* 3. Metrics - Small info text */}
              {!analyzing && !isProcessing && !isStreaming && formatMetrics()}

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
              {(displayContent || structuredAnalysis) && !analyzing && !isProcessing && !isStreaming && messageId && (
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => handleRating('positive')}
                    disabled={ratingLoading}
                    className={`hover:opacity-70 transition-all ${
                      messageRating === 'positive' ? 'scale-110 opacity-100' : 'opacity-60'
                    } ${ratingLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    title="Good response"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill={messageRating === 'positive' ? 'currentColor' : 'none'}
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        messageRating === 'positive'
                          ? darkMode ? 'text-green-400' : 'text-green-600'
                          : darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      <path
                        d="M6.25 18.75H3.75C3.05964 18.75 2.5 18.1904 2.5 17.5V10C2.5 9.30964 3.05964 8.75 3.75 8.75H6.25M11.25 7.5V3.75C11.25 2.36929 10.1307 1.25 8.75 1.25L6.25 8.75V18.75H14.65C15.2688 18.7563 15.7926 18.2926 15.85 17.675L16.85 9.175C16.9269 8.35894 16.3106 7.64687 15.495 7.57C15.4467 7.56566 15.3983 7.56332 15.35 7.5625H11.25Z"
                        stroke="currentColor"
                        strokeWidth={messageRating === 'positive' ? "2" : "1.5"}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleRating('negative')}
                    disabled={ratingLoading}
                    className={`hover:opacity-70 transition-all ${
                      messageRating === 'negative' ? 'scale-110 opacity-100' : 'opacity-60'
                    } ${ratingLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    title="Bad response"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 20 20"
                      fill={messageRating === 'negative' ? 'currentColor' : 'none'}
                      className={`w-4 h-4 sm:w-5 sm:h-5 ${
                        messageRating === 'negative'
                          ? darkMode ? 'text-red-400' : 'text-red-600'
                          : darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      <path
                        d="M13.75 1.25H16.25C16.9404 1.25 17.5 1.80964 17.5 2.5V10C17.5 10.6904 16.9404 11.25 16.25 11.25H13.75M8.75 12.5V16.25C8.75 17.6307 9.86929 18.75 11.25 18.75L13.75 11.25V1.25H5.35C4.73117 1.24375 4.20738 1.70738 4.15 2.325L3.15 10.825C3.07312 11.6411 3.68944 12.3531 4.505 12.43C4.55334 12.4343 4.60168 12.4367 4.65 12.4375H8.75Z"
                        stroke="currentColor"
                        strokeWidth={messageRating === 'negative' ? "2" : "1.5"}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
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

                console.log('[AIFeedbackSection] Dynamic questions render check:', {
                  shouldShow,
                  hasCompletedAnalysis,
                  messageId,
                  analysisHistoryLength: analysisHistory.length,
                  analyzing,
                  isProcessing,
                  isStreaming,
                  hasError: !!feedback?.error,
                  questionsSent,
                  questionsCount: completionQuestions.length
                });

                return shouldShow && (
                  <div className="flex flex-col gap-1.5 sm:gap-2">
                    {completionQuestions
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((q) => (
                        <button
                          key={q.id}
                          onClick={() => handleSuggestionClick(q.question_text)}
                          disabled={isSendingMessage}
                          className={`w-full h-8 sm:h-9 px-2 sm:px-3 py-1.5 sm:py-2 rounded-[10px] border font-inter font-medium text-xs sm:text-sm transition-colors text-left ${
                            darkMode
                              ? 'bg-[#3a3a3a] border-[#4a4a4a] text-white hover:bg-[#444444]'
                              : 'bg-white border-zinc-100 text-zinc-950 hover:bg-gray-50'
                          } ${isSendingMessage ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {q.question_text}
                        </button>
                      ))}
                  </div>
                );
              })()}

              {/* 4. Conversation History - Chat bubbles */}
              {renderConversationHistory()}

              <div ref={contentEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Input Section */}
      <div className="p-1.5 sm:p-2">
        <div className={`border rounded-xl flex items-center pl-3 sm:pl-4 pr-1 sm:pr-1.5 py-1 sm:py-1.5 ${
          darkMode
            ? 'bg-[#2d2d2d] border-[#4a4a4a]'
            : 'bg-neutral-50 border-neutral-200'
        }`}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me a question..."
            disabled={analyzing || isProcessing || isSendingMessage}
            className={`flex-1 bg-transparent font-inter font-normal text-xs sm:text-sm outline-none min-w-0 ${
              darkMode
                ? 'text-white placeholder:text-[#888888] disabled:opacity-50'
                : 'text-zinc-950 placeholder:text-zinc-500 disabled:opacity-50'
            }`}
          />
          <button
            onClick={handleSendQuestion}
            disabled={analyzing || isProcessing || isSendingMessage || !question.trim()}
            className="w-8 h-8 sm:w-9 sm:h-9 bg-zenible-primary rounded-[10px] flex items-center justify-center hover:bg-purple-600 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src={sendIcon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}