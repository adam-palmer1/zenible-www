import React from 'react';
import { getIconPath } from '../../../utils/iconUtils';
import { LoadingSpinner } from '../../shared';
import { QuizTag } from './types';

interface TagsTableProps {
  darkMode: boolean;
  loading: boolean;
  error: string | null;
  tags: QuizTag[];
  selectedTagIds: string[];
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onSelectAll: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectTag: (tagId: string) => void;
  onToggleActive: (tag: QuizTag) => void;
  onEditTag: (tag: QuizTag) => void;
  onRequestDelete: (tag: QuizTag) => void;
  getPlanNames: (tag: QuizTag) => string;
  formatDate: (dateString: string | undefined) => string;
  setPage: (page: number) => void;
  setPerPage: (perPage: number) => void;
}

export default function TagsTable({
  darkMode,
  loading,
  error,
  tags,
  selectedTagIds,
  page,
  totalPages,
  total,
  perPage,
  onSelectAll,
  onSelectTag,
  onToggleActive,
  onEditTag,
  onRequestDelete,
  getPlanNames,
  formatDate,
  setPage,
  setPerPage,
}: TagsTableProps) {
  return (
    <div className="px-6 pb-6">
      <div className={`rounded-xl border overflow-hidden ${darkMode ? 'bg-zenible-dark-card border-zenible-dark-border' : 'bg-white border-neutral-200'}`}>
        {loading ? (
          <LoadingSpinner height="py-12" />
        ) : error ? (
          <div className="text-red-500 text-center py-12">Error: {error}</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
                  <tr>
                    <th className={`px-6 py-3 text-left ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                      <input
                        type="checkbox"
                        checked={tags.length > 0 && selectedTagIds.length === tags.length}
                        onChange={onSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                      Name
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                      Description
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                      Associated Plans
                    </th>
                    <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                      Quizzes
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
                  {tags.map((tag: QuizTag) => (
                    <tr key={tag.id} className={selectedTagIds.includes(tag.id) ? (darkMode ? 'bg-zenible-primary bg-opacity-10' : 'bg-blue-50') : ''}>
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTagIds.includes(tag.id)}
                          onChange={() => onSelectTag(tag.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getIconPath(tag.icon ?? 'book-open')} />
                          </svg>
                          <div className={`text-sm font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            {tag.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {tag.description || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`text-sm ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {getPlanNames(tag)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${darkMode ? 'bg-zenible-dark-border text-zenible-dark-text' : 'bg-gray-100 text-gray-700'}`}>
                          {tag.quiz_count || 0} quizzes
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => onToggleActive(tag)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            tag.is_active ? 'bg-zenible-primary' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              tag.is_active ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          {formatDate(tag.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => onEditTag(tag)}
                            className="text-zenible-primary hover:opacity-80"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              onRequestDelete(tag);
                            }}
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
                  <select
                    value={perPage}
                    onChange={(e) => {
                      setPerPage(parseInt(e.target.value));
                      setPage(1);
                    }}
                    className={`px-2 py-1 text-sm rounded border ${darkMode ? 'bg-zenible-dark-bg border-zenible-dark-border text-zenible-dark-text' : 'bg-white border-neutral-200'}`}
                  >
                    <option value="10">10 per page</option>
                    <option value="20">20 per page</option>
                    <option value="50">50 per page</option>
                    <option value="100">100 per page</option>
                  </select>
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
    </div>
  );
}
