import React, { useState } from 'react';
import { CharacterFormState } from './types';

const CONTEXT_OPTIONS = [
  { key: 'default', label: 'Default' },
  { key: 'boardroom', label: 'The Boardroom' },
  { key: 'public', label: 'Public Landing' },
  { key: 'proposal_wizard', label: 'Proposal Wizard' },
  { key: 'viral_post_generator', label: 'Viral Post Generator' },
  { key: 'headline_analyzer', label: 'Headline Analyzer' },
  { key: 'profile_analyzer', label: 'Profile Analyzer' },
];

interface ConversationStartersSectionProps {
  characterForm: CharacterFormState;
  setCharacterForm: React.Dispatch<React.SetStateAction<CharacterFormState>>;
  darkMode: boolean;
}

export default function ConversationStartersSection({
  characterForm,
  setCharacterForm,
  darkMode
}: ConversationStartersSectionProps) {
  const [newStarter, setNewStarter] = useState('');
  const [activeContext, setActiveContext] = useState('default');

  const getStarters = (): string[] => {
    if (activeContext === 'default') {
      return characterForm.metadata.conversation_starters || [];
    }
    return characterForm.metadata.context_starters?.[activeContext] || [];
  };

  const setStarters = (updater: (prev: string[]) => string[]) => {
    setCharacterForm(prev => {
      if (activeContext === 'default') {
        return {
          ...prev,
          metadata: {
            ...prev.metadata,
            conversation_starters: updater(prev.metadata.conversation_starters || [])
          }
        };
      }
      const prevContextStarters = prev.metadata.context_starters || {};
      const prevList = prevContextStarters[activeContext] || [];
      const newList = updater(prevList);
      const newContextStarters = { ...prevContextStarters };
      if (newList.length === 0) {
        delete newContextStarters[activeContext];
      } else {
        newContextStarters[activeContext] = newList;
      }
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          context_starters: newContextStarters
        }
      };
    });
  };

  const starters = getStarters();

  const handleAdd = () => {
    const trimmed = newStarter.trim();
    if (!trimmed || trimmed.length > 120) return;
    setStarters(prev => [...prev, trimmed]);
    setNewStarter('');
  };

  const handleRemove = (index: number) => {
    setStarters(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  const getContextInstructions = (): string => {
    if (activeContext === 'default') return '';
    return characterForm.metadata.context_instructions?.[activeContext] || '';
  };

  const setContextInstructions = (value: string) => {
    setCharacterForm(prev => {
      const prevInstructions = prev.metadata.context_instructions || {};
      const newInstructions = { ...prevInstructions };
      if (value.trim()) {
        newInstructions[activeContext] = value;
      } else {
        delete newInstructions[activeContext];
      }
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          context_instructions: newInstructions
        }
      };
    });
  };

  // Count how many contexts have overrides (starters or instructions)
  const starterKeys = Object.keys(characterForm.metadata.context_starters || {});
  const instructionKeys = Object.keys(characterForm.metadata.context_instructions || {});
  const contextCount = new Set([...starterKeys, ...instructionKeys]).size;

  return (
    <div className="md:col-span-2">
      <label className={`block text-sm font-medium mb-1 ${
        darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
      }`}>
        Conversation Starters
      </label>
      <p className={`text-xs mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        Pre-written opening messages shown to users. Select a context to set feature-specific starters.
        {contextCount > 0 && ` (${contextCount} context override${contextCount !== 1 ? 's' : ''} set)`}
      </p>

      {/* Context selector tabs */}
      <div className="flex flex-wrap gap-1 mb-3">
        {CONTEXT_OPTIONS.map(opt => {
          const isActive = activeContext === opt.key;
          const hasOverride = opt.key !== 'default' && (
            (characterForm.metadata.context_starters?.[opt.key]?.length ?? 0) > 0 ||
            !!characterForm.metadata.context_instructions?.[opt.key]
          );
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setActiveContext(opt.key)}
              className={`px-2.5 py-1 text-xs rounded-md border transition-colors ${
                isActive
                  ? 'bg-zenible-primary text-white border-zenible-primary'
                  : darkMode
                    ? `border-zenible-dark-border text-gray-400 hover:text-gray-200 hover:border-gray-500 ${hasOverride ? 'bg-zenible-dark-bg' : ''}`
                    : `border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300 ${hasOverride ? 'bg-purple-50' : ''}`
              }`}
            >
              {opt.label}
              {hasOverride && !isActive && (
                <span className={`ml-1 inline-block w-1.5 h-1.5 rounded-full ${darkMode ? 'bg-purple-400' : 'bg-zenible-primary'}`} />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={newStarter}
          onChange={(e) => setNewStarter(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={activeContext === 'default' ? 'e.g. What can you help me with?' : `e.g. Starter for ${CONTEXT_OPTIONS.find(o => o.key === activeContext)?.label}...`}
          maxLength={120}
          className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
            darkMode
              ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text placeholder-gray-500'
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
          }`}
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!newStarter.trim() || newStarter.trim().length > 120}
          className={`px-3 py-2 text-sm rounded-lg transition-colors ${
            !newStarter.trim()
              ? darkMode
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-zenible-primary text-white hover:bg-opacity-90'
          }`}
        >
          Add
        </button>
      </div>

      {starters.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          {starters.map((starter, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                darkMode
                  ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}
            >
              <span className="flex-1 truncate">{starter}</span>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className={`flex-shrink-0 p-1 rounded transition-colors ${
                  darkMode
                    ? 'text-gray-500 hover:text-red-400 hover:bg-red-900/20'
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        activeContext !== 'default' && (
          <p className={`text-xs italic ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
            No overrides for this context. Default starters will be used.
          </p>
        )
      )}

      {activeContext !== 'default' && (
        <div className="mt-3">
          <label className={`block text-sm font-medium mb-1 ${
            darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
          }`}>
            Additional Instructions
          </label>
          <p className={`text-xs mb-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            Extra instructions appended to base system instructions for this context.
          </p>
          <textarea
            value={getContextInstructions()}
            onChange={(e) => setContextInstructions(e.target.value)}
            placeholder={`e.g. Focus on topics relevant to ${CONTEXT_OPTIONS.find(o => o.key === activeContext)?.label}...`}
            rows={3}
            className={`w-full px-3 py-2 rounded-lg border text-sm ${
              darkMode
                ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text placeholder-gray-500'
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            }`}
          />
        </div>
      )}
    </div>
  );
}
