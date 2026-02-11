import React from 'react';
import { QuizTag } from './types';
import Combobox from '../../ui/combobox/Combobox';

interface QuizFiltersProps {
  darkMode: boolean;
  search: string;
  setSearch: (value: string) => void;
  tagFilter: string;
  setTagFilter: (value: string) => void;
  activeFilter: string;
  setActiveFilter: (value: string) => void;
  setPage: (value: number) => void;
  quizTags: QuizTag[];
  onCreateQuiz: () => void;
  showBulkQuizUpload: boolean;
  onToggleBulkQuizUpload: () => void;
}

export default function QuizFilters({
  darkMode,
  search,
  setSearch,
  tagFilter,
  setTagFilter,
  activeFilter,
  setActiveFilter,
  setPage,
  quizTags,
  onCreateQuiz,
  showBulkQuizUpload,
  onToggleBulkQuizUpload,
}: QuizFiltersProps) {
  return (
    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <input
          type="text"
          placeholder="Search quizzes..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className={`px-3 py-2 rounded-lg border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
        />

        <Combobox
          options={quizTags.map((tag: QuizTag) => ({ id: tag.id, label: tag.name }))}
          value={tagFilter}
          onChange={(value) => {
            setTagFilter(value);
            setPage(1);
          }}
          placeholder="All Tags"
          allowClear
        />

        <Combobox
          options={[
            { id: 'true', label: 'Active' },
            { id: 'false', label: 'Inactive' },
          ]}
          value={activeFilter}
          onChange={(value) => {
            setActiveFilter(value);
            setPage(1);
          }}
          placeholder="All Status"
          allowClear
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCreateQuiz}
          className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
        >
          Create Quiz
        </button>
        <button
          onClick={onToggleBulkQuizUpload}
          className={`px-4 py-2 rounded-lg border ${darkMode ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-border' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
        >
          {showBulkQuizUpload ? 'Hide' : '\uD83D\uDCE4'} Bulk Upload Quizzes
        </button>
      </div>
    </div>
  );
}
