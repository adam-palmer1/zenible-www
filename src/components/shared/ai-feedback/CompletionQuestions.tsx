import React from 'react';
import { CompletionQuestion } from './types';

interface CompletionQuestionsProps {
  darkMode: boolean;
  completionQuestions: CompletionQuestion[];
  isSendingMessage: boolean;
  onSuggestionClick: (questionText: string) => void;
}

export default function CompletionQuestions({
  darkMode,
  completionQuestions,
  isSendingMessage,
  onSuggestionClick,
}: CompletionQuestionsProps) {
  return (
    <div className="flex flex-col gap-1.5 sm:gap-2">
      {completionQuestions
        .sort((a, b) => a.order_index - b.order_index)
        .map((q) => (
          <button
            key={q.id}
            onClick={() => onSuggestionClick(q.question_text)}
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
}
