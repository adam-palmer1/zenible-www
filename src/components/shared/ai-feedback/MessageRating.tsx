import React from 'react';

interface MessageRatingProps {
  messageId: string;
  darkMode: boolean;
  rating: string | null;
  onRate: (msgId: string, rating: string) => void;
}

export default function MessageRating({ messageId, darkMode, rating, onRate }: MessageRatingProps) {
  if (!messageId) return null;

  return (
    <div className="flex gap-1.5 mt-1.5">
      <button
        onClick={() => onRate(messageId, 'positive')}
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
        onClick={() => onRate(messageId, 'negative')}
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
}
