import React from 'react';
import sendIcon from '../../../assets/icons/send.svg';

interface ChatInputProps {
  darkMode: boolean;
  question: string;
  analyzing: boolean;
  isProcessing: boolean;
  isSendingMessage: boolean;
  onQuestionChange: (value: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onSend: () => void;
}

export default function ChatInput({
  darkMode,
  question,
  analyzing,
  isProcessing,
  isSendingMessage,
  onQuestionChange,
  onKeyDown,
  onSend,
}: ChatInputProps) {
  return (
    <div className="p-1.5 sm:p-2">
      <div className={`border rounded-xl flex items-center pl-3 sm:pl-4 pr-1 sm:pr-1.5 py-1 sm:py-1.5 ${
        darkMode
          ? 'bg-[#2d2d2d] border-[#4a4a4a]'
          : 'bg-neutral-50 border-neutral-200'
      }`}>
        <input
          type="text"
          value={question}
          onChange={(e) => onQuestionChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask me a question..."
          disabled={analyzing || isProcessing || isSendingMessage}
          className={`flex-1 bg-transparent font-inter font-normal text-xs sm:text-sm outline-none min-w-0 ${
            darkMode
              ? 'text-white placeholder:text-[#888888] disabled:opacity-50'
              : 'text-zinc-950 placeholder:text-zinc-500 disabled:opacity-50'
          }`}
        />
        <button
          onClick={onSend}
          disabled={analyzing || isProcessing || isSendingMessage || !question.trim()}
          className="w-8 h-8 sm:w-9 sm:h-9 bg-zenible-primary rounded-[10px] flex items-center justify-center hover:bg-purple-600 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <img src={sendIcon} alt="" className="w-3 h-3 sm:w-4 sm:h-4" />
        </button>
      </div>
    </div>
  );
}
