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
    <div
      className={`rounded-xl border-2 border-dashed p-4 ${
        darkMode
          ? 'bg-violet-950/20 border-violet-700/50'
          : 'bg-violet-50 border-[#c4b4ff]'
      }`}
    >
      <div className="mb-2">
        <h3
          className={`text-lg font-semibold ${
            darkMode ? 'text-gray-100' : 'text-zinc-950'
          }`}
        >
          Existing LinkedIn Post Draft
        </h3>
      </div>

      <div className="mt-2">
        <textarea
          value={draftPost}
          onChange={(e) => setDraftPost(e.target.value)}
          disabled={disabled}
          placeholder="Paste your existing LinkedIn post draft here. I'll analyze it and suggest improvements to make it more viral and engaging..."
          className={`w-full min-h-[300px] p-4 rounded-lg border resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 ${
            darkMode
              ? 'bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-500'
              : 'bg-white text-zinc-500 border-[#ddd6ff] placeholder-zinc-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        />
      </div>
    </div>
  );
}
