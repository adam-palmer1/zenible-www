import React, { useState, useEffect } from 'react';
import tipAPI from '../services/tipAPI';
import type { RandomTipResponse as BaseRandomTipResponse } from '../types';

interface TipCharacter {
  name?: string;
  avatar_url?: string;
  [key: string]: unknown;
}

type RandomTipResponse = BaseRandomTipResponse & { character?: TipCharacter };
import bulb1 from '../assets/icons/dashboard/bulb-1.svg';
import bulb2 from '../assets/icons/dashboard/bulb-2.svg';
import bulb3 from '../assets/icons/dashboard/bulb-3.svg';
import aiAssistantIcon from '../assets/icons/ai-assistant.svg';

interface TipOfTheDayProps {
  characterId?: string | null;
  className?: string;
}

export default function TipOfTheDay({ characterId = null, className = "" }: TipOfTheDayProps) {
  const [tipData, setTipData] = useState<any>(null);
  const [character, setCharacter] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTip();
  }, [characterId]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadTip = async () => {
    try {
      setLoading(true);
      setError(null);
      setCharacter(null);

      const params: Record<string, any> = {};
      if (characterId) {
        params.character_id = characterId;
      }

      const response = await tipAPI.getRandomTipWithCharacter(params) as RandomTipResponse;
      setTipData(response);

      // Set character data if available
      if (response?.character) {
        setCharacter(response.character);
      }
    } catch (err) {
      console.error('Failed to load tip:', err);
      setError((err as Error).message);

      // Fallback to static tip if API fails
      setTipData({
        tip: {
          content: "Proposals with clear project phases and milestones are 40% more likely to win. Use our AI to help structure your next proposal with specific deliverables and timelines.",
          ai_character_id: null,
          is_active: true,
          priority: 5
        },
        is_new: false
      });
      setCharacter(null);
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className={`bg-white border border-neutral-200 border-solid box-border content-stretch flex flex-col gap-[22px] items-start p-[16px] relative rounded-[12px] shrink-0 w-[1128px] ${className}`}>
        <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full">
          <div className="bg-violet-50 box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] relative rounded-[8px] shrink-0 size-[46px]">
            <div className="animate-pulse bg-violet-200 rounded size-[24px]" />
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[895px]">
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
              <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0">
                <div className="animate-pulse bg-gray-200 h-[26px] w-[120px] rounded" />
              </div>
              <div className="animate-pulse bg-gray-200 h-[40px] w-full rounded mt-2" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !tipData) {
    return (
      <div className={`bg-red-50 border border-red-200 border-solid box-border content-stretch flex flex-col gap-[22px] items-start p-[16px] relative rounded-[12px] shrink-0 w-[1128px] ${className}`}>
        <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full">
          <div className="bg-red-100 box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] relative rounded-[8px] shrink-0 size-[46px]">
            <span className="text-red-600 text-lg">⚠</span>
          </div>
          <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[895px]">
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
              <h3 className="font-['Inter'] font-semibold text-[18px] text-red-900 leading-[26px]">
                Unable to load tip
              </h3>
              <p className="font-['Inter'] font-normal text-[12px] text-red-700 leading-[20px] mt-1">
                {error}
              </p>
            </div>
            <button
              onClick={loadTip}
              className="bg-red-600 text-white px-[12px] py-[10px] rounded-[10px] font-['Inter'] font-medium text-[16px] hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!tipData?.tip) {
    return null;
  }

  const { tip } = tipData;

  return (
    <div className={`bg-white border border-neutral-200 border-solid box-border content-stretch flex flex-col gap-[22px] items-start p-[16px] relative rounded-[12px] shrink-0 w-[1128px] ${className}`}>
      <div className="content-stretch flex gap-[16px] items-start relative shrink-0 w-full">
        {/* Character or Bulb Icon */}
        {character ? (
          <div className="flex flex-col items-center gap-2 shrink-0">
            <div className="w-[46px] h-[46px] bg-violet-50 rounded-lg border border-[#ddd6ff] flex items-center justify-center overflow-hidden">
              {character.avatar_url ? (
                <img
                  src={character.avatar_url}
                  alt={character.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img src={aiAssistantIcon} alt="" className="w-6 h-6" />
              )}
            </div>
            <span className="text-xs font-medium text-gray-700 text-center max-w-[46px]">
              {character.name}
            </span>
            {character.description && (
              <div className="px-3 py-2 rounded-lg text-xs max-w-[200px] bg-gray-100 text-gray-700 mt-1">
                {character.description}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-violet-50 box-border content-stretch flex gap-[4px] items-center justify-center p-[4px] relative rounded-[8px] shrink-0 size-[46px]">
            <div className="overflow-clip relative shrink-0 size-[24px]">
              <div className="absolute bottom-[41.67%] left-1/4 right-1/4 top-[8.33%]">
                <div className="absolute inset-[-6.25%]">
                  <img alt="" className="block max-w-none size-full" src={bulb1} />
                </div>
              </div>
              <div className="absolute bottom-1/4 left-[37.5%] right-[37.5%] top-3/4">
                <div className="absolute inset-[-0.75px_-12.5%]">
                  <img alt="" className="block max-w-none size-full" src={bulb2} />
                </div>
              </div>
              <div className="absolute inset-[91.67%_41.67%_8.33%_41.67%]">
                <div className="absolute inset-[-0.75px_-18.75%]">
                  <img alt="" className="block max-w-none size-full" src={bulb3} />
                </div>
              </div>
            </div>
          </div>
        )}
        <div className="content-stretch flex flex-col gap-[16px] items-start relative shrink-0 w-[895px]">
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            <div className="content-stretch flex gap-[8px] items-center justify-center relative shrink-0">
              <div className="flex flex-col font-['Inter'] font-semibold justify-center leading-[0] not-italic relative shrink-0 text-[18px] text-nowrap text-zinc-950">
                <p className="leading-[26px] whitespace-pre">
                  Tip of the Day
                </p>
              </div>
            </div>

            <p className="font-['Inter'] font-normal leading-[20px] min-w-full not-italic relative shrink-0 text-[12px] text-zinc-500 w-[min-content] mt-2">
              {tip.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}