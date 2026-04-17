import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import platformAPI from '../../services/platformAPI';

interface PlatformSelectorProps {
  darkMode: boolean;
  selectedPlatform: string;
  setSelectedPlatform: (value: string) => void;
  characterId: string | null;
}

export default function PlatformSelector({ darkMode, selectedPlatform, setSelectedPlatform, characterId }: PlatformSelectorProps) {
  const [platforms, setPlatforms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfoFor, setShowInfoFor] = useState<string | null>(null);

  useEffect(() => {
    if (characterId) {
      // Clear previous selection when character changes
      setSelectedPlatform('');
      fetchPlatforms();
    } else {
      // Clear platforms if no character selected
      setPlatforms([]);
      setSelectedPlatform('');
      setLoading(false);
    }
  }, [characterId]);

  const fetchPlatforms = async () => {
    try {
      setLoading(true);
      // Fetch platforms configured for this specific character
      const fetchedPlatforms = await platformAPI.getActivePlatforms({ characterId: characterId || undefined });

      // No need to filter for configured - the API returns only configured platforms for the character
      setPlatforms(fetchedPlatforms);

      // Set first platform as default if none selected
      if (!selectedPlatform && fetchedPlatforms.length > 0) {
        setSelectedPlatform(fetchedPlatforms[0].system_id as string);
      }
    } catch (err) {
      console.error('Failed to fetch platforms:', err);
      setError('Failed to load platforms');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={`rounded-xl border shadow-sm p-3 sm:p-4 ${
      darkMode ? 'bg-[#1e1e1e] border-[#333333]' : 'bg-white border-neutral-200'
    }`}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <h2 className={`font-inter font-semibold text-lg ${
          darkMode ? 'text-white' : 'text-zinc-950'
        }`}>Choose Your Platform</h2>

        {!characterId ? (
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Select an AI character first
          </div>
        ) : loading ? (
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Loading platforms...
          </div>
        ) : error ? (
          <div className={`text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
            {error}
          </div>
        ) : platforms.length === 0 ? (
          <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            No platforms configured for this character
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {platforms.map((platform) => (
              <div key={platform.id} className="relative">
                <button
                  onClick={() => setSelectedPlatform(platform.system_id)}
                  className={`flex items-center gap-2 px-3 py-3 rounded-xl transition-all text-sm sm:text-base ${
                    selectedPlatform === platform.system_id
                      ? 'bg-white border-[1.5px] border-[#a684ff] shadow-[0px_0px_0px_2.5px_#ddd6ff]'
                      : darkMode
                        ? 'bg-[#2d2d2d] border border-[#4a4a4a] hover:bg-[#3a3a3a]'
                        : 'bg-white border border-neutral-200 hover:bg-gray-50'
                  }`}
                >
                  {platform.icon_svg ? (
                    <div
                      className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 [&>svg]:w-full [&>svg]:h-full"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(platform.icon_svg) }}
                    />
                  ) : null}
                  <span className={`font-inter font-medium whitespace-nowrap ${
                    darkMode && selectedPlatform !== platform.system_id
                      ? 'text-white'
                      : 'text-zinc-950'
                  }`}>
                    {platform.name}
                  </span>
                  {platform.description && (
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowInfoFor(showInfoFor === platform.id ? null : platform.id);
                      }}
                      className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold leading-none flex-shrink-0 cursor-pointer ${
                        darkMode
                          ? 'bg-[#444444] text-gray-300 hover:bg-[#555555]'
                          : 'bg-gray-200 text-gray-500 hover:bg-gray-300'
                      }`}
                    >
                      i
                    </span>
                  )}
                </button>
                {showInfoFor === platform.id && platform.description && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowInfoFor(null)} />
                    <div className={`absolute top-full left-0 mt-1 z-20 p-2 rounded-lg shadow-lg text-xs w-[280px] ${
                      darkMode
                        ? 'bg-[#2d2d2d] border border-[#444444] text-gray-300'
                        : 'bg-white border border-gray-200 text-gray-600'
                    }`}>
                      {platform.description}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
