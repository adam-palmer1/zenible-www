import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { brandIcon } from '../../../assets/logos';
import { TypingDots } from '../../ai/AICharacterTypingIndicator';
import CopyButton from './CopyButton';
import MessageRating from './MessageRating';
import StructuredAnalysis from './StructuredAnalysis';
import MeetingMiniCard from './MeetingMiniCard';
import MessageAttachments from './MessageAttachments';
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
  onDeleteMessage?: (messageId: string) => void;
  deletingMessageId?: string | null;
}

interface DeleteButtonProps {
  messageId: string;
  darkMode: boolean;
  isDeleting: boolean;
  onDelete: (messageId: string) => void;
}

function DeleteButton({ messageId, darkMode, isDeleting, onDelete }: DeleteButtonProps) {
  return (
    <button
      onClick={() => onDelete(messageId)}
      disabled={isDeleting}
      aria-label="Delete message"
      title="Delete message"
      className={`p-2 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        darkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-600'
      }`}
    >
      {isDeleting ? (
        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
        </svg>
      )}
    </button>
  );
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
  onDeleteMessage,
  deletingMessageId = null,
}: ConversationHistoryProps) {
  const currentAnalysis = useMemo(() => {
    // Only create currentAnalysis for COMPLETED analyses (not streaming)
    // Streaming is handled by a dedicated block below the sortedMessages loop
    if (!isStreaming && displayContent && messageId) {
      return {
        role: 'assistant',
        type: 'analysis',
        content: rawAnalysis || displayContent,
        structured: structuredAnalysis,
        messageId: messageId,
        usage: feedback?.usage,
        timestamp: new Date().toISOString(),
        isStreaming: false
      };
    }
    return null;
  }, [isStreaming, displayContent, messageId, rawAnalysis, structuredAnalysis, feedback?.usage]);

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
          const msgAvatar = msg.characterAvatarUrl ?? characterAvatarUrl;
          if (msg.type === 'analysis') {
            return (
              <div key={msg.messageId || `analysis-${msg.timestamp}-${idx}`} className="mb-4">
                <div className="flex gap-2 justify-start">
                  <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {msgAvatar ? (
                      <img src={msgAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <img src={brandIcon} alt="" className="w-3 h-3" />
                    )}
                  </div>
                  <div className="flex-1">
                    {msg.content && (
                      <div className="flex items-start gap-1">
                      <div className={`rounded-xl p-2.5 sm:p-3 flex-1 min-w-0 ${
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
                      <div className="flex-shrink-0 pt-0.5 flex items-start">
                          <CopyButton
                            messageId={msg.messageId || `analysis-${idx}`}
                            content={msg.content}
                            darkMode={darkMode}
                            copiedMessageId={copiedMessageId}
                            onCopy={onCopyMessage}
                          />
                          {onDeleteMessage && msg.messageId && (
                            <DeleteButton
                              messageId={msg.messageId}
                              darkMode={darkMode}
                              isDeleting={deletingMessageId === msg.messageId}
                              onDelete={onDeleteMessage}
                            />
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
            <div key={msg.messageId || `message-${msg.timestamp}-${idx}`} className={`mb-3 group ${msg.role === 'user' ? 'flex justify-end' : ''}`}>
              <div className={`flex gap-2 ${msg.role === 'user' ? 'justify-end items-start' : 'justify-start'}`}>
                {msg.role === 'user' && onDeleteMessage && msg.messageId && (
                  <div
                    className={`flex-shrink-0 pt-0.5 transition-opacity ${
                      deletingMessageId === msg.messageId ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 focus-within:opacity-100'
                    }`}
                  >
                    <DeleteButton
                      messageId={msg.messageId}
                      darkMode={darkMode}
                      isDeleting={deletingMessageId === msg.messageId}
                      onDelete={onDeleteMessage}
                    />
                  </div>
                )}

                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {msgAvatar ? (
                      <img src={msgAvatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <img src={brandIcon} alt="" className="w-3 h-3" />
                    )}
                  </div>
                )}

                <div>
                  <div className={`flex items-start gap-1 ${msg.role === 'assistant' ? 'max-w-[80%]' : ''}`}>
                  <div className={`${msg.role !== 'assistant' ? 'max-w-[80%]' : ''} rounded-lg px-3 py-2 text-sm flex-1 min-w-0 ${
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
                          components={messageComponents}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    )}
                  </div>
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 pt-0.5 flex items-start">
                      <CopyButton
                        messageId={msg.messageId || `msg-${idx}`}
                        content={msg.content || ''}
                        darkMode={darkMode}
                        copiedMessageId={copiedMessageId}
                        onCopy={onCopyMessage}
                      />
                      {onDeleteMessage && msg.messageId && (
                        <DeleteButton
                          messageId={msg.messageId}
                          darkMode={darkMode}
                          isDeleting={deletingMessageId === msg.messageId}
                          onDelete={onDeleteMessage}
                        />
                      )}
                    </div>
                  )}
                  </div>

                  {/* Attachments */}
                  {msg.attachments && msg.attachments.length > 0 && (
                    <MessageAttachments attachments={msg.attachments} darkMode={darkMode} />
                  )}

                  {/* Linked meeting mini card */}
                  {msg.linkedMeeting && (
                    <MeetingMiniCard meeting={msg.linkedMeeting} darkMode={darkMode} />
                  )}

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

        {/* First response streaming - dedicated block outside sortedMessages for reliable rendering */}
        {isStreaming && (
          <div className="mb-4">
            <div className="flex gap-2 justify-start">
              <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {characterAvatarUrl ? (
                  <img src={characterAvatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <img src={brandIcon} alt="" className="w-3 h-3" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start gap-1">
                  <div className={`rounded-xl p-2.5 sm:p-3 flex-1 min-w-0 ${
                    darkMode ? 'bg-[#2d2d2d]' : 'bg-zinc-100'
                  }`}>
                    {streamingContent ? (
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
                          {streamingContent}
                        </ReactMarkdown>
                        <span className="inline-flex ml-1">
                          <TypingDots darkMode={darkMode} size="sm" />
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex">
                        <TypingDots darkMode={darkMode} size="sm" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isFollowUpStreaming && (
          <div className="flex gap-2 mb-3 justify-start">
            <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {characterAvatarUrl ? (
                <img src={characterAvatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <img src={brandIcon} alt="" className="w-3 h-3" />
              )}
            </div>

            <div className="flex items-start gap-1 max-w-[80%]">
            <div className={`rounded-lg px-3 py-2 text-sm flex-1 min-w-0 ${
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
                    components={messageComponents}
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
            {followUpStreamingContent && (
              <div className="flex-shrink-0 pt-0.5">
                <CopyButton
                  messageId="streaming"
                  content={followUpStreamingContent}
                  darkMode={darkMode}
                  copiedMessageId={copiedMessageId}
                  onCopy={onCopyMessage}
                />
              </div>
            )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
