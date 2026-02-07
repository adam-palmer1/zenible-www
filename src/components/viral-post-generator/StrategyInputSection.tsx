import React from 'react';
import { usePreferences } from '../../contexts/PreferencesContext';

interface StrategyInputSectionProps {
  topic: string;
  setTopic: (value: string) => void;
  goal: string;
  setGoal: (value: string) => void;
  audience: string;
  setAudience: (value: string) => void;
  disabled?: boolean;
}

export default function StrategyInputSection({ topic, setTopic, goal, setGoal, audience, setAudience, disabled = false }: StrategyInputSectionProps) {
  const { darkMode } = usePreferences();

  return (
    <div
      className={`rounded-xl border-2 border-dashed p-4 ${
        darkMode
          ? 'bg-violet-950/20 border-violet-700/50'
          : 'bg-violet-50 border-[#c4b4ff]'
      }`}
    >
      <div className="mb-4">
        <h3
          className={`text-lg font-semibold ${
            darkMode ? 'text-gray-100' : 'text-zinc-950'
          }`}
        >
          Existing LinkedIn Post Draft
        </h3>
      </div>

      <div className="space-y-4">
        {/* Topic */}
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-200' : 'text-zinc-950'
            }`}
          >
            Topic
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={disabled}
            placeholder="e.g., proposal writing, freelancing, business growth"
            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-violet-500 ${
              darkMode
                ? 'bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-500'
                : 'bg-white text-zinc-500 border-[#ddd6ff] placeholder-zinc-400'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>

        {/* Goal */}
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-200' : 'text-zinc-950'
            }`}
          >
            Goal
          </label>
          <input
            type="text"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            disabled={disabled}
            placeholder="e.g., increase win rates, build authority, generate leads"
            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-violet-500 ${
              darkMode
                ? 'bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-500'
                : 'bg-white text-zinc-500 border-[#ddd6ff] placeholder-zinc-400'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>

        {/* Audience */}
        <div>
          <label
            className={`block text-sm font-medium mb-2 ${
              darkMode ? 'text-gray-200' : 'text-zinc-950'
            }`}
          >
            Audience
          </label>
          <input
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            disabled={disabled}
            placeholder="e.g., freelancers, business owners, marketing professionals"
            className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-violet-500 ${
              darkMode
                ? 'bg-gray-800 text-gray-100 border-gray-700 placeholder-gray-500'
                : 'bg-white text-zinc-500 border-[#ddd6ff] placeholder-zinc-400'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          />
        </div>
      </div>
    </div>
  );
}
