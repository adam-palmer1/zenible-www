import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '../../../contexts/PreferencesContext';
import aiCharacterAPI from '../../../services/aiCharacterAPI';
import userAPI from '../../../services/userAPI';

interface AICharacter {
  id: string;
  name: string;
  internal_name: string;
  description?: string | null;
  avatar_url?: string | null;
  is_accessible?: boolean | null;
  required_plan_name?: string | null;
}

interface SendToBoardroomModalProps {
  meetingId: string;
  meetingTitle: string;
  onClose: () => void;
}

export default function SendToBoardroomModal({ meetingId, meetingTitle, onClose }: SendToBoardroomModalProps) {
  const { darkMode } = usePreferences();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<AICharacter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const userFeatures = await userAPI.getCurrentUserFeatures() as { system_features?: { the_boardroom_model?: string[] } };
        const allowedNames = userFeatures?.system_features?.the_boardroom_model || [];
        const allChars = await aiCharacterAPI.getUserCharacters({ per_page: '50', include_gated: 'true' }) as AICharacter[];

        let chars = allChars;
        if (allowedNames.length > 0) {
          chars = allChars.filter(c =>
            allowedNames.includes(c.internal_name) ||
            allowedNames.includes(c.name.toLowerCase()) ||
            c.is_accessible === false
          );
        }

        // Accessible first, then gated
        chars.sort((a, b) => {
          const aOk = a.is_accessible !== false ? 1 : 0;
          const bOk = b.is_accessible !== false ? 1 : 0;
          return bOk - aOk;
        });

        setCharacters(chars);
      } catch (err) {
        console.error('[SendToBoardroom] Failed to load characters:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSelect = (character: AICharacter) => {
    if (character.is_accessible === false) return;
    navigate(`/boardroom?meetingId=${encodeURIComponent(meetingId)}&characterId=${encodeURIComponent(character.id)}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className={`relative w-full max-w-md rounded-xl shadow-xl border flex flex-col max-h-[70vh] ${
        darkMode ? 'bg-[#1e1e1e] border-[#333]' : 'bg-white border-gray-200'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex-shrink-0 ${darkMode ? 'border-[#333]' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h3 className={`font-semibold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Send to Boardroom
            </h3>
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                darkMode ? 'hover:bg-[#333] text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className={`text-xs mt-1 truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {meetingTitle}
          </p>
        </div>

        {/* Character list */}
        <div className="overflow-y-auto flex-1 p-3">
          {loading ? (
            <div className={`text-sm text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Loading experts...
            </div>
          ) : characters.length === 0 ? (
            <div className={`text-sm text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No experts available
            </div>
          ) : (
            <div className="space-y-2">
              <p className={`text-xs px-1 mb-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                Choose an expert to discuss this meeting with:
              </p>
              {characters.map(char => {
                const gated = char.is_accessible === false;
                return (
                  <button
                    key={char.id}
                    onClick={() => handleSelect(char)}
                    disabled={gated}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg border transition-colors text-left ${
                      gated
                        ? darkMode
                          ? 'bg-[#2d2d2d] border-[#333] opacity-50 cursor-not-allowed'
                          : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                        : darkMode
                          ? 'bg-[#2d2d2d] border-[#444] hover:border-zenible-primary hover:bg-[#333]'
                          : 'bg-white border-gray-200 hover:border-zenible-primary hover:bg-gray-50'
                    }`}
                  >
                    {char.avatar_url ? (
                      <img src={char.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-violet-50 border border-[#ddd6ff] flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                        {char.name}
                      </div>
                      {char.description && (
                        <p className={`text-xs mt-0.5 line-clamp-2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {char.description}
                        </p>
                      )}
                      {gated && char.required_plan_name && (
                        <p className="text-xs mt-0.5 text-amber-500">
                          Upgrade to {char.required_plan_name}
                        </p>
                      )}
                    </div>
                    {!gated && (
                      <svg className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
