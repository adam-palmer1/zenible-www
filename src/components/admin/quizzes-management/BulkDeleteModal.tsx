import React from 'react';
import { BulkDeleteResult, Quiz } from './types';

interface BulkDeleteModalProps {
  darkMode: boolean;
  selectedQuizIds: string[];
  selectedQuizzes: Quiz[];
  bulkDeleteResult: BulkDeleteResult | null;
  onBulkDelete: () => void;
  onClose: () => void;
  onCloseWithResult: () => void;
}

export default function BulkDeleteModal({
  darkMode,
  selectedQuizIds,
  selectedQuizzes,
  bulkDeleteResult,
  onBulkDelete,
  onClose,
  onCloseWithResult,
}: BulkDeleteModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={`w-full max-w-2xl rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'} max-h-[90vh] overflow-y-auto`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            Confirm Bulk Delete
          </h3>
        </div>

        <div className="p-6 space-y-4">
          {!bulkDeleteResult ? (
            <>
              <div className={`p-4 rounded-lg ${darkMode ? 'bg-red-900 bg-opacity-20 border border-red-700' : 'bg-red-50 border border-red-200'}`}>
                <p className={`font-medium ${darkMode ? 'text-red-400' : 'text-red-800'}`}>
                  Warning: This action cannot be undone!
                </p>
                <p className={`text-sm mt-1 ${darkMode ? 'text-red-300' : 'text-red-700'}`}>
                  You are about to delete {selectedQuizIds.length} quiz{selectedQuizIds.length !== 1 ? 'zes' : ''}.
                  This will also delete all associated questions, answers, user attempts, and logs.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                  Selected Quizzes ({selectedQuizzes.length}):
                </h4>
                <div className={`max-h-60 overflow-y-auto rounded-lg border ${darkMode ? 'border-zenible-dark-border' : 'border-gray-200'}`}>
                  <ul className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-gray-200'}`}>
                    {selectedQuizzes.map((quiz: Quiz) => (
                      <li key={quiz.id} className={`px-4 py-3 ${darkMode ? 'hover:bg-zenible-dark-border' : 'hover:bg-gray-50'}`}>
                        <div className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                          {quiz.title}
                        </div>
                        <div className={`text-sm mt-1 ${darkMode ? 'text-zenible-dark-text-secondary' : 'text-gray-500'}`}>
                          {quiz.question_count || 0} questions &bull; {quiz.total_points || 0} points
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg border ${
                bulkDeleteResult.failed === 0
                  ? (darkMode ? 'bg-green-900 bg-opacity-20 border-green-700' : 'bg-green-50 border-green-200')
                  : (darkMode ? 'bg-yellow-900 bg-opacity-20 border-yellow-700' : 'bg-yellow-50 border-yellow-200')
              }`}>
                <p className={`font-medium ${
                  bulkDeleteResult.failed === 0
                    ? (darkMode ? 'text-green-400' : 'text-green-800')
                    : (darkMode ? 'text-yellow-400' : 'text-yellow-800')
                }`}>
                  {bulkDeleteResult.failed === 0
                    ? 'All quizzes deleted successfully!'
                    : `Partial success: ${bulkDeleteResult.deleted} of ${bulkDeleteResult.total} quizzes deleted`
                  }
                </p>
              </div>

              {bulkDeleteResult.failed > 0 && bulkDeleteResult.errors && bulkDeleteResult.errors.length > 0 && (
                <div className="space-y-2">
                  <h4 className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                    Failed Deletions ({bulkDeleteResult.errors.length}):
                  </h4>
                  <div className={`max-h-60 overflow-y-auto rounded-lg border ${darkMode ? 'border-zenible-dark-border' : 'border-gray-200'}`}>
                    <ul className={`divide-y ${darkMode ? 'divide-zenible-dark-border' : 'divide-gray-200'}`}>
                      {bulkDeleteResult.errors.map((error: { quiz_id: string; error?: string }, index: number) => (
                        <li key={index} className={`px-4 py-3 ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
                          <div className={`font-medium ${darkMode ? 'text-zenible-dark-text' : 'text-gray-900'}`}>
                            Quiz ID: {error.quiz_id}
                          </div>
                          <div className="text-sm mt-1 text-red-600">
                            {error.error || 'Unknown error'}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          {!bulkDeleteResult ? (
            <>
              <button
                onClick={onBulkDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete {selectedQuizIds.length} Quiz{selectedQuizIds.length !== 1 ? 'zes' : ''}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={onCloseWithResult}
              className="px-4 py-2 bg-zenible-primary text-white rounded-lg hover:bg-opacity-90"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
