import React from 'react';
import { CharacterFormState, ShortcodeItem } from './types';

interface SystemInstructionsSectionProps {
  characterForm: CharacterFormState;
  setCharacterForm: React.Dispatch<React.SetStateAction<CharacterFormState>>;
  shortcodes: ShortcodeItem[];
  shortcodesLoading: boolean;
  darkMode: boolean;
}

export default function SystemInstructionsSection({
  characterForm,
  setCharacterForm,
  shortcodes,
  shortcodesLoading,
  darkMode
}: SystemInstructionsSectionProps) {
  return (
    <div className="md:col-span-2">
      <label className={`block text-sm font-medium mb-1 ${
        darkMode ? 'text-zenible-dark-text' : 'text-gray-700'
      }`}>
        System Instructions
      </label>
      <textarea
        value={characterForm.metadata.system_instructions}
        onChange={(e) => setCharacterForm({
          ...characterForm,
          metadata: {...characterForm.metadata, system_instructions: e.target.value}
        })}
        className={`w-full px-3 py-2 border rounded-lg font-mono text-sm ${
          darkMode
            ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text'
            : 'bg-white border-gray-300 text-gray-900'
        }`}
        rows={6}
        placeholder="You are a helpful assistant..."
      />

      {/* Shortcodes section - only show for OpenAI Chat */}
      {characterForm.backend_provider === 'openai_chat' && (
        <div className={`mt-3 p-3 rounded-lg border ${
          darkMode
            ? 'bg-zenible-dark-bg border-zenible-dark-border'
            : 'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className={`text-sm font-semibold ${
              darkMode ? 'text-zenible-dark-text' : 'text-gray-800'
            }`}>
              Available Placeholder Variables
            </h4>
            {shortcodesLoading && (
              <span className={`text-xs ${
                darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
              }`}>
                Loading...
              </span>
            )}
          </div>

          {shortcodes.length > 0 ? (
            <div className="space-y-2">
              {shortcodes.map((sc) => (
                <div
                  key={sc.shortcode}
                  className={`text-xs p-2 rounded ${
                    darkMode
                      ? 'bg-zenible-dark-surface'
                      : 'bg-white'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <code className={`font-mono font-semibold ${
                      darkMode ? 'text-blue-400' : 'text-blue-600'
                    }`}>
                      {sc.shortcode}
                    </code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(sc.shortcode);
                      }}
                      className={`px-2 py-0.5 rounded text-xs ${
                        darkMode
                          ? 'bg-zenible-dark-bg hover:bg-zenible-dark-border text-zenible-dark-text'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                      title="Copy to clipboard"
                    >
                      Copy
                    </button>
                  </div>
                  <p className={`mt-1 ${
                    darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-600'
                  }`}>
                    {sc.description}
                  </p>
                  {sc.example && (
                    <p className={`mt-1 font-mono text-xs ${
                      darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
                    }`}>
                      Example: {sc.example}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : !shortcodesLoading && (
            <p className={`text-xs ${
              darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'
            }`}>
              No placeholder variables available.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
