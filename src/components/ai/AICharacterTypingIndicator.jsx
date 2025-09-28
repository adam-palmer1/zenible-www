import React from 'react';

/**
 * Animated typing indicator for AI character responses
 * Shows different states: processing, typing, streaming
 */
export default function AICharacterTypingIndicator({
  isProcessing,
  isStreaming,
  characterName = 'AI Assistant',
  darkMode = false
}) {
  if (!isProcessing && !isStreaming) {
    return null;
  }

  const getStatusText = () => {
    if (isProcessing) {
      return `${characterName} is thinking...`;
    }
    if (isStreaming) {
      return `${characterName} is typing...`;
    }
    return '';
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg ${
      darkMode
        ? 'bg-[#2a2a2a] border border-[#333333]'
        : 'bg-gray-50 border border-gray-200'
    }`}>
      <div className="flex items-center gap-2">
        {/* Animated dots */}
        <div className="flex gap-1">
          <span className={`inline-block w-2 h-2 rounded-full animate-bounce ${
            darkMode ? 'bg-purple-400' : 'bg-purple-600'
          }`} style={{ animationDelay: '0ms' }} />
          <span className={`inline-block w-2 h-2 rounded-full animate-bounce ${
            darkMode ? 'bg-purple-400' : 'bg-purple-600'
          }`} style={{ animationDelay: '150ms' }} />
          <span className={`inline-block w-2 h-2 rounded-full animate-bounce ${
            darkMode ? 'bg-purple-400' : 'bg-purple-600'
          }`} style={{ animationDelay: '300ms' }} />
        </div>

        {/* Status text */}
        <span className={`text-sm font-medium ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {getStatusText()}
        </span>
      </div>

      {/* Processing spinner */}
      {isProcessing && (
        <svg
          className={`animate-spin h-4 w-4 ${
            darkMode ? 'text-purple-400' : 'text-purple-600'
          }`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
    </div>
  );
}

/**
 * Simplified typing indicator with just dots
 */
export function TypingDots({ darkMode = false, size = 'md' }) {
  const sizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  };

  return (
    <div className="flex gap-1 items-center">
      <span
        className={`inline-block ${sizeClasses[size]} rounded-full animate-bounce ${
          darkMode ? 'bg-gray-400' : 'bg-gray-500'
        }`}
        style={{ animationDelay: '0ms' }}
      />
      <span
        className={`inline-block ${sizeClasses[size]} rounded-full animate-bounce ${
          darkMode ? 'bg-gray-400' : 'bg-gray-500'
        }`}
        style={{ animationDelay: '150ms' }}
      />
      <span
        className={`inline-block ${sizeClasses[size]} rounded-full animate-bounce ${
          darkMode ? 'bg-gray-400' : 'bg-gray-500'
        }`}
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
}

/**
 * Full-width loading bar for processing state
 */
export function ProcessingBar({ darkMode = false, progress = null }) {
  return (
    <div className={`w-full ${darkMode ? 'bg-[#1a1a1a]' : 'bg-gray-100'} rounded-full h-1.5 overflow-hidden`}>
      {progress !== null ? (
        // Determinate progress
        <div
          className={`h-full transition-all duration-300 ${
            darkMode ? 'bg-purple-400' : 'bg-purple-600'
          }`}
          style={{ width: `${progress}%` }}
        />
      ) : (
        // Indeterminate progress
        <div className="relative h-full">
          <div
            className={`absolute h-full w-1/3 animate-pulse ${
              darkMode ? 'bg-purple-400' : 'bg-purple-600'
            }`}
            style={{
              animation: 'slide 2s linear infinite'
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes slide {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  );
}