import React from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';

interface DraftPostSectionProps {
  draftPost: string;
  setDraftPost: (value: string) => void;
  disabled?: boolean;
}

export default function DraftPostSection({ draftPost, setDraftPost, disabled = false }: DraftPostSectionProps) {
  const { darkMode } = usePreferences();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="mb-2">
        <h3
          className={`text-lg font-semibold ${
            darkMode ? 'text-gray-100' : 'text-zinc-950'
          }`}
        >
          Your Post
        </h3>
      </div>

      <div className="mt-2 flex-1 flex flex-col min-h-0">
        <textarea
          value={draftPost}
          onChange={(e) => setDraftPost(e.target.value)}
          disabled={disabled}
          placeholder="Paste your existing post here. I'll analyze it and suggest improvements to make it more viral and engaging.."
          className={`w-full flex-1 min-h-[200px] p-4 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 ${
            darkMode
              ? 'bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-500'
              : 'bg-white text-zinc-500 border-[#ddd6ff] placeholder-zinc-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>
    </div>
  );
}
