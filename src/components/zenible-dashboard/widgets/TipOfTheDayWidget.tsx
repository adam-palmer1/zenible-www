import React from 'react';
import { LightBulbIcon } from '@heroicons/react/24/outline';
import { useDashboardWidget } from '../../../contexts/DashboardDataContext';

interface TipData {
  content: string;
  category?: string;
}

interface Character {
  name?: string;
  avatar_url?: string;
  description?: string;
}

interface TipOfTheDayWidgetProps {
  settings?: Record<string, any>;
}

/**
 * Tip of the Day Widget for Dashboard
 * Shows a daily tip with optional character avatar
 */
const TipOfTheDayWidget = ({ settings: _settings = {} }: TipOfTheDayWidgetProps) => {
  const { data, isLoading } = useDashboardWidget('tipOfTheDay');

  const tipData: TipData | null = data?.tip || null;
  const character: Character | null = data?.character || null;

  if (isLoading) {
    return (
      <div className="flex items-center gap-4 animate-pulse">
        <div className="w-12 h-12 bg-gray-200 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-full" />
        </div>
      </div>
    );
  }

  if (!tipData) {
    return null;
  }

  return (
    <div className="flex items-start gap-4">
      {/* Character or Icon */}
      <div className="flex-shrink-0 flex flex-col items-center">
        {character?.avatar_url ? (
          <img
            src={character.avatar_url}
            alt={character.name || 'Tip character'}
            className="w-12 h-12 rounded-lg object-cover"
          />
        ) : (
          <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
            <LightBulbIcon className="w-6 h-6 text-amber-600" />
          </div>
        )}
        {character?.name && (
          <span className="text-xs font-medium text-gray-700 text-center mt-1">
            {character.name}
          </span>
        )}
      </div>

      {/* Tip Content */}
      <div className="flex-1 min-w-0">
        <blockquote className="text-sm text-gray-700 leading-relaxed italic border-l-2 border-gray-300 pl-3">
          &ldquo;{tipData?.content}&rdquo;
        </blockquote>
        {character?.description && (
          <p className="mt-2 text-xs text-gray-400 leading-relaxed ml-[14px]">
            {character.description}
          </p>
        )}
        {tipData?.category && (
          <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium text-purple-600 bg-purple-50 rounded">
            {tipData.category}
          </span>
        )}
      </div>
    </div>
  );
};

export default TipOfTheDayWidget;
