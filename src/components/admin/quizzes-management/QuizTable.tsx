import React from 'react';
import { getIconPath } from '../../../utils/iconUtils';
import { LoadingSpinner } from '../../shared';
import { Quiz, QuizTag } from './types';
import { formatDate } from './utils';
import Combobox from '../../ui/combobox/Combobox';

interface QuizTableProps {
  darkMode: boolean;
  loading: boolean;
  error: string | null;
  quizzes: Quiz[];
  selectedQuizIds: string[];
  page: number;
  perPage: number;
  totalPages: number;
  total: number;
  setPage: (value: number) => void;
  setPerPage: (value: number) => void;
  onSelectAllQuizzes: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectQuiz: (quizId: string) => void;
  onClearQuizSelection: () => void;
  onOpenBulkDelete: () => void;
  onEditQuiz: (quiz: Quiz) => void;
  onCloneQuiz: (quiz: Quiz) => void;
  onRequestDelete: (quiz: Quiz) => void;
  onToggleActive: (quiz: Quiz) => void;
}

export default function QuizTable({
  darkMode,
  loading,
  error,
  quizzes,
  selectedQuizIds,
  page,
  perPage,
  totalPages,
  total,
  setPage,
  setPerPage,
  onSelectAllQuizzes,
  onSelectQuiz,
  onClearQuizSelection,
  onOpenBulkDelete,
  onEditQuiz,
  onCloneQuiz,
  onRequestDelete,
  onToggleActive,
}: QuizTableProps) {
  return (
    <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
      {loading ? (
        <LoadingSpinner height="py-12" />
      ) : error ? (
        <div className="text-red-500 text-center py-12">Error: {error}</div>
      ) : (
        <>
          {/* Bulk Actions Bar */}
          {selectedQuizIds.length > 0 && (
            <div className="px-6 pt-4">
              <div className={`p-4 rounded-lg border flex items-center justify-between ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-center gap-4">
                  <span className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    {selectedQuizIds.length} quiz{selectedQuizIds.length !== 1 ? 'zes' : ''} selected
                  </span>
                  {selectedQuizIds.length > 100 && (
                    <span className="text-sm text-red-600 font-medium">
                      Warning: Maximum 100 quizzes can be deleted at once
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onOpenBulkDelete}
                    disabled={selectedQuizIds.length > 100}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedQuizIds.length > 100
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-600 text-white hover:bg-red-700'
                    }`}
                  >
                    Bulk Delete
                  </button>
                  <button
                    onClick={onClearQuizSelection}
                    className={`px-4 py-2 rounded-lg border ${darkMode ? 'border-zenible-dark-border text-zenible-dark-text hover:bg-zenible-dark-border' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                  >
                    Clear Selection
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                <tr>
                  <th className={`px-4 py-3 text-left ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    <input
                      type="checkbox"
                      checked={quizzes.length > 0 && selectedQuizIds.length === quizzes.length}
                      onChange={onSelectAllQuizzes}
                      className="rounded"
                    />
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    Title
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    Description
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    Tags
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    Questions
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    Total Points
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    Status
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    Created
                  </th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-neutral-200'}`}>
                {quizzes.map((quiz: Quiz) => (
                  <tr
                    key={quiz.id}
                    className={selectedQuizIds.includes(quiz.id) ? (darkMode ? 'bg-zenible-primary bg-opacity-10' : 'bg-blue-50') : ''}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedQuizIds.includes(quiz.id)}
                        onChange={() => onSelectQuiz(quiz.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {quiz.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {quiz.description ? (quiz.description.length > 50 ? quiz.description.substring(0, 50) + '...' : quiz.description) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-2">
                        {(quiz.tags && quiz.tags.length > 0) ? (
                          quiz.tags.map((tag: QuizTag) => (
                            <div key={tag.id} className={`flex items-center gap-1 px-2 py-1 rounded-md ${darkMode ? 'bg-zenible-dark-border' : 'bg-gray-100 border border-gray-300'}`}>
                              <svg className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-zenible-dark-text' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(tag.icon ?? 'book-open')} />
                              </svg>
                              <span className={`text-xs font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>{tag.name}</span>
                            </div>
                          ))
                        ) : (
                          <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>No tags</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${darkMode ? 'bg-zenible-dark-border text-zenible-dark-text' : 'bg-gray-100 text-gray-700'}`}>
                        {quiz.question_count || 0} questions
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                        {quiz.total_points || 0} pts
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => onToggleActive(quiz)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          quiz.is_active ? 'bg-zenible-primary' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            quiz.is_active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                        {formatDate(quiz.created_at ?? '')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onEditQuiz(quiz)}
                          className="text-zenible-primary hover:opacity-80"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onCloneQuiz(quiz)}
                          className="text-zenible-primary hover:opacity-80"
                        >
                          Clone
                        </button>
                        <button
                          onClick={() => onRequestDelete(quiz)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={`px-6 py-3 border-t ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                  Page {page} of {totalPages} ({total} total)
                </span>
                <Combobox
                  options={[
                    { id: '10', label: '10 per page' },
                    { id: '20', label: '20 per page' },
                    { id: '50', label: '50 per page' },
                    { id: '100', label: '100 per page' },
                  ]}
                  value={String(perPage)}
                  onChange={(value) => {
                    setPerPage(parseInt(value || '10'));
                    setPage(1);
                  }}
                  placeholder="Per page"
                  allowClear={false}
                  className="w-36"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className={`px-3 py-1 text-sm rounded ${
                    page === 1
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-zenible-primary text-white hover:bg-opacity-90'
                  }`}
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className={`px-3 py-1 text-sm rounded ${
                    page === totalPages
                      ? 'bg-gray-300 cursor-not-allowed'
                      : 'bg-zenible-primary text-white hover:bg-opacity-90'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
