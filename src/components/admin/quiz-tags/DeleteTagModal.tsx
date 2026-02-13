import React from 'react';
import { QuizTag } from './types';
import { useEscapeKey } from '../../../hooks/useEscapeKey';

interface DeleteTagModalProps {
  darkMode: boolean;
  tag: QuizTag;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteTagModal({
  darkMode,
  tag,
  loading,
  onConfirm,
  onCancel,
}: DeleteTagModalProps) {
  useEscapeKey(onCancel);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className={`w-full max-w-md mx-4 rounded-xl ${darkMode ? 'bg-zenible-dark-card' : 'bg-white'}`}>
        <div className={`px-6 py-4 border-b ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <h3 className={`text-lg font-semibold ${darkMode ? 'text-zenible-dark-text' : 'text-zinc-950'}`}>
            Confirm Delete
          </h3>
        </div>
        <div className="p-6">
          <p className={`${darkMode ? 'text-zenible-dark-text' : 'text-gray-700'}`}>
            Are you sure you want to delete the tag "{tag.name}"?
          </p>
          {(tag.quiz_count ?? 0) > 0 && (
            <p className={`mt-2 text-sm text-yellow-600`}>
              Warning: This tag is associated with {tag.quiz_count} quiz(zes). Deleting it may affect those quizzes.
            </p>
          )}
        </div>
        <div className={`px-6 py-4 border-t flex gap-2 ${darkMode ? 'border-zenible-dark-border' : 'border-neutral-200'}`}>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Deleting...' : 'Delete'}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
