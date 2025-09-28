import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import infoIcon from '../../assets/icons/info.svg';
import thumbsUpIcon from '../../assets/icons/thumbs-up.svg';
import thumbsDownIcon from '../../assets/icons/thumbs-down.svg';
import sendIcon from '../../assets/icons/send.svg';
import brandIcon from '../../assets/icons/brand-icon.svg';
import aiAssistantIcon from '../../assets/icons/ai-assistant.svg';
import AICharacterTypingIndicator, { TypingDots } from '../ai/AICharacterTypingIndicator';
import CircularScoreIndicator from './CircularScoreIndicator';
import { messageAPI } from '../../services/messageAPI';

const suggestionButtons = [
  'Improve pricing strategy',
  'Enhance timeline details',
  'Strengthen value proposition',
  'Ask something else'
];

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
  characterName = 'AI Assistant',
  characterAvatarUrl = null
}) {
  const [question, setQuestion] = useState('');
  const [displayContent, setDisplayContent] = useState('');
  const [messageRating, setMessageRating] = useState(null);
  const [ratingLoading, setRatingLoading] = useState(false);
  const contentEndRef = useRef(null);


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
    }
  }, [isStreaming, streamingContent, rawAnalysis, feedback]);

  // Reset rating when message changes
  useEffect(() => {
    setMessageRating(null);
  }, [messageId]);

  // Auto-scroll to bottom when content updates
  useEffect(() => {
    if (contentEndRef.current) {
      contentEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [displayContent]);

  const handleCancelAnalysis = () => {
    if (onCancel) {
      onCancel();
    }
  };

  const handleRating = async (rating) => {
    if (!conversationId || !messageId || ratingLoading || messageRating === rating) {
      return;
    }

    setRatingLoading(true);
    try {
      await messageAPI.rateMessage(conversationId, messageId, rating);
      setMessageRating(rating);
    } catch (error) {
      console.error('Failed to rate message:', error);
    } finally {
      setRatingLoading(false);
    }
  };

  const formatMetrics = () => {
    const metricsData = metrics || usage;
    if (!metricsData) return null;

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

  const renderStructuredAnalysis = () => {
    const structured = structuredAnalysis || feedback?.structured || feedback?.analysis?.structured;
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

        {/* Improvements */}
        {structured.improvements && structured.improvements.length > 0 && (
          <div>
            <h4 className={`font-semibold text-sm mb-2 flex items-center gap-2 ${
              darkMode ? 'text-yellow-400' : 'text-yellow-600'
            }`}>
              💡 Areas for Improvement
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

        {/* Suggestions */}
        {structured.suggestions && structured.suggestions.length > 0 && (
          <div>
            <h4 className={`font-semibold text-sm mb-2 flex items-center gap-2 ${
              darkMode ? 'text-blue-400' : 'text-blue-700'
            }`}>
              📝 Suggestions
            </h4>
            <ul className="space-y-1">
              {structured.suggestions.map((suggestion, i) => (
                <li key={i} className={`text-xs pl-4 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  • {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Red Flags */}
        {structured.red_flags && structured.red_flags.length > 0 && (
          <div>
            <h4 className={`font-semibold text-sm mb-2 flex items-center gap-2 ${
              darkMode ? 'text-red-400' : 'text-red-600'
            }`}>
              ⚠️ Red Flags
            </h4>
            <ul className="space-y-1">
              {structured.red_flags.map((flag, i) => (
                <li key={i} className={`text-xs pl-4 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  • {flag}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Elements */}
        {structured.missing_elements && structured.missing_elements.length > 0 && (
          <div>
            <h4 className={`font-semibold text-sm mb-2 flex items-center gap-2 ${
              darkMode ? 'text-orange-400' : 'text-orange-600'
            }`}>
              ❌ Missing Elements
            </h4>
            <ul className="space-y-1">
              {structured.missing_elements.map((element, i) => (
                <li key={i} className={`text-xs pl-4 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  • {element}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Key Requirements */}
        {structured.key_requirements && structured.key_requirements.length > 0 && (
          <div>
            <h4 className={`font-semibold text-sm mb-2 flex items-center gap-2 ${
              darkMode ? 'text-purple-400' : 'text-purple-700'
            }`}>
              🎯 Key Requirements
            </h4>
            <ul className="space-y-1">
              {structured.key_requirements.map((req, i) => (
                <li key={i} className={`text-xs pl-4 ${
                  darkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  • {req}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Pricing Strategy */}
        {structured.pricing_strategy && (
          <div>
            <h4 className={`font-semibold text-sm mb-2 flex items-center gap-2 ${
              darkMode ? 'text-green-400' : 'text-green-700'
            }`}>
              💰 Pricing Strategy
            </h4>
            <p className={`text-xs pl-4 ${
              darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {structured.pricing_strategy}
            </p>
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
        }`}>AI Analysis & Feedback</h3>

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
      <div className="flex-1 p-3 sm:p-4 overflow-auto">
        {!feedback && !analyzing && !isProcessing && !rawAnalysis && (
          <div className="flex flex-col items-center justify-center h-full gap-1.5">
            {/* AI Avatar */}
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

            {/* Title and Description */}
            <div className="flex flex-col items-center gap-0.5 mt-4 px-4">
              <h4 className={`font-inter font-semibold text-base sm:text-lg text-center ${
                darkMode ? 'text-white' : 'text-zinc-950'
              }`}>
                AI Assistant Ready
              </h4>
              <p className={`font-inter font-normal text-xs sm:text-sm text-center max-w-[320px] leading-relaxed ${
                darkMode ? 'text-[#a0a0a0]' : 'text-zinc-500'
              }`}>
                Paste your proposal and click "Analyze" to get personalized feedback and improvement suggestions.
              </p>
            </div>
          </div>
        )}

        {(feedback || analyzing || isProcessing || rawAnalysis || structuredAnalysis || isStreaming) && (
          <div className="flex gap-1.5 sm:gap-2">
            {/* AI Avatar */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-violet-100 rounded-full border border-[#c4b4ff] flex items-center justify-center overflow-hidden">
                {characterAvatarUrl ? (
                  <img
                    src={characterAvatarUrl}
                    alt={characterName}
                    className="w-full h-full object-cover"
                    onLoad={() => console.log('[AIFeedbackSection] Active avatar image loaded successfully:', characterAvatarUrl)}
                    onError={(e) => console.error('[AIFeedbackSection] Active avatar image failed to load:', characterAvatarUrl, e)}
                  />
                ) : (
                  <img src={brandIcon} alt="" className="w-4 h-4 sm:w-6 sm:h-6" />
                )}
              </div>
              <div className="bg-violet-50 border border-[#ddd6ff] rounded-md px-1.5 sm:px-2 py-0.5">
                <span className="font-inter font-medium text-[8px] sm:text-[10px] text-zenible-primary">{characterName}</span>
              </div>
            </div>

            {/* Feedback Content */}
            <div className="flex-1 flex flex-col gap-2 sm:gap-3 min-w-0">
              {/* Typing Indicator - only show when processing without streaming */}
              {(isProcessing || (analyzing && !rawAnalysis && !isStreaming)) && (
                <AICharacterTypingIndicator
                  isProcessing={isProcessing}
                  isStreaming={false}
                  characterName={characterName}
                  darkMode={darkMode}
                />
              )}

              {/* Main Feedback */}
              {(displayContent || structuredAnalysis || analyzing || isStreaming) && (
                <div className={`rounded-xl p-2.5 sm:p-3 ${
                  darkMode ? 'bg-[#2d2d2d]' : 'bg-zinc-100'
                }`}>
                  {/* Always show raw text first if available */}
                  {(displayContent || isStreaming || analyzing) && (
                    <>
                      <div className={`prose prose-sm max-w-none ${
                        darkMode
                          ? 'prose-invert prose-pre:bg-gray-800 prose-pre:text-gray-200'
                          : 'prose-pre:bg-gray-100 prose-pre:text-gray-800'
                      }`}>
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          className={`font-inter font-normal text-xs sm:text-sm leading-[20px] sm:leading-[22px] ${
                            darkMode ? 'text-white' : 'text-zinc-950'
                          }`}
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

                      {/* Add divider if we have structured analysis to show */}
                      {(structuredAnalysis || feedback?.structured) && !analyzing && !isProcessing && !isStreaming && (
                        <div className={`my-4 border-t ${darkMode ? 'border-[#444444]' : 'border-gray-300'}`} />
                      )}
                    </>
                  )}

                  {/* Show structured analysis after raw text if available and not streaming */}
                  {(structuredAnalysis || feedback?.structured) && !analyzing && !isProcessing && !isStreaming && (
                    renderStructuredAnalysis()
                  )}

                  {/* Metrics display */}
                  {!analyzing && !isProcessing && !isStreaming && formatMetrics()}

                  <div ref={contentEndRef} />

                  {/* Error display */}
                  {feedback?.error && (
                    <div className={`mt-2 p-2 rounded-lg text-sm ${
                      darkMode
                        ? 'bg-red-900/30 text-red-300'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {feedback.error}
                    </div>
                  )}

                  {/* Suggestion buttons */}
                  {(displayContent || structuredAnalysis) && !analyzing && !isProcessing && !isStreaming && !feedback?.error && (
                    <div className="mt-2 sm:mt-3 flex flex-col gap-1.5 sm:gap-2">
                      {suggestionButtons.map((suggestion) => (
                        <button
                          key={suggestion}
                          className={`w-full h-8 sm:h-9 px-2 sm:px-3 py-1.5 sm:py-2 rounded-[10px] border font-inter font-medium text-xs sm:text-sm transition-colors text-left ${
                            darkMode
                              ? 'bg-[#3a3a3a] border-[#4a4a4a] text-white hover:bg-[#444444]'
                              : 'bg-white border-zinc-100 text-zinc-950 hover:bg-gray-50'
                          }`}
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Feedback Actions */}
              {(displayContent || structuredAnalysis) && !analyzing && !isProcessing && !isStreaming && messageId && (
                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => handleRating('good')}
                    disabled={ratingLoading}
                    className={`hover:opacity-70 transition-all ${
                      messageRating === 'good' ? 'scale-110 opacity-100' : 'opacity-60'
                    } ${ratingLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    title="Good response"
                  >
                    <img src={thumbsUpIcon} alt="Good" className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <button
                    onClick={() => handleRating('bad')}
                    disabled={ratingLoading}
                    className={`hover:opacity-70 transition-all ${
                      messageRating === 'bad' ? 'scale-110 opacity-100' : 'opacity-60'
                    } ${ratingLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    title="Bad response"
                  >
                    <img src={thumbsDownIcon} alt="Bad" className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              )}
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
            placeholder="Ask me about proposal writing..."
            disabled={analyzing || isProcessing}
            className={`flex-1 bg-transparent font-inter font-normal text-xs sm:text-sm outline-none min-w-0 ${
              darkMode
                ? 'text-white placeholder:text-[#888888] disabled:opacity-50'
                : 'text-zinc-950 placeholder:text-zinc-500 disabled:opacity-50'
            }`}
          />
          <button
            disabled={analyzing || isProcessing || !question.trim()}
            className="w-8 h-8 sm:w-9 sm:h-9 bg-zenible-primary rounded-[10px] flex items-center justify-center hover:bg-purple-600 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <img src={sendIcon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}