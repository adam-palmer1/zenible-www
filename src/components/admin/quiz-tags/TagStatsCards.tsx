import React from 'react';
import { QuizTag, Plan } from './types';

interface TagStatsCardsProps {
  darkMode: boolean;
  total: number;
  tags: QuizTag[];
  plans: Plan[];
}

export default function TagStatsCards({ darkMode, total, tags, plans }: TagStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
        <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Total Tags</div>
        <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          {total}
        </div>
      </div>

      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
        <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Active Tags</div>
        <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          {tags.filter((t: QuizTag) => t.is_active).length}
        </div>
      </div>

      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
        <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Total Plans</div>
        <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          {plans.length}
        </div>
      </div>
    </div>
  );
}
