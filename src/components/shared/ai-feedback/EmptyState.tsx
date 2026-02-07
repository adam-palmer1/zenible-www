import React from 'react';
import aiAssistantIcon from '../../../assets/icons/ai-assistant.svg';

interface EmptyStateProps {
  darkMode: boolean;
  characterName: string;
  characterAvatarUrl: string | null;
  characterDescription: string;
}

export default function EmptyState({
  darkMode,
  characterName,
  characterAvatarUrl,
  characterDescription,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-1.5">
      <div className="flex items-center gap-3">
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
          <span className={`text-xs font-medium ${
            darkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {characterName}
          </span>
        </div>

        {characterDescription && (
          <div className={`px-4 py-3 rounded-lg text-xs max-w-[280px] min-h-[60px] flex items-center ${
            darkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-700'
          }`}>
            {characterDescription}
          </div>
        )}
      </div>

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
  );
}
