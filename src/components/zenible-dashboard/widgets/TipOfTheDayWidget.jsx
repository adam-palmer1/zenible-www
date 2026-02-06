import React, { useState, useEffect } from 'react';
import { LightBulbIcon } from '@heroicons/react/24/outline';
import tipAPI from '../../../services/tipAPI';

/**
 * Tip of the Day Widget for Dashboard
 * Shows a daily tip with optional character avatar
 */
const TipOfTheDayWidget = ({ settings = {} }) => {
  const [tipData, setTipData] = useState(null);
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadTip = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await tipAPI.getRandomTipWithCharacter();
        setTipData(response.tip);
        setCharacter(response.character);
      } catch (err) {
        console.error('Failed to load tip:', err);
        setError(err.message);
        // Fallback to a static tip
        setTipData({
          content: "Focus on understanding your client's needs before presenting solutions. The best proposals address specific pain points.",
          category: 'Proposal Writing'
        });
      } finally {
        setLoading(false);
      }
    };

    loadTip();
  }, []);

  if (loading) {
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
        {character?.description && (
          <div className="px-2 py-1.5 rounded-lg text-xs max-w-[140px] bg-gray-100 text-gray-600 mt-1 text-center">
            {character.description}
          </div>
        )}
      </div>

      {/* Tip Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 leading-relaxed">
          {tipData?.content}
        </p>
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
