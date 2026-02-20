import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import brandIcon from '../../../assets/icons/brand-icon.svg';
import { TypingDots } from '../../ai/AICharacterTypingIndicator';
import CopyButton from './CopyButton';
import MessageRating from './MessageRating';
import StructuredAnalysis from './StructuredAnalysis';
import { getMarkdownComponents } from './markdownComponents';
import { ConversationMessage, MetricsData, AnalysisHistoryItem, FollowUpMessage } from './types';

interface ConversationHistoryProps {
  darkMode: boolean;
  characterAvatarUrl: string | null;
  isAdmin: boolean;
  analysisHistory: AnalysisHistoryItem[];
  conversationHistory: Array<{ role: string; content: string; timestamp: string }>;
  followUpMessages: FollowUpMessage[];
  isStreaming: boolean;
  streamingContent: string;
  displayContent: string;
  rawAnalysis: string;
  structuredAnalysis: unknown;
  messageId: string;
  feedback: { usage?: unknown; structured?: unknown; analysis?: { structured?: unknown } } | null;
  isFollowUpStreaming: boolean;
  followUpStreamingContent: string;
  messageRatings: Record<string, string | null>;
  copiedMessageId: string | null;
  onMessageRate: (msgId: string, rating: string) => void;
  onCopyMessage: (msgId: string, content: string) => void;
}

export default function ConversationHistory({
  darkMode,
  characterAvatarUrl,
  isAdmin,
  analysisHistory,
  conversationHistory,
  followUpMessages,
  isStreaming,
  streamingContent,
  displayContent,
  rawAnalysis,
  structuredAnalysis,
  messageId,
  feedback,
  isFollowUpStreaming,
  followUpStreamingContent,
  messageRatings,
  copiedMessageId,
  onMessageRate,
  onCopyMessage,
}: ConversationHistoryProps) {
  const currentAnalysis = useMemo(() => {
    if ((isStreaming && streamingContent) || (displayContent && messageId)) {
      return {
        role: 'assistant',
        type: 'analysis',
        content: isStreaming ? streamingContent : (rawAnalysis || displayContent),
        structured: structuredAnalysis,
        messageId: messageId,
        usage: feedback?.usage,
        timestamp: new Date().toISOString(),
        isStreaming: isStreaming
      };
    }
    return null;
  }, [isStreaming, streamingContent, displayContent, messageId, rawAnalysis, structuredAnalysis, feedback?.usage]);

  const sortedMessages = useMemo(() => {
    const allMessages: ConversationMessage[] = [
      ...analysisHistory.map(msg => ({ ...msg, type: 'analysis' })),
      ...conversationHistory.map(msg => ({ ...msg, type: 'user' })),
      ...followUpMessages.map(msg => ({ ...msg, type: 'assistant' }))
    ];

    if (currentAnalysis && !analysisHistory.find(a => a.messageId === currentAnalysis.messageId)) {
      allMessages.push(currentAnalysis);
    }

    return allMessages.sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [analysisHistory, conversationHistory, followUpMessages, currentAnalysis]);

  const analysisComponents = useMemo(() => getMarkdownComponents(darkMode, 'analysis'), [darkMode]);
  const messageComponents = useMemo(() => getMarkdownComponents(darkMode, 'message'), [darkMode]);

  return (
    <div className="mt-6 space-y-3">
      <div className={`border-t pt-4 ${darkMode ? 'border-[#444444]' : 'border-gray-200'}`}>
        <h4 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Conversation
        </h4>

        {sortedMessages.map((msg, idx) => {
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
                    {msg.content && (
                      <div className={`rounded-xl p-2.5 sm:p-3 relative ${
                        darkMode ? 'bg-[#2d2d2d]' : 'bg-zinc-100'
                      }`}>
                        <div className="absolute top-1 right-1 sm:top-1 sm:right-1">
                          <CopyButton
                            messageId={msg.messageId || `analysis-${idx}`}
                            content={msg.content}
                            darkMode={darkMode}
                            copiedMessageId={copiedMessageId}
                            onCopy={onCopyMessage}
                          />
                        </div>

                        <div className={`prose prose-sm max-w-none ${
                          darkMode
                            ? 'prose-invert prose-pre:bg-gray-800 prose-pre:text-gray-200'
                            : 'prose-pre:bg-gray-100 prose-pre:text-gray-800'
                        } font-inter font-normal text-xs sm:text-sm leading-[20px] sm:leading-[22px] ${
                          darkMode ? 'text-white' : 'text-zinc-950'
                        }`}>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={analysisComponents}
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
                    {msg.structured != null && (
                      <div className={`rounded-lg px-3 py-2 text-sm mt-2 ${
                        darkMode ? 'bg-[#2d2d2d] text-gray-200' : 'bg-gray-100 text-gray-800'
                      }`}>
                        <StructuredAnalysis
                          darkMode={darkMode}
                          structuredData={msg.structured}
                        />
                      </div>
                    )}
                    {msg.messageId && !msg.isStreaming && (
                      <div className="mt-1.5">
                        <MessageRating
                          messageId={msg.messageId}
                          darkMode={darkMode}
                          rating={messageRatings[msg.messageId] || null}
                          onRate={onMessageRate}
                        />
                      </div>
                    )}
                    {isAdmin && msg.usage != null && !msg.isStreaming && (() => {
                      const usageData = msg.usage as MetricsData;
                      return (
                        <div className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {usageData.totalTokens && <span>Tokens: {usageData.totalTokens}</span>}
                          {usageData.durationMs && <span className="ml-3">Time: {(usageData.durationMs / 1000).toFixed(1)}s</span>}
                          {usageData.costCents && <span className="ml-3">Cost: ${(usageData.costCents / 100).toFixed(3)}</span>}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          }

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
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm relative ${
                    msg.role === 'user'
                      ? darkMode
                        ? 'bg-zenible-primary text-white'
                        : 'bg-zenible-primary text-white'
                      : darkMode
                        ? 'bg-[#2d2d2d] text-gray-200'
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <>
                        <div className="absolute top-1 right-1">
                          <CopyButton
                            messageId={msg.messageId || `msg-${idx}`}
                            content={msg.content || ''}
                            darkMode={darkMode}
                            copiedMessageId={copiedMessageId}
                            onCopy={onCopyMessage}
                          />
                        </div>

                        <div className={`prose prose-sm max-w-none ${
                        darkMode
                          ? 'prose-invert prose-pre:bg-gray-800 prose-pre:text-gray-200'
                          : 'prose-pre:bg-gray-100 prose-pre:text-gray-800'
                      }`}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={messageComponents}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                      </>
                    ) : (
                      msg.content
                    )}
                  </div>

                  {msg.role === 'assistant' && msg.messageId && (
                    <MessageRating
                      messageId={msg.messageId}
                      darkMode={darkMode}
                      rating={messageRatings[msg.messageId] || null}
                      onRate={onMessageRate}
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {isFollowUpStreaming && (
          <div className="flex gap-2 mb-3 justify-start">
            <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {characterAvatarUrl ? (
                <img src={characterAvatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <img src={brandIcon} alt="" className="w-3 h-3" />
              )}
            </div>

            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm relative ${
              darkMode ? 'bg-[#2d2d2d] text-gray-200' : 'bg-gray-100 text-gray-800'
            }`}>
              {followUpStreamingContent ? (
                <>
                  <div className="absolute top-1 right-1">
                    <CopyButton
                      messageId="streaming"
                      content={followUpStreamingContent}
                      darkMode={darkMode}
                      copiedMessageId={copiedMessageId}
                      onCopy={onCopyMessage}
                    />
                  </div>

                  <div className={`prose prose-sm max-w-none ${
                  darkMode
                    ? 'prose-invert prose-pre:bg-gray-800 prose-pre:text-gray-200'
                    : 'prose-pre:bg-gray-100 prose-pre:text-gray-800'
                }`}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={messageComponents}
                  >
                    {followUpStreamingContent}
                  </ReactMarkdown>
                </div>
                </>
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
}
