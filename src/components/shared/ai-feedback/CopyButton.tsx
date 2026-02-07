import React from 'react';

const CopyIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M5 13l4 4L19 7" />
  </svg>
);

interface CopyButtonProps {
  messageId: string;
  content: string;
  darkMode: boolean;
  copiedMessageId: string | null;
  onCopy: (msgId: string, content: string) => void;
}

export default function CopyButton({ messageId, content, darkMode, copiedMessageId, onCopy }: CopyButtonProps) {
  const isCopied = copiedMessageId === messageId;

  return (
    <button
      onClick={() => onCopy(messageId, content)}
      className={`p-2 rounded transition-colors ${
        isCopied
          ? darkMode ? 'text-green-400' : 'text-green-600'
          : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
      }`}
      title={isCopied ? 'Copied!' : 'Copy to clipboard'}
    >
      {isCopied ? <CheckIcon /> : <CopyIcon />}
    </button>
  );
}
