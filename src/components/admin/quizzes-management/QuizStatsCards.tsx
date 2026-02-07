import React from 'react';
import { Quiz } from './types';

interface QuizStatsCardsProps {
  darkMode: boolean;
  total: number;
  quizzes: Quiz[];
}

export default function QuizStatsCards({ darkMode, total, quizzes }: QuizStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
        <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Total Quizzes</div>
        <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          {total}
        </div>
      </div>

      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
        <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Active Quizzes</div>
        <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          {quizzes.filter((q: Quiz) => q.is_active).length}
        </div>
      </div>

      <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
        <div className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>Total Questions</div>
        <div className={`text-2xl font-semibold mt-1 ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
          {quizzes.reduce((sum: number, q: Quiz) => sum + (q.question_count || 0), 0)}
        </div>
      </div>
    </div>
  );
}
