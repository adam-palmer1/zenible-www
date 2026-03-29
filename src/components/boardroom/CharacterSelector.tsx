import React from 'react';

interface AICharacter {
  id: string;
  name: string;
  description?: string | null;
  avatar_url?: string | null;
  role?: string;
  title?: string;
}

interface CharacterSelectorProps {
  characters: AICharacter[];
  selectedId: string | null;
  onChange: (characterId: string) => void;
  loading: boolean;
  darkMode: boolean;
}

export default function CharacterSelector({
  characters,
  selectedId,
  onChange,
  loading,
  darkMode,
}: CharacterSelectorProps) {
  if (loading) {
    return (
      <div className={`text-sm px-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        Loading...
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className={`text-sm px-3 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        No characters available
      </div>
    );
  }

  return (
    <select
      value={selectedId || ''}
      onChange={(e) => onChange(e.target.value)}
      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
        darkMode
          ? 'bg-gray-700 border-gray-600 text-white focus:border-zenible-primary'
          : 'bg-gray-100 border-gray-200 text-gray-700 focus:border-zenible-primary'
      } focus:outline-none focus:ring-2 focus:ring-zenible-primary/20`}
    >
      {characters.map((character) => (
        <option key={character.id} value={character.id}>
          {character.name}
        </option>
      ))}
    </select>
  );
}
