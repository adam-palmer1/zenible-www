import React from 'react';

interface AICharacter {
  id: string;
  name: string;
  internal_name: string;
  description?: string | null;
  avatar_url?: string | null;
}

interface CharacterCardSelectorProps {
  characters: AICharacter[];
  selectedCharacterId: string | null;
  onSelect: (character: AICharacter) => void;
  darkMode: boolean;
  loading?: boolean;
}

const CharacterCardSelector: React.FC<CharacterCardSelectorProps> = ({
  characters,
  selectedCharacterId,
  onSelect,
  darkMode,
  loading = false,
}) => {
  if (loading) {
    return (
      <div className={`text-sm px-1 py-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Loading experts...
      </div>
    );
  }

  if (characters.length <= 1) return null;

  return (
    <div className="advisor-cards-scroll flex gap-3 overflow-x-auto">
      {characters.map((char) => (
        <button
          key={char.id}
          onClick={() => onSelect(char)}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border transition-colors text-left w-[220px] flex-shrink-0 ${
            selectedCharacterId === char.id
              ? darkMode
                ? 'bg-[#2d2d2d] border-zenible-primary shadow-sm'
                : 'bg-white border-zenible-primary shadow-sm'
              : darkMode
                ? 'bg-[#2d2d2d] border-[#444444] hover:border-gray-500'
                : 'bg-white border-neutral-200 hover:border-gray-300'
          }`}
        >
          {char.avatar_url ? (
            <img
              src={char.avatar_url}
              alt=""
              className="w-10 h-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-violet-50 border border-[#ddd6ff] flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-semibold truncate ${
              selectedCharacterId === char.id
                ? darkMode ? 'text-white' : 'text-gray-900'
                : darkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {char.name}
            </div>
            {char.description && (
              <p className={`text-xs mt-0.5 line-clamp-2 ${
                darkMode ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {char.description}
              </p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
};

export default CharacterCardSelector;
